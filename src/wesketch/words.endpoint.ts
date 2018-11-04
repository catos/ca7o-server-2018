import { NextFunction, Response, Request, Router } from 'express';

import { uuidv4 } from '../shared/utils';
import { StatusCodes } from '../shared/status-codes';
import { IEndpoint } from '../shared/endpoint.interface';
import { AuthService } from "../auth/auth.service";

import { Word, IWord } from './word.model';

export class WordsEndpoint implements IEndpoint {
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


    async all(request: Request, response: Response, next: NextFunction) {
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

        // Get document-count in collection
        const count = await Word.find(filters).countDocuments();
        
        // Paging
        const take = 100;
        let page = request.query.page !== undefined ? +(request.query.page - 1) : 0;
        query = query
            .skip(page * take)
            .limit(take);

        // Sort
        query = query.sort('-created');

        query.exec()
            .then(words => {
                const result = {
                    count,
                    totalPages: Math.ceil(count / take),
                    currentPage: page + 1,
                    take,
                    words
                };
                response.json(result);
            })
            .catch(error => this.errorHandler(error, response));
    }

    get = (request: Request, response: Response, next: NextFunction) => {
        Word.findOne({ guid: request.params.id }).exec()
            .then(result => response.json(result))
            .catch(error => this.errorHandler(error, response));
    }
}