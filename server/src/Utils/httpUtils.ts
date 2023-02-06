import { default as express } from 'express'; 
import * as jwt from 'jsonwebtoken';
import { Blacklist } from './blacklist';

export function Error(errorText : string, statusCode : number, res : express.Response) {
    res.status(statusCode).json({ err: errorText });
}