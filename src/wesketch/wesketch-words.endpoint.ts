import { NextFunction, Response, Request, Router } from 'express';
import * as moment from 'moment';

import { uuidv4 } from '../shared/utils';
import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { WesketchWord, IWesketchWord, DifficultyTypes, LanguageTypes } from './wesketch-word.model';
import { WORDLIST } from './wordlist-new';

export class WesketchWordsEndpoint implements IEndpoint {
    constructor(
        public path: string,
        public router: Router,
        private authService: AuthService) {

        router.all(path + '/*', this.init);
        router.get(path + '/seed', this.authService.isAuthenticated, this.seed);
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

    seed = (request: Request, response: Response, next: NextFunction) => {
        // WesketchWord.count({}, (err, count) => {
        //     // Seed data
        //     if (count === 0) {
        //         WORDLIST.forEach(word => {
        //             console.log('word: ' + word);
        //             const ww = {
        //                 guid: uuidv4(),
        //                 created: moment.now(),
        //                 word: word,
        //                 difficulty: DifficultyTypes.Hard,
        //                 language: LanguageTypes.English
        //             };
        //             WesketchWord.create(ww)
        //                 .then(result => console.log('word: ' + word + ' added'))
        //                 .catch(error => this.errorHandler(error, response));
        //         });

        //     }
        //     response.json({ count });
        // });
    }

    create = (request: Request, response: Response, next: NextFunction) => {
        const newWord = request.body as IWesketchWord;

        newWord.guid = uuidv4();

        WesketchWord.create(newWord)
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    update = (request: Request, response: Response, next: NextFunction) => {
        const updatedWord = request.body as IWesketchWord;

        WesketchWord.findOneAndUpdate({ guid: request.params.id }, updatedWord, { new: true }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    delete = (request: Request, response: Response, next: NextFunction) => {
        WesketchWord.findByIdAndRemove(request.params.id).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }


    all = (request: Request, response: Response, next: NextFunction) => {
        let filters = {};

        if (request.query.q !== undefined) {
            filters = Object.assign({ word: new RegExp(request.query.q, 'i') }, filters);
        }

        let query = WesketchWord.find(filters);

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
        WesketchWord.findOne({ guid: request.params.id }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }
}