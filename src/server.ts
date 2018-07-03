import * as bodyParser from 'body-parser'
import * as http from 'http'
import * as express from 'express'
import * as morgan from 'morgan'
import * as cors from 'cors'
import * as socketIo from 'socket.io'

import errorHandler = require('errorhandler')
import mongoose = require('mongoose')

import { IUser } from './user/user.model';
import { userSchema } from './user/user.model';

import { serverConfig } from './server.config'
import { BaseMongooseRepository } from './shared/base-mongoose.repository'
import { AuthService } from './auth/auth.service'

import { WesketchServer } from './wesketch/wesketch-server';

import { AuthEndpoint } from './auth/auth.endpoint';
import { UserEndpoint } from './user/user.endpoint'
import { RecipesEndpoint } from './recipes/recipes.endpoint';


/**
 * The server.
 *
 * @class Server
 */
export class Server {

    authService: AuthService
    wesketchServer: WesketchServer;
    public app: express.Application

    /**
     * Bootstrap the application.
     * @static
     */
    public static bootstrap(): Server {
        return new Server()
    }

    constructor() {
        // Create expressjs application
        this.app = express()

        // Configure application
        this.config()

        // Add endpoints
        this.createEndpoints()
    }

    public config() {
        // cors
        this.app.use(cors())

        // morgan middleware to log HTTP requests
        this.app.use(morgan('dev'))

        // use json form parser middlware
        this.app.use(bodyParser.json())

        // use query string parser middlware
        this.app.use(bodyParser.urlencoded({
            extended: true
        }))

        // Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect(serverConfig.db, { useMongoClient: true });
        mongoose.connection.on('error', error => console.error(error));

        // Initializer auth service
        this.authService = new AuthService(serverConfig.secret)

        //catch 404 and forward to error handler
        this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404
            next(err)
        })

        //error handling
        this.app.use(errorHandler())
    }

    public createEndpoints() {
        var router = express.Router()

        // Configure CORS
        const corsOptions: cors.CorsOptions = {
            allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
            credentials: true,
            methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
            origin: ['https://ca7o.herokuapp.com', 'http://localhost:4200'],
            preflightContinue: false
        }
        router.use(cors(corsOptions))

        // TODO: what do I do with this ?
        const userRepository = new BaseMongooseRepository<IUser>("User", userSchema)

        // Create endpoints        
        new AuthEndpoint('/auth', router, userRepository, this.authService);
        new UserEndpoint('/api/users', router, userRepository, this.authService);
        new RecipesEndpoint('/api/recipes', router, this.authService);

        // Router
        this.app.use(router);

        // Enable CORS pre-flight
        router.options('*', cors(corsOptions))

        // DEBUG, list routes registerd
        router.stack.map(stack => {
            if (stack && stack.route) {
                console.log(stack.route.path, stack.route.methods);
            }
        })
    }

    public start() {
        const port = process.env.PORT || 5000;

        // create http server
        const httpServer = http.createServer(this.app)

        // socket.io
        const io = socketIo(httpServer, { origins: '*:*' })

        // Create Wesketch server
        this.wesketchServer = new WesketchServer(io);
        this.wesketchServer.init();

        // listen on provided ports
        httpServer.listen(port, function () {
            console.log('App is running on port: ' + port);
        });

        // add error handler
        httpServer.on("error", (error: Error) => {
            console.log('error: ', error)
        });

        // start listening on port
        httpServer.on("listening", (event: string) => {
            // console.log(event);
        });
    }

}

const server = new Server()
server.start()