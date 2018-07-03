import { NextFunction, Response, Request, Router } from 'express';
import { Firestore } from '@google-cloud/firestore';

import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { IRecipe, RECIPES } from './recipe.interface';



export class RecipesEndpoint implements IEndpoint {
    constructor(
        public path: string,
        public router: Router,
        public firestore: Firestore,
        private authService: AuthService) {

        this.router.all('/api/recipes/*', this.init);
        this.router.get('/api/recipes-seed/', this.authService.isAuthenticated, this.seed);
        this.router.get('/api/recipes/', this.authService.isAuthenticated, this.all);
        // router.get('/find', this.authService.isAuthenticated, this.find);
        // router.get('/:id', this.authService.isAuthenticated, this.get);
        // router.post('/', this.authService.isAuthenticated, this.create);
        // router.put('/:id', this.authService.isAuthenticated, this.update);
        // router.delete('/:id', this.authService.isAuthenticated, this.delete);
    }

    init = () => {
        console.log('RecipesEndpoint init()');
    }

    seed = (request: Request, response: Response, next: NextFunction) => {
        // console.log('seed');
        // response.json({ ok: 'asdf' });
        RECIPES.map(recipe => {
            this.firestore.collection("recipes")
                .add(recipe)
                .then(ref => console.log('Recipe added with id: ' + ref.id))
                .then(() => response.json('ok'));
        });        
    }

    all = (request: Request, response: Response, next: NextFunction) => {
        console.log('RecipesEndpoint all()');
        this.firestore.collection("recipes").get()
            .then(
                (snapshot) => {
                    let recipes: IRecipe[] = [];
                    snapshot.forEach((doc) => {
                        let recipe = {
                            id: doc.id,
                            ...doc.data()
                        }
                        console.log(recipe);

                        recipes.push(recipe as IRecipe);
                    });
                    response.json(recipes);
                }
            )
            .catch(err => console.log(err));
    }

}