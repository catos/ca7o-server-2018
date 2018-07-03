import mongoose from 'mongoose';

import { IBaseRepository } from './base-repository.interface';

export class BaseMongooseRepository<T extends mongoose.Document> implements IBaseRepository<T> {

    private model: mongoose.Model<T>;

    constructor(name: string, schema: mongoose.Schema) {
        this.model = mongoose.model<T>(name, schema)
    }

    create(item: T) {
        let self = this;

        let p = new Promise<T>((resolve, reject) => {
            self.model.create(item, (error: Error, result: T) => {

                if (error) {
                    console.error('BaseMongooseRepository.create:', error);
                    reject(error);
                } else {
                    resolve(<T>result);
                }

            });
        });

        return p;
    }

    update(_id: string, item: T) {
        let self = this;
        let p = new Promise<T>((resolve, reject) => {
            self.model.findByIdAndUpdate(_id, item, { new: true }, (error, result) => {
                if (error) {
                    console.error('BaseMongooseRepository.update:', error);
                    reject(error);
                }
                else {
                    resolve(<T>result);
                }
            });
        });

        return p;
    }

    delete(_id: string) {
        let self = this;
        let p = new Promise<boolean>((resolve, reject) => {
            self.model.remove({ _id: this.toObjectId(_id) }, (error) => {
                if (error) {
                    console.error('BaseMongooseRepository.delete:', error);
                    reject(error);
                }
                else {
                    resolve(true);
                }
            });
        });

        return p;
    }

    all(): Promise<T[]> {
        let self = this;
        let p = new Promise<T[]>((resolve, reject) => {
            self.model.find({}, (error, result) => {

                if (error) {
                    console.error('BaseMongooseRepository.all:', error);
                    reject(error);
                }
                else {
                    resolve(<T[]>result);
                }
            });
        });

        return p;
    }

    getById(_id: string): Promise<T> {
        let self = this;
        let cond = {

        };
        let p = new Promise<T>((resolve, reject) => {

            self.model.findById(_id, (error, result) => {

                if (error) {
                    console.error('BaseMongooseRepository.getById:', error);
                    reject(error);
                }
                else {
                    resolve(<T>result);
                }
            });
        });

        return p;
    }

    get(conditions: Object) {
        let self = this;
        let p = new Promise<T>((resolve, reject) => {
            self.model.findOne(conditions).exec((error, res) => {
                if (error) {
                    console.error('BaseMongooseRepository.get:', error);
                    reject(error);
                }
                else {
                    resolve(<T>res);
                }
            });
        });

        return p;
    }

    find(conditions: Object, sortOptions?: any): Promise<T[]> {
        let p = new Promise<T[]>((resolve, reject) => {
            let query = this.model.find(conditions);
            if (sortOptions) {
                query = query.sort(sortOptions);
            }

            query.exec((error, res) => {
                if (error) {
                    console.error('BaseMongooseRepository.find:', error);
                    reject(error);
                }
                else {
                    resolve(<T[]>res);
                }
            });
        });

        return p;
    }

    private toObjectId(_id: string): mongoose.Types.ObjectId {
        return mongoose.Types.ObjectId.createFromHexString(_id);
    }

}