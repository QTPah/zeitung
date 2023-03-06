import { default as express } from 'express';
import * as jwt from 'jsonwebtoken';

import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { default as multer } from 'multer';
import { convertToHtml } from "mammoth"

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

import { createLogger } from './Utils/logger';
import { Error } from './Utils/httpUtils';
import { createTranslator } from './Utils/language';
import { hasPermission, Role } from './Utils/permissions';
import { Blacklist } from './Utils/blacklist';
import { default as monk } from 'monk';

//#region Configuring and Setting up

// Initialize dotenv to allow to read .env files
let dotenvError = dotenv.config({ path : process.argv[2] }).error;

if(dotenvError) throw 'Failed to load environment file: ' + dotenvError;


// Set up the Logger (from utils)
const logger = createLogger({
    applicationName: 'NEWS_SITE',
    format: '{DATE_DMY} {TIME_HMS} {DIVISION} : {LOG}',
    logsPath: process.env.LOG_PATH || '../logs',
    maxLogFiles: parseInt(process.env.LOG_CAPACITY || "5")
});

logger.log('Logger configured. Setting up services', 'Server');


// Set up express
const app = express();

// Setting application type to JSON and setting up Cross Origin policy
app.use(express.json());
app.use(require('cors')());

// If server is not running in dev mode, serve react static files
if(process.argv[3] != "dev") {
    let staticPath = path.join(__dirname, '..',  '..', 'client/dist');
    app.use(express.static(staticPath));

    logger.log(`Setting static directory to be served to ${staticPath}`, 'Main/Express');
} else {
    logger.log(`DEV MODE ENABLED`, 'Main');
}


// Set up email transporter
const emailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.MAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD
    }
});


// Set up Database (from utils)
const db = monk(process.env.DB_URL || 'mongodb://localhost:27017/news', {
    auth: {
        user: process.env.DB_USER || "",
        password: process.env.DB_PASSWORD || ""
    }
});

db.then(() => {
    logger.log(`Successfully connected to database (${process.env.DB_URL}) with user ${process.env.DB_USER}`, 'Database');
});


// Set up translator (from utils)
const translator = createTranslator(__dirname + '/../translations/translations.json');
const defaultLanguage = 'de';

logger.log(`Successfully loaded translation file (${translator.filePath})`, 'Translator');

// Set up blacklist (from utils)
Blacklist.instance = new Blacklist(process.env.BLACKLIST_PATH || path.join(__dirname, '/../blacklist.json'))
const blacklist = Blacklist.instance;

logger.log(`Successfully loaded blacklist file (${blacklist.filePath})`, 'Blacklist');

//#endregion

//#region Set up types and interfaces

export interface IGetUserAuthInfoRequest extends express.Request {
    user?: any
}

// AUTHENTICATION MIDDLEWARE
async function authTokenMiddleware(req : IGetUserAuthInfoRequest, res : express.Response, next : express.NextFunction) {
    // Grab the token from the request header and remove the "Bearer" from the header (header is "Bearer [TOKEN]")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // check if token exists
  if(!token) return res.sendStatus(401);
  if(!process.env.ACCESS_TOKEN_SECRET) throw 'Access Token Secret (ACCESS_TOKEN_SECRET) not defined in .env!';

  // Try to decrypt the token with env.ACCESS_TOKEN_SECRET
  try {
      let user : any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if(!user) return res.sendStatus(403);

      if(Blacklist.instance.isBlacklisted(user.email)) {
        logger.log(`${user.email} tried to access site but got blacklisted 🤡`, "Blacklist");
        return res.status(403).json({ err: 'BLACKLIST' });
      }

      req.user = await db.get('users').findOne({ _id: user._id });
  } catch(error) {
      return res.sendStatus(403);
  }

  next();
}

//#endregion


//#region Auth endpoints

type emailVerification = { email : string, password : string, code : string };
const emailVerificationCache : emailVerification[] = [];

