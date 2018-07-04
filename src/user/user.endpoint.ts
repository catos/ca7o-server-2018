import { NextFunction, Response, Request, Router } from 'express';

import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from '../auth/auth.service';
import { IUser, User, UserTypes } from './user.model';
import { Utils } from '../shared/utils';


export class UserEndpoint implements IEndpoint {

    constructor(
        public path: string,
        public router: Router,
        public authService: AuthService
    ) {
        router.all(path + '*', this.init);
        router.get(path + '/', this.authService.isAuthenticated, this.all);
        router.get(path + '/:id', this.authService.isAuthenticated, this.get);
        router.post(path + '/', this.authService.isAuthenticated, this.create);
        router.put(path + '/:id', this.authService.isAuthenticated, this.update);
        router.delete(path + '/:id', this.authService.isAuthenticated, this.delete);
    }

    errorHandler = (error: Error, response: Response, message?: string): Response => {
        return response
            .status(StatusCodes.InternalServerError)
            .json({
                errors: [message || error.message]
            });
    }

    init = (request: Request, response: Response, next: NextFunction): void => {
        console.log('UserEndpoint.init() 2');
        next();
    }

    create = (request: Request, response: Response, next: NextFunction) => {
        const newUser = request.body as IUser;
        User.find({ username: newUser.username }).exec()
            .then(existingUser => {
                if (existingUser.length) {
                    response.status(StatusCodes.BadRequest);
                    return response.json({ errors: ['User with username: ' + newUser.username + ' already exist'] });
                } else {
                    // TODO: add more validation
                    if (newUser.name === undefined || newUser.name.length > 16) {
                        response.status(StatusCodes.BadRequest);
                        return response.json({ errors: ['Invalid name ' + newUser.name + ', max 16 characters allowed'] });
                    }

                    newUser.guid = Utils.uuidv4();
                    newUser.type = UserTypes.Regular;

                    const password = newUser.password;
                    newUser.salt = this.authService.createSalt();
                    newUser.password = this.authService.hashPassword(password, newUser.salt);

                    User.create(newUser)
                        .then(result => response.json(result))
                        .catch(error => this.errorHandler(error, response));
                }
            })
            .catch(error => this.errorHandler(error, response));
    }

    update = (request: Request, response: Response, next: NextFunction) => {
        const user = request.body as IUser;
        User.findByIdAndUpdate(request.params.id, user, { new: true }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    delete = (request: Request, response: Response, next: NextFunction) => {
        User.findByIdAndRemove(request.params.id).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    all = (request: Request, response: Response, next: NextFunction) => {
        const conditions = (request.query.q !== undefined)
            ? {
                '$or': [
                    {
                        username: new RegExp(request.query.q, 'i')
                    },
                    {
                        name: new RegExp(request.query.q, 'i')
                    }
                ]
            }
            : {};

        User.find(conditions).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    get = (request: Request, response: Response, next: NextFunction) => {
        User.findById(request.params.id).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }
}