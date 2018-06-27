import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken'

import { IUser } from '../user/user.interface';
import { AuthPayload } from './auth-payload.model';

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

    getRequestUserId = (request: Request): number => {
        const stringToken = request.headers.authorization as string;
        const payload = jwt.decode(stringToken) as AuthPayload;
        if (payload.id) {
            return payload.id;
        }

        return -1;
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