app.post('/auth/register', async (req, res) => {
    let { email, password, code } = req.body;
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;
    
    // Check if all fields are given 
    if((!email || !password) && !code) {
        logger.log(`${email || 'Someone'} attempted to register through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough credentials`, 'Auth/Register');
        return Error(translator.getPhrase('MISSING_CREDENTIALS', language), 400, res);
    }

    // Only allow emails ending with @edu.sbl.ch or @sbl.ch
    if(email.split('@')[1] != 'edu.sbl.ch' && email.split('@')[1] != 'sbl.ch') {
        logger.log(`${email} tried to register with wrong email address through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Register');
        return Error(translator.getPhrase('WRONG_EMAIL', language), 400, res);
    }

    // Inline if statement checks if user tries to register or verify email address
    logger.log(code === undefined ?
        `${email} is attempting to register through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})` :
        `${email || 'Someone'} is verifying email address with code ${code} through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Register');

    // Handle email verification
    if(code) {
        const verifiedCredentials = emailVerificationCache.find(x => x.code == code);

        if(!verifiedCredentials) {
            logger.log(`${email || 'Someone'} failed to verify with wrong verification code (${code}) through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Register')
            return Error(translator.getPhrase('WRONG_VERIFICATION_CODE', language), 400, res);
        }

        // Check if theres already a user registred with that email
        if(await db.get('users').findOne({ email:  { $regex: `^${email.split('@')[0]}` } })) {
            logger.log(`${verifiedCredentials.email} tried to register a second time`, 'Auth/Register');
            return Error(translator.getPhrase('USER_ALREADY_EXISTS', language), 400, res);
        }


        // Proceed to write to database

        const hashedPassword = await bcrypt.hash(verifiedCredentials.password, 10);

        try {
            await db.get('users').insert({
                email: verifiedCredentials.email,
                password: hashedPassword,
                status: {
                    roles: [new Role('user', ["VIEW_POSTS"])],
                    score: 0,
                    badges: []
                }
            });
        } catch(err) {
            logger.log(`Failed to insert new user (${verifiedCredentials.email}) into database: ${err}`, 'Auth/Register/Database');
            return Error(translator.getPhrase('SERVER_ERROR', language), 500, res);
        }

        emailVerificationCache.splice(emailVerificationCache.findIndex(e => e.email == verifiedCredentials.email), 1);

        res.status(200).json({ res: translator.getPhrase('SUCCESSFULLY_REGISTERED', language) });

        logger.log(`User ${verifiedCredentials.email} successfully registered!`, 'Auth/Register');
    } else {
        // Send code to given email

        const code = Math.floor(Math.random() * (999999 - 111111 + 1) + 111111);

        logger.log(`Sending email verification code ${code} to ${email}`, 'Auth/Register/Code')

        try {
            await emailTransporter.sendMail({
                from: 'zeitung.zeitung.cool@gmail.com',
                to: email,
                subject: translator.getPhrase('VERIFICATION_CODE_MAIL_SUBJECT', language),
                html: `<h1>${code}</h1>`
            });
        } catch(err) {
            logger.log(`Failed to send ${email} mail: ${err}`, 'Auth/Register/Code');
            return Error(translator.getPhrase('SERVER_ERROR', language), 500, res);
        }

        emailVerificationCache.push({ email, password, code: code.toString() });

        res.status(200).json({ res: translator.getPhrase('VERIFICATION_CODE_SENT', language) });

        logger.log(`Successfully sent code ${code} to ${email}`, 'Auth/Register/Code');
    }
});

app.post('/auth/login', async (req, res) => {
    let { email, password } = req.body;
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    
    // Check if all fields are given 
    if(!email || !password) {
        logger.log(`${email || 'Someone'} attempted to log in through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough credentials`, 'Auth/Login');
        return Error(translator.getPhrase('MISSING_CREDENTIALS', language), 400, res);
    }

    logger.log(`${email} is attempting to login through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Login');

    if(blacklist.isBlacklisted(email)) {
        logger.log(`${email} is blacklisted`, 'Auth/Login');
        return Error(translator.getPhrase('BLACKLISTED', language), 403, res);
    }

    const user = await db.get('users').findOne({ email:  { $regex: `^${email.split('@')[0]}` } });

    if(!user) {
        logger.log(`${email} attempted to log in through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't register themselves yet`, 'Auth/Login');
        return Error(translator.getPhrase('REGISTER_FIRST', language), 400, res);
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if(!isPasswordMatching) {
        logger.log(`${email} attempted to log in through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but provided the wrong password`, 'Auth/Login');
        return Error(translator.getPhrase('WRONG_PASSWORD', language), 400, res);
    }

    // Delete the password field so it won't be included in the tokens
    delete user.password;
    delete user.refreshToken;

    if(!process.env.ACCESS_TOKEN_SECRET) throw 'Access Token Secret (ACCESS_TOKEN_SECRET) not set in .env!';
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn : process.env.ACCESS_TOKEN_LIFETIME });

    if(!process.env.REFRESH_TOKEN_SECRET) throw 'Refresh Token Secret (REFRESH_TOKEN_SECRET) not set in .env!';
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

    // Update the refresh token to the database
    try {
        await db.get('users').findOneAndUpdate({ email:  { $regex: `^${email.split('@')[0]}` } }, { $set: { refreshToken } });
    } catch(error) {
        logger.log(`Failed to update refresh token to database for "${email}": ${error}`, 'Auth/Login/Database');
        return Error(translator.getPhrase('SERVER_ERROR', language), 500, res);
    }

    res.status(200).json({ res: translator.getPhrase('SUCCESSFULLY_LOGGED_IN', language), accessToken, refreshToken });
    logger.log(`"${email}" successfully logged in through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Login');
});

app.post('/auth/refresh_token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    
    // Check if all fields are given 
    if(!refreshToken) {
        logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) is trying to get a new access token but didn't provide the refresh token.`, 'Auth/RefreshToken');
        return res.sendStatus(422);
    }

    const dbUser = await db.get('users').findOne({ refreshToken });

    if(!dbUser) {
        logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) tried to get a new access token but the refresh token was invalid`, 'Auth/RefreshToken');
        return res.sendStatus(403);
    }

    logger.log(`Sending ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) a new access token`, 'Auth/RefreshToken');

    if(!process.env.REFRESH_TOKEN_SECRET) throw 'Refresh Token Secret (REFRESH_TOKEN_SECRET) not set in .env!';
    let user : any;
    try {
        user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || '');
    } catch(error) {
        logger.log(`${dbUser.email} (${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})) tried to get a new access token but the refresh token was invalid`, 'Auth/RefreshToken');
        return res.sendStatus(403);
    }

    delete user.iat;

    if(!process.env.ACCESS_TOKEN_SECRET) throw 'Access Token Secret (ACCESS_TOKEN_SECRET) not set in .env!';
    res.status(200).json({ token: jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_LIFETIME }) });
});

app.post('/auth/token', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    if(req.user) {
        req.user = await db.get('users').findOne({ _id : req.user._id });
        return res.status(200).json({ user: req.user });
    }
    res.sendStatus(500);
});

app.delete('/auth/logout', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    
    try {
        await db.get('users').findOneAndUpdate({ _id: req.user._id }, { $set: { refreshToken: "" } })
    } catch(error) {}

    res.sendStatus(204);
    logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) Logged out`, 'Auth/Logout');
});

