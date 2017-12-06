import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { join } from 'path';

import { IEndpointModel } from './endpoint-model.interface';
import { IBaseRepository } from './base-repository.interface';
import { AuthService } from '../auth/auth.service';

export abstract class BaseEndpoint<T extends IEndpointModel> {

    constructor(
        public router: Router,
        protected repository: IBaseRepository<T>,
        protected authService: AuthService
    ) {
        router.all('*', this.init);
        router.get('/', this.authService.isAuthenticated, this.all);
        router.get('/find', this.authService.isAuthenticated, this.find);
        router.get('/:id', this.authService.isAuthenticated, this.get);
        router.post('/', this.authService.isAuthenticated, this.create);
        router.put('/:id', this.authService.isAuthenticated, this.update);
        router.delete('/:id', this.authService.isAuthenticated, this.delete);
    }

    errorHandler = (error: Error, response: Response, message?: string): Response => {
        return response
            .status(500)
            .json({
                message: message || error.message,
                error: error
            });
    }

    init = (request: Request, response: Response, next: NextFunction) => {
        next();
    }

    create = (request: Request, response: Response, next: NextFunction) => {
        let userId = this.authService.getRequestUserId(request);
        let now = new Date();
        let item = <T>request.body;
        item.created = item.modified = now;
        item.createdBy = item.modifiedBy = userId;

        this.repository
            .create(item)
            .then(result => {
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

    update = (request: Request, response: Response, next: NextFunction) => {
        let userId = this.authService.getRequestUserId(request);
        let now = new Date();

        let item = <T>request.body;
        item.modified = now;
        item.modifiedBy = userId;

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
        this.repository
            .all()
            .then(result => {
                response.json(result);
            })
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
        this.errorHandler(new Error(), response, 'find not implemented...');
    }
}