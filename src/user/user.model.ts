import mongoose = require("mongoose");
import { Document, Model } from "mongoose";
import { IUser } from "./user.interface";
import { Schema } from "mongoose";

export var userSchema: Schema = new Schema({
    guid: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: Number, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },

    created: { type: Date, required: true },
    createdBy: { type: String, default: null },
    modified: { type: Date, required: true },
    modifiedBy: { type: String, default: null }
});

interface IUserModel extends IUser, Document { }

export interface IUserModelStatic extends Model<IUserModel> { }

export const User = mongoose.model<IUserModel, IUserModelStatic>("User", userSchema);

/**
 * Seed (manuell atm)
 * POST /api/user/register
 */

/*
{
	"name": "Cato Skogholt",
	"username": "cskogholt@gmail.com",
	"password": "cato123",
	"type": 1
}
{
	"name": "Tom Stang",
	"username": "tom@stang.no",
	"password": "tom123",
	"type": 0
}
{
	"name": "Test Bruker",
	"username": "test@gmail.com",
	"password": "test123",
	"type": 0
}
*/