//#endregion


//#region Profile Picture API

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, process.env.STATIC_PATH || 'static', 'images'));
    },
    filename: (req, file, cb) => {
        // @ts-ignore
        req.imageIndex += path.extname(file.originalname);
        // @ts-ignore
        cb(null, req.imageIndex);
    }
});

const imageUpload = multer({ storage: imageStorage })

app.post('/api/upload_profile_picture', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res, next) => {
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!req.user) return res.sendStatus(403);

    logger.log(`${req.user.email} is attempting to update their profile picture through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/ProfilePictureUpload');

    const dbUser = await db.get('users').findOne({ email: req.user.email });

    // 30 second upload cooldown
    if(dbUser.profilePictureImageIndex && parseInt(dbUser.profilePictureImageIndex.split('.')[0], 16) - Date.now() < 30000) {
        logger.log(`${req.user.email} tried to update their profile picture but is on cooldown (${new Date(dbUser.profilePictureImageIndex.split('.')[0], 16 - Date.now()).getUTCSeconds().toString()} seconds remaining)`, 'API/ProfilePictureUpload');
        return Error(translator.getPhrase('UPLOAD_COOLDOWN', language, new Date(dbUser.profilePictureImageIndex.split('.')[0], 16 - Date.now()).getUTCSeconds().toString()), 400, res);
    }

    fs.unlink(path.join(__dirname, process.env.STATIC_PATH || 'static', 'images', dbUser.profilePictureIndex), err => {
        logger.log(`${req.user.email} removed their old profile picture (index ${dbUser.profilePictureIndex}) whilst trying to update their profile picture`, 'API/ProfilePictureUpload');
    });

    // @ts-ignore
    req.imageIndex = `${Date.now().toString(16)}.${crypto.randomBytes(8).toString('hex')}`;
    
    next();

}, imageUpload.single('profilePicture'), async (req : IGetUserAuthInfoRequest, res) => {
    
    // @ts-ignore
    await db.get('users').findOneAndUpdate({ email : req.user.email }, { $set: { profilePictureIndex: req.imageIndex } });

    // @ts-ignore
    logger.log(`${req.user.email} successfully updated their profile picture (index ${req.imageIndex}) through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/ProfilePictureUpload');

    // @ts-ignore
    res.status(200).json({ index: req.imageIndex });
});


