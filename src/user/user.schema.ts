import { Schema } from "mongoose";

export var userSchema: Schema = new Schema({
    name: String,
    username: String,
    password: String
    // name: { type: String, required: true },
    // username: { type: String, required: true },
    // password: { type: String, required: true }
    
    // salt: { type: String, required: true },
    
    // created: { type: Date, required: true },
    // createdBy: { type: String, default: null },
    // modified: { type: Date, required: true },
    // modifiedBy: { type: String, default: null }
});