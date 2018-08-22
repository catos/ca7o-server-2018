import { NextFunction, Response, Request, Router } from 'express';

import { uuidv4 } from '../shared/utils';
import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { Recipe, IRecipe } from './recipe.model';



export class RecipesEndpoint implements IEndpoint {
    constructor(
        public path: string,
        public router: Router,
        private authService: AuthService) {

        router.all(path + '/*', this.init);
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
        console.log('UserEndpoint.init()');
        next();
    }

    create = (request: Request, response: Response, next: NextFunction) => {
        const newRecipe = request.body as IRecipe;
        
        newRecipe.guid = uuidv4();

        Recipe.create(newRecipe)
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    update = (request: Request, response: Response, next: NextFunction) => {
        const recipe = request.body as IRecipe;

        Recipe.findOneAndUpdate({ guid: request.params.id }, recipe, { new: true }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    delete = (request: Request, response: Response, next: NextFunction) => {
        Recipe.findByIdAndRemove(request.params.id).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }


    all = (request: Request, response: Response, next: NextFunction) => {
        // Recipe.uest, response: Response, next: NextFunction) => {
        Recipe.find({}).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    get = (request: Request, response: Response, next: NextFunction) => {
        Recipe.findOne({ guid: request.params.id }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }
}