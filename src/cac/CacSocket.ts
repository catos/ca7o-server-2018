import { IEvent } from "./Models";

/**
 * CacSocket - Responsible for socket communication & offers callbacks for events and connections
 */
export class CacSocket {
    io: SocketIO.Namespace;

    constructor(io: SocketIO.Server,
        onConnect: (client: SocketIO.Socket) => void,
        onEvent: (event: IEvent) => void,
        onDisconnect: (event: IEvent) => void) {

        this.io = io.of('/cac');
        this.io.on('connection', (client: SocketIO.Socket) => {
            onConnect(client);
            client.on('event', onEvent);
            client.on('disconnect', onDisconnect);
        });
    }

    emit = (event: IEvent) => {
        this.io.emit('event', event);
    }
}