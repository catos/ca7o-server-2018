export interface ISocketEvent {
    socketId: string;
    timestamp: number;
    type: string;
    value: any;
}
/**
 * CacSocket - Responsible for socket communication & offers callbacks for events and connections
 */
export class SocketServerService {
    io: SocketIO.Namespace;

    constructor(io: SocketIO.Server,
        channel: string,
        onConnect: (client: SocketIO.Socket) => void,
        onDisconnect: (client: SocketIO.Socket) => void,
        onEvent: (event: ISocketEvent) => void) {

        this.io = io.of(`/${channel}`);
        this.io.on('connection', (client: SocketIO.Socket) => {
            onConnect(client);
            client.on('event', (event: ISocketEvent) => onEvent(event));
            client.on('disconnect', () => onDisconnect(client));
            client.on('connect_timeout', (timeout) => console.log(`Client timeout, socketId: ${client.id}, timeout: ${timeout}`))
            client.on('connect_error', (error) => console.log(`Client error, socketId: ${client.id}, error: ${error}`));

            client.on('ping', () => console.log(`Ping`));
            client.on('pong', (latency) => console.log(`Pong, latency: ${latency}`));
        });
    }

    emitEvent = (event: ISocketEvent) => {
        this.io.emit('event', event);
    }

    emit = (value: any, type: string = 'message', socketId: string = 'n/a') => {
        const event: ISocketEvent = {
            socketId,
            timestamp: Date.now(),
            type,
            value
        };
        this.emitEvent(event);
    }    
}