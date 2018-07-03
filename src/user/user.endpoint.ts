import { NextFunction, Response, Request, Router } from 'express';

import { BaseEndpoint } from '../shared/base.endpoint';
import { AuthService } from '../auth/auth.service';
import { IBaseRepository } from '../shared/base-repository.interface';
import { IUser } from './user.interface';
import { IEndpoint } from '../shared/endpoint.interface';


export class UserEndpoint extends BaseEndpoint<IUser> implements IEndpoint {

    constructor(
        public path: string,
        public router: Router,
        repository: IBaseRepository<IUser>,
        authService: AuthService
    ) {
        super(path, router, repository, authService)
    }

    init = (): void => {
        this.router.post('/find', this.find);
    }

    // TODO: find out what this is used for
    // TODO: fix and move into BaseApiEndpoint maybe ?
    // TODO: use this code maybe ?
    // public list(req: Request, res: Response, next: NextFunction) {
    //     // get users
    //     let filters = {}
    //     if (req.query.q !== undefined) {
    //         filters = {
    //             $or: [
    //                 { "name": { "$regex": req.query.q, "$options": "i" } },
    //                 { "username": { "$regex": req.query.q, "$options": "i" } }
    //             ]
    //         }
    //     }
    //     User.find(filters).then(users => {
    //         res.json(users.map(user => user.toObject()));
    //         next();
    //     }).catch(next);
    // }

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