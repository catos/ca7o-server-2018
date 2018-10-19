import mongoose from 'mongoose';

export const wordSchema = new mongoose.Schema({
    guid: { type: String, required: true, unique: true },
    created: { type: Number, required: true, default: Date.now() },
    word: { type: String, required: true },
    description: { type: String, required: false, default: '' },
    difficulty: { type: Number, required: true },
    language: { type: Number, required: true }
});

export interface IWord extends mongoose.Document {
    guid: string;
    created: number;
    word: string;
    description: string;
    difficulty: DifficultyTypes;
    language: LanguageTypes;
}

export enum DifficultyTypes {
    NotSet = 0,
    Easy = 1,
    Normal = 2,
    Hard = 3
}

export enum LanguageTypes {
    NotSet = 0,
    English = 1,
    Norwegian = 2
}

export const Word = mongoose
    .model<IWord>("WesketchWord", wordSchema) as mongoose.Model<IWord>;