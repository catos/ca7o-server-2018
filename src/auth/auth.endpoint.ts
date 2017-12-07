import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { IBaseRepository } from '../shared/base-repository.interface';
import { IUser } from '../user/user.interface';
import { IEndpoint } from '../shared/endpoint.interface';
import { request } from 'http';
import { ITokenResponse } from './token-response.model';

export class AuthEndpoint implements IEndpoint {

    constructor(
        public path: string,
        public router: Router,
        private userRepository: IBaseRepository<IUser>,
        private authService: AuthService
    ) { }

    init = () => {
        this.router.post('/login', this.login);
    }

    login = (request: Request, response: Response, next: NextFunction) => {

        let username = request.body.username;
        let password = request.body.password;

        if (!username || !password) {
            return next(new Error('username | password missing.'))
        }

        let tokenResponse: ITokenResponse = {
            token: '',
            success: false,
            message: ''
        }

        this.userRepository
            .get({ username: username })
            .then(user => {
                if (!user) {
                    // response.status(401);
                    tokenResponse.message = 'No user found with that username' 
                    return response.json(tokenResponse);
                } else {
                    let hashedPassword = this.authService.hashPassword(password, user.salt);
                    if (user.password !== hashedPassword) {
                        // response.status(401);
                        tokenResponse.message = 'Wrong password'
                        return response.json(tokenResponse)
                    } else {
                        tokenResponse.token = this.authService.createToken(user)
                        tokenResponse.success = true
                        return response.json(tokenResponse);
                    }
                }
            })
            .catch((error) => console.error('AuthRouter.create/login:', error));
    }
}