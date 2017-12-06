import { Router } from 'express';

export interface IEndpoint {
    path: string;
    router: Router;

    init(): void;
}