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
        router.get(path + '/random-week', this.authService.isAuthenticated, this.randomWeek);
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
        Recipe.findOneAndDelete({ guid: request.params.id }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }


    all = (request: Request, response: Response, next: NextFunction) => {
        let filters = {};

        if (request.query.q !== undefined) {
            filters = Object.assign({ name: new RegExp(request.query.q, 'i') }, filters);
        }

        if (request.query.time !== undefined) {
            const time = parseInt(request.query.time) + 1;
            filters = Object.assign({ time: { $lt: time } }, filters);
        }

        if (request.query.tags !== undefined && request.query.tags.length > 0) {
            const tags = request.query.tags.split(',') as string[];
            filters = Object.assign({ tags: { $all: tags } }, filters);
        }

        let query = Recipe.find(filters);

        // Paging
        const take = 10;
        let page = 0;
        if (request.query.page !== undefined) {
            page = +(request.query.page - 1);
            query = query
                .skip(page * take)
                .limit(take);
        }
        
        // Sort
        query = query.sort('-created');

        query.exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    get = (request: Request, response: Response, next: NextFunction) => {
        Recipe.findOne({ guid: request.params.id }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    randomWeek = (request: Request, response: Response, next: NextFunction) => {
        Recipe.find({ time: { $lt: 31 } }).exec()
            .then(recipes => {
                const shuffled = recipes.sort(() => .5 - Math.random());
                const result = shuffled.slice(0, 5);
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }
}