export class TickerServer {
    private _io: SocketIO.Namespace;

    constructor(io: SocketIO.Server) {
        this._io = io.of('ticker');

        this._io.on('connection', (client: SocketIO.Socket) => {
            console.log('### TickerClient Connected')

            client.on('event', (event: any) => {
                console.log('### TickerClient event: ', event);
            })

            client.on('disconnect', () => {
                console.log('### TickerClient Disconnected')
            })
        });

    }

}