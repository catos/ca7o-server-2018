import { Request, Response, Router, NextFunction } from 'express';

export interface IEndpoint {
    path: string;
    router: Router;

    errorHandler(error: Error, response: Response, message?: string): Response;
    init(request: Request, response: Response, next: NextFunction): void;
}