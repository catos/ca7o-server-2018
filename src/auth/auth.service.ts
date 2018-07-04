import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'

import { IUser } from '../user/user.model';
import { JwtPayload } from './auth-payload.model';

export class AuthService {

    constructor(private secret: string) {}

    isAuthenticated = (
        request: Request & { headers: { authorization: string } },
        response: Response,
        next: NextFunction) => {

        const token = request.headers.authorization;

        jwt.verify(token, this.secret, function (tokenError: any) {
            if (tokenError) {
                // TODO: TokenExpiredError!!...
                console.log('tokenError: ', tokenError);
                return response.status(403).json({
                    message: 'Invalid token, please Log in'
                });
            }

            next();
        });
    }

    getRequestUserId = (request: Request): string => {
        const stringToken = request.headers.authorization as string;
        const payload = jwt.decode(stringToken) as JwtPayload;
        return payload.guid;
    }

    createSalt = (): string => {
        return crypto.randomBytes(128).toString('base64');
    }

    hashPassword = (password: string, salt: string): string => {
        return crypto
            .pbkdf2Sync(password, salt, 10000, 128, 'sha256')
            .toString('hex');
    }

    createToken = (user: IUser): string => {
        const payload = {
            'guid': user.guid,
            'name': user.name,
            'username': user.username
        };

        return jwt.sign(payload, this.secret, { expiresIn: '7d' });
    }

}

