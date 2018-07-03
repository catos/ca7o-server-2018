import mongoose from 'mongoose';

export var userSchema = new mongoose.Schema({
    guid: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: Number, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
});

export enum UserTypes {
    NotDefined = 0,
    Regular = 1,
    Admin = 2
}
export interface IUser extends mongoose.Document {
    guid: string;
    name: string;
    type: UserTypes;
    username: string;
    password: string;
    salt: string;
}

export interface IUserModel extends mongoose.Model<IUser> { }

export const User = mongoose.model<IUser>("User", userSchema) as IUserModel;

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