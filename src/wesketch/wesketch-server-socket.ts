// https://ourcodeworld.com/articles/read/445/how-to-use-event-emitters-with-es5-and-es6-in-node-js-easily

import { WesketchEventType, IWesketchEvent } from "./wesketch-server";

export class WesketchServerSocket {
    private _io: SocketIO.Namespace;

    constructor(io: SocketIO.Server, onEvent: (event: IWesketchEvent) => void) {
        this._io = io.of('wesketch');
        this._io.on('connection', (client: SocketIO.Socket) => {
            // console.log('### Client Connected')

            client.on('event', (event: IWesketchEvent) => {
                event.clientId = client.id;
                onEvent(event);
            })

            client.on('disconnect', () => {
                console.log('### Client Disconnected: ', client.id);
            })
        });
    }

    sendServerEvent = (type: WesketchEventType, value: any) => {
        const event = {
            clientId: 'system',
            userId: 'system',
            userName: 'system',
            timestamp: new Date(),
            type,
            value
        };
        this.sendEvent(event);
    }

    sendEvent = (event: IWesketchEvent, serverEvent: boolean = false) => {
        if (serverEvent) {
            event.clientId = 'system';
            event.userId = 'system';
            event.userName = 'system';
            event.timestamp = new Date()
        }
        this._io.emit('event', event);
        // console.log('sendEvent: ', WesketchEventType[event.type]);        
    }
}