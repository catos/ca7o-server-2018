import { Router, Request, Response, NextFunction } from 'express';

import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from './auth.service';

import { IUser, User, UserTypes } from '../user/user.model';
import { uuidv4 } from '../shared/utils';

export class AuthEndpoint implements IEndpoint {
    constructor(
        public path: string,
        public router: Router,
        private authService: AuthService
    ) {
        router.all(path + '*', this.init);
        router.post(path + '/login', this.login);
        router.post(path + '/register', this.register);
        router.post(path + '/forgot-password', this.forgotPassword);
    }

    errorHandler = (error: Error, response: Response, message?: string): Response => {
        return response
            .status(StatusCodes.InternalServerError)
            .json({
                errors: [message || error.message]
            });
    }

    init(request: Request, response: Response, next: NextFunction): void {
        console.log('AuthEndpoint.init()');
        next();
    }

    login = (request: Request, response: Response, next: NextFunction) => {

        const login = request.body as IUser;

        if (!login.username || !login.password) {
            response.status(StatusCodes.BadRequest);
            return response.json({ errors: ['Invalid username or password'] });
        }

        User.findOne({ username: login.username }).exec()
            .then(user => {
                if (!user) {
                    response.status(StatusCodes.BadRequest);
                    return response.json({ errors: ['Invalid username or password'] });
                } else {
                    const hashedPassword = this.authService.hashPassword(login.password, user.salt);
                    if (user.password !== hashedPassword) {
                        response.status(StatusCodes.BadRequest);
                        return response.json({ errors: ['Invalid username or password'] });
                    } else {
                        const token = this.authService.createToken(user)
                        response.status(StatusCodes.Ok);
                        return response.json(token);
                    }
                }
            })
            .catch(error => this.errorHandler(error, response));
    }

    forgotPassword = (request: Request, response: Response, next: NextFunction) => {
        console.log('send mail!');
        // TODO: implement forgotPassword
        // this._mailService.sendMail('to', 'subject', 'body');
    }

    register = (request: Request, response: Response, next: NextFunction): void => {
        const newUser = request.body as IUser;
        User.find({ username: newUser.username }).exec()
            .then(user => {
                if (user.length) {
                    response.status(StatusCodes.BadRequest);
                    return response.json({ errors: ['User with username: ' + newUser.username + ' already exist'] });
                } else {
                    // TODO: add more validation
                    if (newUser.name === undefined || newUser.name.length > 16) {
                        response.status(StatusCodes.BadRequest);
                        return response.json({ errors: ['Invalid name ' + newUser.name + ', max 16 characters allowed'] });
                    }

                    newUser.guid = uuidv4();
                    newUser.type = UserTypes.Regular;

                    const password = newUser.password;
                    newUser.salt = this.authService.createSalt();
                    newUser.password = this.authService.hashPassword(password, newUser.salt);

                    User.create(newUser)
                        .then(result => {
                            const token = this.authService.createToken(result);
                            response.status(StatusCodes.Ok);
                            return response.json(token);
                        })
                        .catch(error => this.errorHandler(error, response));
                }
            })
            .catch(error => this.errorHandler(error, response));
    }

}