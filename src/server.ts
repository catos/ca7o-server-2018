import * as bodyParser from 'body-parser'
import * as http from 'http'
import * as express from 'express'
import * as morgan from 'morgan'
import * as path from 'path'
import * as cors from 'cors'
import * as socketIo from 'socket.io'
import * as firebase from 'firebase-admin';

import errorHandler = require('errorhandler')
import mongoose = require('mongoose')

import { serverConfig } from './server.config'
import { BaseMongooseRepository } from './shared/base-mongoose.repository'
import { AuthService } from './auth/auth.service'
import { UserEndpoint } from './user/user.endpoint'
import { IUser } from './user/user.interface';
import { userSchema } from './user/user.model';
import { AuthEndpoint } from './auth/auth.endpoint';
import { BaseEndpoint } from './shared/base.endpoint';
import { IEndpoint } from './shared/endpoint.interface';
import { WesketchServer } from './wesketch/wesketch-server';
import { Firestore } from '@google-cloud/firestore';
import { RecipesEndpoint } from './recipes/recipes.endpoint';

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    endpoints: IEndpoint[] = []
    firestore: Firestore;
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

        // connect to mongoose
        mongoose.connect(serverConfig.db, {
            useMongoClient: true
        })
        mongoose.connection.on('error', error => {
            console.error(error)
        })

        // Connecto to Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyB-iLXapTpXII83f-XdGb3C8sKSVJTyybE",
            authDomain: "ca7o-5ef9d.firebaseapp.com",
            databaseURL: "https://ca7o-5ef9d.firebaseio.com",
            projectId: "ca7o-5ef9d",
            storageBucket: "ca7o-5ef9d.appspot.com",
            messagingSenderId: "1061015171096"
        };
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this.firestore = firebase.firestore();

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
        this.endpoints.push(new AuthEndpoint(
            '/auth',
            router,
            userRepository,
            this.authService))

        this.endpoints.push(new UserEndpoint(
            '/api/users',
            router,
            userRepository,
            this.authService))

        console.log('pre', router);
        this.endpoints.push(new RecipesEndpoint(
            '/api/recipes',
            router,
            this.firestore,
            this.authService))
        console.log('post', router);

        // Wire up routes
        for (let endpoint of this.endpoints) {
            endpoint.init();
            // this.app.use(endpoint.path, endpoint.router);

            // Debug
            console.log('Endpoint registered on: ', endpoint.path);
        }
        this.app.use(router);

        // Enable CORS pre-flight
        router.options('*', cors(corsOptions))
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