import mongoose = require("mongoose");
import { Document, Model } from "mongoose";
import { User as IUser } from "./user.interface";
import { userSchema } from "./user.schema";

export interface UserModel extends IUser, Document { }

export interface UserModelStatic extends Model<UserModel> { }

export const User = mongoose.model<UserModel, UserModelStatic>("User", userSchema);

/**
 * Seed (manuell atm)
 * POST /api/user/register
 */

/*
{
  "name": "Cato Skogholt",
  "username": "cskogholt@gmail.com",
  "password": "cato123"
}
{
  "name": "Tom Stang",
  "username": "tom@stang.no",
  "password": "tom123"
}
{
  "name": "Test Bruker",
  "username": "test@gmail.com",
  "password": "test123"
}
*/