app.post('/api/upload_image', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res, next) => {
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!req.user) return res.sendStatus(403);

    logger.log(`${req.user.email} is attempting to upload an image through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/UploadImage');

    const dbUser = await db.get('users').findOne({ email: req.user.email });

    // 30 second upload cooldown
    if(dbUser.profilePictureImageIndex && parseInt(dbUser.profilePictureImageIndex.split('.')[0], 16) - Date.now() < 30000) {
        logger.log(`${req.user.email} tried to upload an image but is on cooldown (${new Date(dbUser.profilePictureImageIndex.split('.')[0], 16 - Date.now()).getUTCSeconds().toString()} seconds remaining)`, 'API/UploadImage');
        return Error(translator.getPhrase('UPLOAD_COOLDOWN', language, new Date(dbUser.profilePictureImageIndex.split('.')[0], 16 - Date.now()).getUTCSeconds().toString()), 400, res);
    }

    // @ts-ignore
    req.imageIndex = `${Date.now().toString(16)}.${crypto.randomBytes(8).toString('hex')}`;
    
    next();

}, imageUpload.single('image'), async (req : IGetUserAuthInfoRequest, res) => {

    // @ts-ignore
    logger.log(`${req.user.email} successfully uploaded image (index ${req.imageIndex}) through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/UploadImage');

    // @ts-ignore
    res.status(200).json({ index: req.imageIndex });
});


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, process.env.STATIC_PATH || 'static', 'files'));
    },
    filename: (req, file, cb) => {
        // @ts-ignore
        req.fileIndex += path.extname(file.originalname);
        // @ts-ignore
        cb(null, req.fileIndex);
    }
});

const fileUpload = multer({ storage: fileStorage });

app.post('/api/upload', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res, next) => {
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!req.user) return res.sendStatus(403);

    logger.log(`${req.user.email} is attempting to upload a file through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/UploadImage');

    const dbUser = await db.get('users').findOne({ email: req.user.email });

    // @ts-ignore
    req.fileIndex = `${Date.now().toString(16)}.${crypto.randomBytes(8).toString('hex')}`;
    
    next();

}, fileUpload.single('file'), async (req : IGetUserAuthInfoRequest, res) => {

    // @ts-ignore
    logger.log(`${req.user.email} successfully uploaded file (index ${req.imageIndex}) through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/UploadImage');

    // @ts-ignore
    res.status(200).json({ index: req.fileIndex });
});

