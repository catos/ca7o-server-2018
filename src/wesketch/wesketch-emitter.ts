// https://ourcodeworld.com/articles/read/445/how-to-use-event-emitters-with-es5-and-es6-in-node-js-easily

import { EventEmitter } from "events";

export class WesketchEmitter extends EventEmitter {
    private _io: SocketIO.Namespace;

    constructor(io: SocketIO.Server) {
        super();

        // Sockets
        this._io = io.of('wesketch');
        this._io.on('connection', (client: SocketIO.Socket) => {
            // console.log('### Client Connected')

            client.on('event', (event: any) => {
                console.log(`### client: ${event.client}, timestamp: ${event.timestamp}, type: ${event.type}`, event.value)
                // event.client = client.id;
                // this.handleEvent(event);
            })

            client.on('disconnect', () => {
                console.log('### Client Disconnected: ', client.id);
                // this.clientDisconnected(client.id);
            })
        });


    }

    send = (value: object) => {
        this.emit('event', value);
    }
}

// export const emitter = new WesketchEmitter();

// const emitter = new WesketchEmitter();

// emitter.addListener('event', (event) => {
//     console.log('WesketchEmitter:', event);
// })

// export default emitter;
