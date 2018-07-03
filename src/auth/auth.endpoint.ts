import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { IBaseRepository } from '../shared/base-repository.interface';
import { IUser, UserTypes } from '../user/user.interface';
import { IEndpoint } from '../shared/endpoint.interface';
import { StatusCodes } from '../shared/status-codes';

export class AuthEndpoint implements IEndpoint {

    constructor(
        public path: string,
        public router: Router,
        private userRepository: IBaseRepository<IUser>,
        private authService: AuthService
    ) { }

    init = () => {
        this.router.post('/auth/login', this.login);
        this.router.post('/auth/register', this.register);
        this.router.post('/auth/forgot-password', this.forgotPassword);
    }

    login = (request: Request, response: Response, next: NextFunction) => {

        let username = request.body.username;
        let password = request.body.password;

        if (!username || !password) {
            response.status(StatusCodes.BadRequest);
            return response.json({ errors: ['Invalid username or password'] });
        }

        this.userRepository
            .get({ username: username })
            .then(user => {
                if (!user) {
                    response.status(StatusCodes.BadRequest);
                    return response.json({ errors: ['Invalid username or password'] });
                } else {
                    let hashedPassword = this.authService.hashPassword(password, user.salt);
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
        // this._mailService.sendMail('to', 'subject', 'body');
    }

    // TODO: move to "shared lib" ?
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    register = (request: Request, response: Response, next: NextFunction): void => {
        let newUser = <IUser>request.body;

        this.userRepository
            .find({ username: newUser.username })
            .then((result) => {

                if (result.length) {
                    response.status(StatusCodes.BadRequest);
                    return response.json({ errors: ['User with username: ' + newUser.username + ' already exist'] });
                } else {

                    if (newUser.name.length > 16) {
                        response.status(StatusCodes.BadRequest);
                        return response.json({ errors: ['Invalid username, max 16 characters allowed'] });
                    }

                    newUser.guid = this.uuidv4();
                    newUser.type = UserTypes.Regular;

                    let password = newUser.password;
                    newUser.salt = this.authService.createSalt();
                    newUser.password = this.authService.hashPassword(password, newUser.salt);

                    let now = new Date();
                    newUser.created = newUser.modified = now;

                    this.userRepository
                        .create(newUser)
                        .then((user) => {
                            const token = this.authService.createToken(user);
                            response.status(StatusCodes.Ok);
                            return response.json(token);
                        })
                        .catch(error => this.errorHandler(error, response));
                }
            })
            .catch(error => this.errorHandler(error, response));
    }

    errorHandler = (error: Error, response: Response, message?: string): Response => {
        return response
            .status(StatusCodes.InternalServerError)
            .json({
                errors: [message || error.message]
            });
    }

}