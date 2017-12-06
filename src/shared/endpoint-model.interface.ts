import { Document } from 'mongoose'

export interface IEndpointModel extends Document {
    created: Date;
    createdBy: any;
    modified: Date;
    modifiedBy: any;
}