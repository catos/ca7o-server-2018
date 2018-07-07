import mongoose from 'mongoose';

export const ingredientSchema = new mongoose.Schema({
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: Number, required: true }
});

export const recipeSchema = new mongoose.Schema({
    guid: { type: String, required: true, unique: true },
    created: { type: Number, required: true, default: Date.now() },
    name: { type: String, required: true },
    tags: [{ type: String, required: true }],
    thumbnail: { type: String, required: true },
    description: { type: String, required: true },
    time: { type: Number, required: true },
    ingredients: [ingredientSchema]
});

export interface IRecipe extends mongoose.Document {
    guid: string;
    created: number;
    name: string;
    tags: string[],
    thumbnail: string;
    description: string;
    time: number,
    ingredients: IIngredient[];
}

export enum IngredientTypes {
    Vegetables = 0,
    Fruit = 1,
    Grain = 2,
    Meat = 3,
    Dairy = 4,
    Spice = 5,
    Sauce = 6,
    Canned = 7,
}

export interface IIngredient extends mongoose.Document {
    quantity: number;
    unit: string;
    name: string;
    type: IngredientTypes
}

export const Recipe = mongoose.model<IRecipe>("Recipe", recipeSchema) as mongoose.Model<IRecipe>;
