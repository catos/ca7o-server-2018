import { NextFunction, Response, Request, Router } from 'express';

import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { IRecipe, RECIPES } from './recipe.interface';



export class RecipesEndpoint implements IEndpoint {
    constructor(
        public path: string,
        public router: Router,
        private authService: AuthService) {

        router.all(path + '/*', this.init);
        router.get(path + '/', this.authService.isAuthenticated, this.all);
        // router.get('/find', this.authService.isAuthenticated, this.find);
        // router.get('/:id', this.authService.isAuthenticated, this.get);
        // router.post('/', this.authService.isAuthenticated, this.create);
        // router.put('/:id', this.authService.isAuthenticated, this.update);
        // router.delete('/:id', this.authService.isAuthenticated, this.delete);
    }

    errorHandler = (error: Error, response: Response, message?: string): Response => {
        return response
            .status(StatusCodes.InternalServerError)
            .json({
                errors: [message || error.message]
            });
    }

    init = (request: Request, response: Response, next: NextFunction): void => {
        console.log('UserEndpoint.init()');
        next();
    }

    all = (request: Request, response: Response, next: NextFunction) => {
        response.json(RECIPES);
    }

}