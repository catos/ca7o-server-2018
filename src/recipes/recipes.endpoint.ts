import { NextFunction, Response, Request, Router } from 'express';

import { uuidv4 } from '../shared/utils';
import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { Recipe, IRecipe } from './recipe.model';
import { RECIPES_SEED } from './recipes.seed';



export class RecipesEndpoint implements IEndpoint {
    constructor(
        public path: string,
        public router: Router,
        private authService: AuthService) {

        router.all(path + '/*', this.init);
        router.get(path + '/', this.authService.isAuthenticated, this.all);
        router.get(path + '/seed', this.authService.isAuthenticated, this.seed);
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


    all = async(request: Request, response: Response, next: NextFunction) => {
        let filters = {};

        const tags = request.query.tags !== undefined && request.query.tags.length > 0
            ? request.query.tags.split(',') as string[]
            : [];
        console.log('tags:', tags, tags.includes('rask'));

        let time = request.query.time !== undefined
            ? parseInt(request.query.time) + 1
            : tags.includes('rask')
                ? 31
                : undefined;
        console.log('time:', time);

        if (request.query.q !== undefined) {
            filters = Object.assign({ name: new RegExp(request.query.q, 'i') }, filters);
        }

        if (time !== undefined) {
            console.log('filter on time!', time);
            filters = Object.assign({ time: { $lt: time } }, filters);
        }

        if (tags.length) {
            filters = Object.assign({ tags: { $all: tags } }, filters);
        }

        let query = Recipe.find(filters);

        // Get document-count in collection
        const count = await Recipe.find(filters).countDocuments();

        // Paging
        const take = 21;
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
            .then(recipes => {
                const result = {
                    count,
                    totalPages: Math.ceil(count / take),
                    currentPage: page + 1,
                    take,
                    recipes
                };                
                response.json(result);
            })
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

    seed = (request: Request, response: Response, next: NextFunction) => {
        RECIPES_SEED.map(recipe => {
            recipe.guid = uuidv4();

            console.log('RECIPES_SEED, recipe: ', recipe.name);
            Recipe.create(recipe)
                .then(result => console.log(`Recipe ${recipe.name} seeded`))
                .catch(error => console.log(`Error seeding recipe ${recipe.name}: ${error}`));
        });

        response.json({ message: `${RECIPES_SEED.length} recipes seeded` })
    }
}