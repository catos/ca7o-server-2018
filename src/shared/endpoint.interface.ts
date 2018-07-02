import { Request, Response, Router, NextFunction } from 'express';

export interface IEndpoint {
    path: string;
    router: Router;

    init(): void;
}