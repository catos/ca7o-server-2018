#!/usr/bin/env node
"use strict";

// module dependencies
var port = process.env.PORT || 8080
var server = require("./server");
var app = server.Server.bootstrap().app;

// Debug
var debug = require("debug")("express:server");

// create http server
var http = require("http").createServer(app);

// Socket.io: 
// TODO: refactor
var io = require('socket.io')(http, { origins: 'http://localhost:4200' });

io.on('connection', (client) => {
    console.log('client connected')

    client.on('event', (data) => {
        // console.log('event: ' + data)
        io.emit('event', data)
    })

    client.on('disconnect', () => {
        console.log('client disconnected')
    })
})

// listen on provided ports
http.listen(port, function() {
    console.log('App is running on port: ' + port);
});

// add error handler
http.on("error", onError);

// start listening on port
http.on("listening", onListening);


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    console.log('error: ', error)
    if (error.syscall !== "listen") {
        throw error;
    }

    var bind = typeof port === "string"
        ? "Pipe " + port
        : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = http.address();
    var bind = typeof addr === "string"
        ? "pipe " + addr
        : "port " + addr.port;
    debug("Listening on " + bind);
}