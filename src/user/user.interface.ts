import { IEndpointModel } from "../shared/endpoint-model.interface";

export interface IUser extends IEndpointModel {
    name: string;
    type: number;
    username: string;
    password: string;
    salt: string;
}