// export interface IBaseRepository<T> {
//     create: (item: T) => Promise<T>;
//     update: (_id: string, item: T) => Promise<T>;
//     delete: (_id: string) => Promise<boolean>;

//     all: () => Promise<T[]>;

//     getById: (_id: string) => Promise<T>;
//     get: (cond?: any, fields?: any, options?: any) => Promise<T>;
//     find: (cond?: any, fields?: any, options?: any, sortOptions?: any) => Promise<T[]>;
// }