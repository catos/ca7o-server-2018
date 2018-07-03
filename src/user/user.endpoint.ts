import { NextFunction, Response, Request, Router } from 'express';

import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from '../auth/auth.service';
import { IBaseRepository } from '../shared/base-repository.interface';
import { IUser, User } from './user.model';


export class UserEndpoint implements IEndpoint {

    constructor(
        public path: string,
        public router: Router,
        public repository: IBaseRepository<IUser>,
        public authService: AuthService
    ) {
        router.all(path + '*', this.init);
        router.get(path + '/', this.authService.isAuthenticated, this.all);
        router.get(path + '/find', this.authService.isAuthenticated, this.find);
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
        let item = request.body as IUser;
        this.repository
            .create(item)
            .then(result => {
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

    update = (request: Request, response: Response, next: NextFunction) => {
        let item = request.body as IUser;
        this.repository
            .update(request.params.id, item)
            .then((result) => {
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

    delete = (request: Request, response: Response, next: NextFunction) => {
        this.repository
            .delete(request.params.id)
            .then((result) => {
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

    all = (request: Request, response: Response, next: NextFunction) => {
        // this.repository
        //     .all()
        //     .then(result => {
        //         response.json(result);
        //     })
        //     .catch(error => this.errorHandler(error, response));

        // TODO: reference: https://github.com/vladotesanovic/typescript-mongoose-express
        // TODO: remove base-repository
        // TODO: remove base-mongoose.repository
        // TODO: implement endpoints like this!
        const query = User.find({});
        query.exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    get = (request: Request, response: Response, next: NextFunction) => {
        this.repository
            .getById(request.params.id)
            .then((result) => {
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

    find = (request: Request, response: Response, next: NextFunction) => {
        var q = {
            '$or': [
                {
                    username: new RegExp(request.query.q, 'i')
                },
                {
                    name: new RegExp(request.query.q, 'i')
                }
            ]
        }

        this.repository
            .find(q)
            .then((result) => {
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

}