app.get('/api/download', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let index = req.query.index;

    if(!index) {
        logger.log(`${req.user.email} tried to get image but didn't provide an index`, 'Image/Get');
        return res.sendStatus(422);
    }

    let image : Buffer;
    try {
        image = fs.readFileSync(path.join(__dirname, process.env.STATIC_PATH || `images`, index.toString()));
    } catch(error) {
        logger.log(`${req.user.email} tried to get image but provided an invalid index (${index})`, 'Image/Get');
        return res.sendStatus(404);
    }

    // @ts-ignore
    res.json({ image: `data:text/plain;base64,${image.toString('base64url')}` });
});


app.get('/api/get_image', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let index = req.query.index;

    if(!index) {
        logger.log(`${req.user.email} tried to get image but didn't provide an index`, 'Image/Get');
        return res.sendStatus(422);
    }

    let image : Buffer;
    try {
        image = fs.readFileSync(path.join(__dirname, process.env.STATIC_PATH || 'static', 'images', index.toString()));
    } catch(error) {
        logger.log(`${req.user.email} tried to get image but provided an invalid index (${index})`, 'Image/Get');
        return res.sendStatus(404);
    }

    // @ts-ignore
    res.json({ image: `data:image/${index.split('.')[index.split('.').length - 1]};base64,${image.toString('base64')}` });
});
//#endregion


//#region Posts API

app.post('/api/post/create', authTokenMiddleware, (req : IGetUserAuthInfoRequest, res) => {
    const { title, lead, body, image } = req.body;
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!(title || lead || body || image)) {
        logger.log(`${req.user.email} attempted to create post through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough fields`, 'API/CreatePost');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "CREATE_POSTS")) {
        logger.log(`${req.user.email} attempted to create post through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/CreatePost');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    logger.log(`${req.user.email} successfully created post through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/CreatePost');

    // @ts-ignore
    db.get('posts').insert({ title, lead, body, image });

    res.sendStatus(200);
});

app.get('/api/get_post', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let id = req.query.id;

    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!id) {
        logger.log(`${req.user.email} attempted to get post through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide an ID`, 'API/GetPost');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "VIEW_POSTS")) {
        logger.log(`${req.user.email} attempted to get post through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/GetPost');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    let post = await db.get('posts').findOne({ _id: id });

    post.body = await convertToHtml({ path: `static/files/${post.body}` }).catch((err) => {
        if(!id) {
            logger.log(`An error occured while providing ${req.user.email} with post ${post._id}: ${err}`, 'API/GetPost');
            return Error(translator.getPhrase('SERVER_ERROR', language), 400, res);
        }
    });

    res.status(200).json({ post });
});

app.get('/api/get_posts', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!hasPermission(req.user, "VIEW_POSTS")) {
        logger.log(`${req.user.email} attempted to get post through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/GetPost');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    res.status(200).json({ posts: await db.get('posts').find() });
});

app.get('/api/get_users', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!hasPermission(req.user, "VIEW_USERS")) {
        logger.log(`${req.user.email} attempted to get users through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/GetUsers');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    logger.log(`${req.user.email} successfully got users through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/GetUsers');

    res.status(200).json({ users: await db.get('users').find() });
});


app.post('/api/create_role', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let { name, permissions } = req.body;
    
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!name || !permissions) {
        logger.log(`${req.user.email} attempted to create role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough fields`, 'API/CreateRole');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "CREATE_ROLES")) {
        logger.log(`${req.user.email} attempted to create role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/CreateRole');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    const role = await db.get('roles').insert({ name, permissions });

    logger.log(`${req.user.email} successfully created role ${role._id} through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/CreateRole');

    res.status(200).json({ roles: hasPermission(req.user, "VIEW_ROLES") ? await db.get('roles').find() : [] });
});

