import { default as express } from 'express';
import * as jwt from 'jsonwebtoken';

import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';

import * as dotenv from 'dotenv';
import * as path from 'path';

import { createLogger } from './Utils/logger';
import { Error, authTokenMiddleware } from './Utils/httpUtils';
import { createTranslator } from './Utils/language';
import { default as monk } from 'monk';

//#region Configuring and Setting up

// Initialize dotenv to allow to read .env files
let dotenvError = dotenv.config().error;

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
if(process.argv[2] != "dev") {
    let staticPath = path.join(__dirname, '..',  '..', 'client/build');
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
const db = monk(process.env.DB_URL || 'mongodb://localhost:27017/news');

db.then(() => {
    logger.log(`Successfully connected to database (${process.env.DB_URL}) with user ${process.env.DB_USER}`, 'Database');
});


// Set up translator (from utils)
const translator = createTranslator(__dirname + '/../translations/translations.json');

logger.log(`Successfully loaded translation file (${translator.filePath})`, 'Translator');

//#endregion

//#region Auth endpoints

type emailVerification = { email : string, password : string, code : string };
const emailVerificationCache : emailVerification[] = [];

app.post('/auth/register', async (req, res) => {
    let { email, password, code } = req.body;
    let language : string = req.headers['accept-language'] || 'en';

    // Check if translation files support the requested language. If not switch to english
    try {
        translator.getPhrase('TEST', language);
    } catch(err) {
        language = 'en';
    }
    
    // Check if all fields are given 
    if((!email || !password) && !code) {
        logger.log(`${email || 'Someone'} attempted to register through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough credentials`, 'Auth/Register');
        return Error(translator.getPhrase('MISSING_CREDENTIALS', language), 400, res);
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
        if(await db.get('users').findOne({ email:  { $regex: `^${email}` } })) {
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
                    permissions: ['VIEW:POSTS', 'VIEW:RUBRIKEN'],
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
    let language : string = req.headers['accept-language'] || 'en';

    // Check if translation files support the requested language. If not switch to english
    try {
        translator.getPhrase('TEST', language);
    } catch(err) {
        language = 'en';
    }
    
    // Check if all fields are given 
    if(!email || !password) {
        logger.log(`${email || 'Someone'} attempted to log in through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) but didn't provide enough credentials`, 'Auth/Login');
        return Error(translator.getPhrase('MISSING_CREDENTIALS', language), 400, res);
    }

    logger.log(`${email} is attempting to login through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Login');

    const user = await db.get('users').findOne({ email:  { $regex: `^${email}` } });

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

    if(!process.env.ACCESS_TOKEN_SECRET) throw 'Access Token Secret (ACCESS_TOKEN_SECRET) not set in .env!';
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn : process.env.ACCESS_TOKEN_LIFETIME });

    if(!process.env.REFRESH_TOKEN_SECRET) throw 'Refresh Token Secret (REFRESH_TOKEN_SECRET) not set in .env!';
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

    // Update the refresh token to the database
    try {
        await db.get('users').findOneAndUpdate({ email:  { $regex: `^${email}` } }, { $set: { refreshToken } });
    } catch(error) {
        logger.log(`Failed to update refresh token to database for "${email}": ${error}`, 'Auth/Login/Database');
        return Error(translator.getPhrase('SERVER_ERROR', language), 500, res);
    }

    res.status(200).json({ res: translator.getPhrase('SUCCESSFULLY_LOGGED_IN', language), accessToken, refreshToken });
    logger.log(`"${email}" successfully logged in through ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort})`, 'Auth/Login');
});

app.post('/auth/token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    
    // Check if all fields are given 
    if(!refreshToken) {
        logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) is trying to get a new access token but didn't provide the refresh token.`, 'Auth/Token');
        return res.sendStatus(422);
    }

    logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) is attempting to get a new access token`, 'Auth/Login');

    if(!await db.get('users').findOne({ refreshToken })) {
        logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) tried to get a new access token but the refresh token was invalid`, 'Auth/Token');
        return res.sendStatus(403);
    }

    if(!process.env.REFRESH_TOKEN_SECRET) throw 'Refresh Token Secret (REFRESH_TOKEN_SECRET) not set in .env!';
    let user : any;
    try {
        user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || '');
    } catch(error) {
        logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) tried to get a new access token but the refresh token was invalid`, 'Auth/Token');
        return res.sendStatus(403);
    }

    delete user.iot;

    if(!process.env.ACCESS_TOKEN_SECRET) throw 'Access Token Secret (ACCESS_TOKEN_SECRET) not set in .env!';
    res.status(200).json({ token: jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_LIFETIME }) });
});

app.delete('/auth/logout', async (req, res) => {
    const refreshToken = req.body.refreshToken;

    if(!refreshToken) {
        logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) is trying to log out but didn't provide their refresh token.`, 'Auth/Token');
        return res.sendStatus(422);
    }
    
    try {
        await db.get('users').findOneAndUpdate({ refreshToken }, { $set: { refreshToken: "" } })
    } catch(error) {}

    res.sendStatus(204);
    logger.log(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}(:${req.socket.remotePort}) Logged out`, 'Auth/Logout');
});

//#endregion



app.listen(process.env.PORT, () => {
    logger.log('App listening on port ' + process.env.PORT, 'Express/App');
});