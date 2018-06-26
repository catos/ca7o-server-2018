import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { IBaseRepository } from '../shared/base-repository.interface';
import { IUser } from '../user/user.interface';
import { IEndpoint } from '../shared/endpoint.interface';
import { StatusCodes } from '../shared/status-codes';

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

        this.userRepository
            .get({ username: username })
            .then(user => {
                if (!user) {
                    response.status(StatusCodes.BadRequest);
                    return response.json({errors: ['Invalid username or password']});
                } else {
                    let hashedPassword = this.authService.hashPassword(password, user.salt);
                    if (user.password !== hashedPassword) {
                        response.status(StatusCodes.BadRequest);
                        return response.json({errors: ['Invalid username or password']});
                    } else {
                        const token = this.authService.createToken(user)
                        response.status(StatusCodes.Ok);
                        return response.json(token);
                    }
                }
            })
            .catch((error) => console.error('AuthRouter.create/login:', error));
    }
}