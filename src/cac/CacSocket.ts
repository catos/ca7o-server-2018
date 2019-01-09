import { IEvent } from "./Models";

/**
 * CacSocket - Responsible for socket communication & offers callbacks for events and connections
 */
export class CacSocket {
    io: SocketIO.Namespace;

    constructor(io: SocketIO.Server,
        onConnect: (client: SocketIO.Socket) => void,
        onEvent: (event: IEvent) => void,
        onDisconnect: (socket: SocketIO.Socket) => void) {

        this.io = io.of('/cac');
        this.io.on('connection', (client: SocketIO.Socket) => {
            onConnect(client);
            client.on('event', onEvent);
            client.on('disconnect', () => onDisconnect(client));
            client.on('connect_timeout', (timeout) => console.log(`Client timeout, socketId: ${client.id}, timeout: ${timeout}`))
            client.on('connect_error', (error) => console.log(`Client error, socketId: ${client.id}, error: ${error}`));

            client.on('ping', () => console.log(`Ping`));
            client.on('pong', (latency) => console.log(`Pong, latency: ${latency}`));
        });
    }

    emit = (event: IEvent) => {
        this.io.emit('event', event);
    }
}