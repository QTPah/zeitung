import { default as express } from 'express'; 
import * as jwt from 'jsonwebtoken';

export function Error(errorText : string, statusCode : number, res : express.Response) {
    res.status(statusCode).json({ error: errorText });
}

export function authTokenMiddleware(req : express.Request, res : express.Response, next : express.NextFunction) {
      // Grab the token from the request header and remove the "Bearer" from the header (header is "Bearer [TOKEN]")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];


    // check if token exists
    if(!token) return res.sendStatus(401);
    if(!process.env.ACCESS_TOKEN_SECRET) throw 'Access Token Secret (ACCESS_TOKEN_SECRET) not defined in .env!';

    // Try to decrypt the token with env.ACCESS_TOKEN_SECRET
    try {
        // @ts-ignore
        this.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch(error) {
        return res.sendStatus(403);
    }

    next();
}