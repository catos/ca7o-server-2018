import { IEndpointModel } from "../shared/endpoint-model.interface";

export enum UserTypes {
    NotDefined = 0,
    Regular = 1,
    Admin = 2
}
export interface IUser extends IEndpointModel {
    _id: string;
    name: string;
    type: UserTypes;
    username: string;
    password: string;
    salt: string;
}