app.delete('/api/delete_role', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let { id } = req.body;

    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!id) {
        logger.log(`${req.user.email} attempted to delete role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough fields`, 'API/DeleteRole');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "DELETE_ROLES")) {
        logger.log(`${req.user.email} attempted to delete role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/DeleteRole');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    try {
        await db.get('roles').remove({ _id: id });
    } catch(err) {
        logger.log(`${req.user.email} attempted to delete role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but role didn't exist`, 'API/DeleteRole');
        return Error(translator.getPhrase('ROLE_NOT_FOUND', language), 400, res);
    }

    logger.log(`${req.user.email} successfully deleted role ${id} through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/DeleteRole');

    res.status(200).json({ roles: hasPermission(req.user, "VIEW_ROLES") ? await db.get('roles').find() : [] });
});

app.post('/api/add_role', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let { userId, roleId } = req.body;

    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!userId || !roleId) {
        logger.log(`${req.user.email} attempted to add role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough fields`, 'API/AddRole');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "ADD_ROLES")) {
        logger.log(`${req.user.email} attempted to add role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/AddRole');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    const role = await db.get('roles').findOne({ _id: roleId });

    if(!role) {
        logger.log(`${req.user.email} attempted to add role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but the role didn't exist`, 'API/AddRole');
        return Error(translator.getPhrase('ROLE_NOT_FOUND', language), 400, res);
    }

    await db.get('users').update({ _id: userId }, { $push: { roles: role } });
    const user = await db.get('users').findOne({ _id: userId });

    logger.log(`${req.user.email} successfully added role ${role.name} (${role._id}) to user ${user.email} through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/AddRole');

    res.status(200);
});

app.delete('/api/remove_role', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let { userId, roleId } = req.body;

    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!userId || !roleId) {
        logger.log(`${req.user.email} attempted to remove role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough fields`, 'API/RemoveRole');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "REMOVE_ROLES")) {
        logger.log(`${req.user.email} attempted to remove role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/RemoveRole');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    const role = await db.get('roles').findOne({ _id: roleId });

    if(!role) {
        logger.log(`${req.user.email} attempted to remove role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but the role didn't exist`, 'API/RemoveRole');
        return Error(translator.getPhrase('ROLE_NOT_FOUND', language), 400, res);
    }

    const user = await db.get('users').findOneAndUpdate({ _id: userId }, { $pull: { roles: role } });

    logger.log(`${req.user.email} successfully removed role ${role.name} (${role._id}) from user ${user.email} through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/RemoveRole');

    res.status(200);
});

app.get('/api/get_roles', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!hasPermission(req.user, "VIEW_ROLES")) {
        logger.log(`${req.user.email} attempted to get roles through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/GetRoles');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    const roles = await db.get('roles').find();
    res.status(200).json({ roles: hasPermission(req.user, "VIEW_ROLES") ? roles : [] });
});

app.put('/api/update_role', authTokenMiddleware, async (req : IGetUserAuthInfoRequest, res) => {
    let { roleId, name, permissions } = req.body;

    let language : string = req.headers['accept-language'] || defaultLanguage;

    // Check if translation files support the requested language. If not switch to english
    if(!translator.getPhrase('TEST', language)) language = defaultLanguage;

    if(!roleId || !name || !permissions) {
        logger.log(`${req.user.email} attempted to update role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough fields`, 'API/UpdateRole');
        return Error(translator.getPhrase('MISSING_FIELDS', language), 400, res);
    }

    if(!hasPermission(req.user, "EDIT_ROLES")) {
        logger.log(`${req.user.email} attempted to update role through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't have enough permissions`, 'API/UpdateRole');
        return Error(translator.getPhrase('MISSING_PERMISSIONS', language), 400, res);
    }

    db.get('roles').update({ _id: roleId }, { $set: { name, permissions } });

    logger.log(`${req.user.email} successfully updated role ${name} (${roleId}) through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'API/UpdateRole');

    res.status(200).json({ roles: hasPermission(req.user, "VIEW_ROLES") ? await db.get('roles').find() : [] });
});

//#endregion

if(process.argv[3] != "dev") {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..',  '..', 'client/dist', 'index.html'));
    });
}

app.listen(process.env.PORT, () => {
    logger.log('App listening on port ' + process.env.PORT, 'Express/App');
});