import { ITickerState, defaultTickerState } from "./ITickerState";
import { IPlayer } from "./IPlayer";
import { ICacEvent } from "./ICacEvent";

export interface ICacServerState {
    gameState: ITickerState

    intervalId: any;
    _io: SocketIO.Namespace;

    handlers: ITickerHandler[];
    components: ITickerComponent[];
}

export class CacServer {
    public state: ICacServerState;

    constructor(io: SocketIO.Server) {
        console.log('### new CacServer');
        this.state = {
            gameState: defaultTickerState,
            intervalId: {},
            _io: io.of('/cac'),
            handlers: [],
            components: []
        };

        this.initHandlers();
        this.initComponents();
        this.initIo();
        this.start();
    }

    private initHandlers = () => {
        console.log('### initHandlers');
        this.state.handlers.push(new ClickHandler());
        this.state.handlers.push(new StopHandler());
    }

    private initComponents = () => {
        console.log('### initComponents');
        this.state.components.push(new SendUpdatedGameState());
        this.state.components.push(new UpdateTicks());
        this.state.components.push(new GameOver());
    }

    private initIo = () => {
        console.log('### initIo');

        // Fetch name from handshake query
        let name = 'N/A';
        this.state._io.use(function (socket, next) {
            name = socket.handshake.query.name;
            return next();
        });

        this.state._io.on('connection', (client: SocketIO.Socket) => {
            console.log('### CacClient Connected')

            // Connect
            const handler = new NewPlayer();
            const newPlayerEvent: ICacEvent = {
                socketId: client.id,
                name,
                timestamp: Date.now(),
                type: 'new-player',
                value: {}
            };
            console.log(newPlayerEvent);
            handler.onEvent(newPlayerEvent, this.state);

            // Event
            client.on('event', (event: any) => {
                this.state.handlers.forEach(handler => handler.onEvent(event, this.state));
            })

            // Disconnect
            client.on('disconnect', () => {
                console.log('### CacClient Disconnected', client.id)
                this.state.gameState.players = this.state.gameState.players.filter(p => p.socketId !== client.id);
            })
        });
    }

    private start = () => {
        console.log('### Start');
        this.state.intervalId = setInterval(() => {
            this.update();
        }, 100);
    }

    private update = () => {
        this.state.components.forEach(component => component.update(this.state));
        this.state.gameState.prevUpdated = this.state.gameState.updated;
    }
}

// ----------------------------------------------------------------------

interface ITickerComponent {
    update: (state: ICacServerState) => void;
}

class SendUpdatedGameState implements ITickerComponent {
    update = (state: ICacServerState) => {
        const { gameState } = state;
        let sendUpdate: boolean = false;

        // Client input requires update
        if (gameState.updated > gameState.prevUpdated) {
            console.log('Client input requires update');
            sendUpdate = true;
        }

        // Send update each 1 sec minimum
        const now = Date.now();
        const elapsed = now - gameState.updated;
        if (elapsed > 1000 * 3) {
            console.log('Send update each 1 sec minimum');
            gameState.updated = now;
            sendUpdate = true;
        }

        if (sendUpdate) {
            const updateEvent: ICacEvent = {
                socketId: 'na',
                name: 'server',
                timestamp: now,
                type: 'UpdateGameState',
                value: gameState
            };
            state._io.emit('event', updateEvent);
        }
    }
}

class UpdateTicks implements ITickerComponent {
    update = (state: ICacServerState) => {
        const { gameState } = state;

        gameState.ticks += 1;
    }
}

class GameOver implements ITickerComponent {
    update = (state: ICacServerState) => {
        const { gameState } = state;

        if (gameState.players.find(p => p.clicks >= 10)) {
            gameState.gameOver = true;

            clearInterval(state.intervalId);
            console.log('### Game Over!');
        }
    }
}

// ----------------------------------------------------------------------

interface ITickerHandler {
    onEvent: (event: ICacEvent, state: ICacServerState) => void;
}

class NewPlayer implements ITickerHandler {
    onEvent = (event: ICacEvent, state: ICacServerState) => {
        const { gameState } = state;

        if (event.type !== 'new-player') {
            return;
        }

        if (gameState.players.find(p => p.socketId === event.socketId) === undefined) {
            const newPlayer: IPlayer = {
                socketId: event.socketId,
                name: event.name,
                ticks: 0,
                clicks: 0,
                tps: 0
            };
            gameState.players.push(newPlayer);
            gameState.updated = Date.now();
            console.log('players: ', gameState.players);
        }
    }
}

class ClickHandler implements ITickerHandler {
    onEvent = (event: ICacEvent, state: ICacServerState) => {
        const { gameState } = state;
        if (event.type !== 'click') {
            return;
        }

        const player = gameState.players.find(p => p.socketId === event.socketId);
        if (player !== undefined) {
            player.clicks++;

            gameState.updated = Date.now();
        }
    };
}

class StopHandler implements ITickerHandler {
    onEvent = (event: ICacEvent, state: ICacServerState) => {
        if (event.type === 'stop') {
        }
    };
}