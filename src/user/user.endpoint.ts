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
        super(router, repository, authService)
    }

    init = (): void => {
        this.router.post('/register', this.register);
        this.router.post('/forgot-password', this.forgotPassword);
    }

    forgotPassword = (request: Request, response: Response, next: NextFunction) => {
        console.log('send mail!');
        // this._mailService.sendMail('to', 'subject', 'body');
    }

    register = (request: Request, response: Response, next: NextFunction): void => {
        let newUser = <IUser>request.body;

        this.repository
            .find({ username: newUser.username })
            .then((result) => {

                if (result.length) {
                    return response.json({
                        'message': 'User with username: ' + newUser.username + ' already exist'
                    });
                } else {
                    let password = newUser.password;
                    newUser.salt = this.authService.createSalt();
                    newUser.password = this.authService.hashPassword(password, newUser.salt);

                    let now = new Date();
                    newUser.created = newUser.modified = now;

                    this.repository
                        .create(newUser)
                        .then((user) => {
                            return response.json({ 'jwt': this.authService.createToken(user) });
                        })
                        .catch(error => this.errorHandler(error, response));
                }
            })
            .catch((error) => {
                console.log('error', error);
            });
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