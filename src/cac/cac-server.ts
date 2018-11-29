interface IPlayer {
    socketId: string;
    name: string;
    ticks: number;
    clicks: number;
    tps: number;
}

interface ITickerState {
    updated: number;
    timer: number;
    players: IPlayer[]
}

export class CacServer {
    public state: ITickerState;
    private prevState: ITickerState;
    private handlers: ITickerHandler[];
    private components: ITickerComponent[];
    private _io: SocketIO.Namespace;
    intervalId: any;

    constructor(io: SocketIO.Server) {
        console.log('new CacServer');

        this.state = {
            updated: Date.now(),
            timer: 0,
            players: []
        };
        this.prevState = {...this.state};

        this.initHandlers();
        this.initComponents();
        this.initIo(io);
        this.start();
    }

    private initHandlers = () => {
        this.handlers = [];
        this.handlers.push(new ClickHandler());
        this.handlers.push(new StopHandler());
    }

    private initComponents = () => {
        this.components = [];
        this.components.push(new UpdateTimer());
        this.components.push(new ResetTimer());
    }

    private initIo = (io: SocketIO.Server) => {
        this._io = io.of('/cac');
        this._io.on('connection', (client: SocketIO.Socket) => {
            console.log('### CacClient Connected')
            if (this.state.players.find(p => p.socketId === client.id) === undefined) {
                const newPlayer: IPlayer = {
                    socketId: client.id,
                    name: 'N/A',
                    ticks: 0,
                    clicks: 0,
                    tps: 0
                };
                this.state.players.push(newPlayer);
                this.state.updated = Date.now();
                console.log('players: ', this.state.players);
            }

            client.on('event', (event: any) => {
                // console.log('### CacClient event: ', event);
                this.handlers.forEach(handler => handler.onEvent(event, this.state));
            })

            client.on('disconnect', () => {
                console.log('### CacClient Disconnected')
            })
        });
    }

    private start = () => {
        console.log('start');
        this.intervalId = setInterval(() => {
            this.update();
        }, 100);
    }

    private update = () => {
        // const prevState = this.state;

        this.components.forEach(component => component.update(this.state));

        // if state change...send new state to client
        // console.log('update: ', JSON.stringify(prevState), JSON.stringify(this.state));
        // if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
        // }

        if (this.state.updated > this.prevState.updated) {
            console.log('prevState !== this.state -> UpdateGameState');
            this._io.emit('event', { type: 'UpdateGameState', value: this.state });
        }

        this.prevState = { ...this.state };
    }
}

// ----------------------------------------------------------------------

interface ITickerComponent {
    update: (state: ITickerState) => void;
}

class UpdateTimer implements ITickerComponent {
    update = (state: ITickerState) => {
        // state.timer += 1;
    }
}

class ResetTimer implements ITickerComponent {
    update = (state: ITickerState) => {
        if (state.timer > 10) {
            state.timer = 0;
            console.log('ResetTimer');
        }
    }
}

// ----------------------------------------------------------------------

interface ITickerHandler {
    onEvent: (event: any, state: ITickerState) => void;
}

class ClickHandler implements ITickerHandler {
    onEvent = (event: any, state: ITickerState) => {
        if (event.type === 'click') {
            const player = state.players.find(p => p.socketId === event.socketId);
            if (player !== undefined) {
                player.clicks++;

                state.updated = Date.now();
            }
            console.log('ClickHandler->event');
        }
    };
}

class StopHandler implements ITickerHandler {
    onEvent = (event: any, state: ITickerState) => {
        if (event.type === 'stop') {
            console.log('StopHandler->event');
        }
    };
}