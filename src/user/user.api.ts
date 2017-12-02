// express
import { NextFunction, Response, Request, Router } from "express";

// model
import { User, UserModel } from "./user.model";

/**
 * @class UserApi
 */
export class UserApi {

    /**
     * Create the api.
     * @static
     */
    public static create(router: Router) {
        // DELETE
        router.delete("/users/:id([0-9a-f]{24})", (req: Request, res: Response, next: NextFunction) => {
            new UserApi().delete(req, res, next);
        });

        // GET
        router.get("/users", (req: Request, res: Response, next: NextFunction) => {
            new UserApi().list(req, res, next);
        });
        router.get("/users/:id([0-9a-f]{24})", (req: Request, res: Response, next: NextFunction) => {
            new UserApi().get(req, res, next);
        });

        // POST
        router.post("/users", (req: Request, res: Response, next: NextFunction) => {
            new UserApi().create(req, res, next);
        });

        // PUT
        router.put("/users/:id([0-9a-f]{24})", (req: Request, res: Response, next: NextFunction) => {
            new UserApi().update(req, res, next);
        });
    }

    /**
     * Create a new user.
     * @param req {Request} The express request object.
     * @param res {Response} The express response object.
     * @param next {NextFunction} The next function to continue.
     */
    public create(req: Request, res: Response, next: NextFunction) {
        // create user
        const user = new User(req.body);
        user.save().then(user => {
            res.json(user.toObject());
            next();
        }).catch(next);
    }

    /**
     * Delete a user.
     * @param req {Request} The express request object.
     * @param res {Response} The express response object.
     * @param next {NextFunction} The next function to continue.
     */
    public delete(req: Request, res: Response, next: NextFunction) {
        // verify the id parameter exists
        const PARAM_ID: string = "id";
        if (req.params[PARAM_ID] === undefined) {
            res.sendStatus(404);
            next();
            return;
        }

        // get id
        const id: string = req.params[PARAM_ID];

        // get user
        User.findById(id).then(user => {

            // verify user exists
            if (user === null) {
                res.sendStatus(404);
                next();
                return;
            }

            user.remove().then(() => {
                // res.sendStatus(200);
                res.json(user.toObject());
                next();
            }).catch(next);
        }).catch(next);
    }

    /**
     * Get a user.
     * @param req {Request} The express request object.
     * @param res {Response} The express response object.
     * @param next {NextFunction} The next function to continue.
     */
    public get(req: Request, res: Response, next: NextFunction) {
        // verify the id parameter exists
        const PARAM_ID: string = "id";
        if (req.params[PARAM_ID] === undefined) {
            res.sendStatus(404);
            next();
            return;
        }

        // get id
        const id: string = req.params[PARAM_ID];

        // get user
        User.findById(id).then(user => {

            // verify user was found
            if (user === null) {
                res.sendStatus(404);
                next();
                return;
            }

            // send json of user object
            res.json(user.toObject());
            next();
        }).catch(next);
    }

    /**
     * List all users.
     * @param req {Request} The express request object.
     * @param res {Response} The express response object.
     * @param next {NextFunction} The next function to continue.
     */
    public list(req: Request, res: Response, next: NextFunction) {
        // get users
        let filters = {}
        if (req.query.q !== undefined) {
            filters = {
                $or: [
                    { "name": { "$regex": req.query.q, "$options": "i" } },
                    { "username": { "$regex": req.query.q, "$options": "i" } }
                ]
            }
        }
        User.find(filters).then(users => {
            res.json(users.map(user => user.toObject()));
            next();
        }).catch(next);
    }

    /**
     * Update a user.
     * @param req {Request} The express request object.
     * @param res {Response} The express response object.
     * @param next {NextFunction} The next function to continue.
     */
    public update(req: Request, res: Response, next: NextFunction) {
        const PARAM_ID: string = "id";

        // verify the id parameter exists
        if (req.params[PARAM_ID] === undefined) {
            res.sendStatus(404);
            next();
            return;
        }

        // get id
        const id: string = req.params[PARAM_ID];

        // get user
        User.findById(id).then(user => {

            // verify user was found
            if (user === null) {
                res.sendStatus(404);
                next();
                return;
            }

            // save user
            Object.assign(user, req.body).save().then((user: UserModel) => {
                res.json(user.toObject());
                next();
            }).catch(next);
        }).catch(next);
    }

}