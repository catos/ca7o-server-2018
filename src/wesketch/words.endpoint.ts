import { NextFunction, Response, Request, Router } from 'express';
import * as moment from 'moment';

import { uuidv4 } from '../shared/utils';
import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { Word, IWord, DifficultyTypes, LanguageTypes } from './word.model';
import { WORDLIST } from './wordlist-new';

export class WordsEndpoint implements IEndpoint {
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
        // Word.count({}, (err, count) => {
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
        //             Word.create(ww)
        //                 .then(result => console.log('word: ' + word + ' added'))
        //                 .catch(error => this.errorHandler(error, response));
        //         });

        //     }
        //     response.json({ count });
        // });
    }

    create = (request: Request, response: Response, next: NextFunction) => {
        const newWord = request.body as IWord;

        newWord.guid = uuidv4();

        Word.create(newWord)
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    update = (request: Request, response: Response, next: NextFunction) => {
        const updatedWord = request.body as IWord;

        Word.findOneAndUpdate({ guid: request.params.id }, updatedWord, { new: true }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }

    delete = (request: Request, response: Response, next: NextFunction) => {
        Word.findByIdAndRemove(request.params.id).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }


    all = (request: Request, response: Response, next: NextFunction) => {
        let filters = {};

        if (request.query.q !== undefined) {
            filters = Object.assign({ word: new RegExp(request.query.q, 'i') }, filters);
        }

        if (request.query.difficulties !== undefined && request.query.difficulties.length > 0) {
            const difficulties = request.query.difficulties.split(',') as number[];
            filters = Object.assign({ difficulty: { $in: difficulties } }, filters);
        }

        if (request.query.languages !== undefined && request.query.languages.length > 0) {
            const languages = request.query.languages.split(',') as number[];
            filters = Object.assign({ language: { $in: languages } }, filters);
        }

        let query = Word.find(filters);

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
        Word.findOne({ guid: request.params.id }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }
}