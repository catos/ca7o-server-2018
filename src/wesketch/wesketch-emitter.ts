// https://ourcodeworld.com/articles/read/445/how-to-use-event-emitters-with-es5-and-es6-in-node-js-easily

import { EventEmitter } from "events";
import { WesketchEventType, IWesketchEvent } from "./wesketch-server";

export class WesketchEmitter extends EventEmitter {
    private _io: SocketIO.Namespace;

    constructor(io: SocketIO.Server) {
        super();

        // Sockets
        this._io = io.of('wesketch');
        this._io.on('connection', (client: SocketIO.Socket) => {
            // console.log('### Client Connected')

            client.on('event', (event: any) => {

                if (event.type !== WesketchEventType.Draw) {
                    console.log(`### [event] client.id: ${client.id}, timestamp: ${event.timestamp}, type: ${WesketchEventType[event.type]}`);
                }

                // event.client = client.id;
                // this.handleEvent(event);
                this.emit('event', event);
            })

            client.on('disconnect', () => {
                console.log('### Client Disconnected: ', client.id);
            })
        });


    }

    sendServerEvent = (type: WesketchEventType, value: any) => {
        const event = {
            client: 'system',
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
            event.client = 'system';
            event.userId = 'system';
            event.userName = 'system';
            event.timestamp = new Date()
        }
        // this.emit('event', value);
        this._io.emit('event', event);
        console.log('sendEvent: ', WesketchEventType[event.type]);
        
    }
}

// export const emitter = new WesketchEmitter();

// const emitter = new WesketchEmitter();

// emitter.addListener('event', (event) => {
//     console.log('WesketchEmitter:', event);
// })

// export default emitter;
