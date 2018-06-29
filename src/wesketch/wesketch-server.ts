enum WesketchEventType {
    ServerError,
    PlayerJoined,
    PlayerLeft,
    PlayerReady,
    Message,
    SystemMessage,
    StartDraw,
    Draw,
    StopDraw,
    ClearCanvas,
    UpdateGameState
}

interface IWesketchEvent {
    client: string;
    userId: string;
    timestamp: Date;
    type: WesketchEventType;
    value: any;
}

enum PhaseTypes {
    Lobby,
    Drawing,
    RoundEnd,
    GameEnd
}

interface IPlayer {
    clientId: string;
    userId: string;
    name: string;
    isReady: boolean;
}

interface IWesketchGameState {
    phase: PhaseTypes,
    players: IPlayer[],
    round: number;
    currentWord: string;
}

export class WesketchServer {
    private _io: SocketIO.Server;
    public state: IWesketchGameState;

    constructor(io: SocketIO.Server) {
        this._io = io;

        this.state = {
            phase: PhaseTypes.Lobby,
            players: [],
            round: 1,
            currentWord: ''
        };
    }

    init() {
        this._io.on('connection', (client: SocketIO.Socket) => {
            // console.log('### Client Connected')

            client.on('event', (event: IWesketchEvent) => {
                // console.log(`### client: ${event.client}, timestamp: ${event.timestamp}, type: ${WesketchEventType[event.type]}`, event.value)
                this.handleEvent(event);
            })

            client.on('disconnect', () => {
                // console.log('### Client Disconnected')
            })
        });
    }

    start() {
        this.sendServerEvent(WesketchEventType.SystemMessage, { sender: 'system', message: `Game started!` });

        if (this.state.phase === PhaseTypes.Lobby) {
            this.state.phase = PhaseTypes.Drawing;
            this.sendServerEvent(WesketchEventType.UpdateGameState, this.state);
        }
    }

    sendServerEvent(type: WesketchEventType, value: any) {
        const event = {
            client: 'system',
            userId: 'system',
            timestamp: new Date(),
            type,
            value
        };

        this._io.emit('event', event)
    }

    handleEvent(event: IWesketchEvent) {
        switch (event.type) {
            case WesketchEventType.PlayerJoined:
                new PlayerJoined().handleEvent(event, this);
                break;
            case WesketchEventType.PlayerLeft:
                new PlayerLeft().handleEvent(event, this);
                break;
            case WesketchEventType.PlayerReady:
                new PlayerReady().handleEvent(event, this);
                break;
            case WesketchEventType.Message:
                new Message().handleEvent(event, this);
                break;
            case WesketchEventType.Draw:
                new Draw().handleEvent(event, this);
                break;
            case WesketchEventType.ClearCanvas:
                new ClearCanvas().handleEvent(event, this);
                break;
            default:
                this.sendServerEvent(WesketchEventType.ServerError, {
                    message: 'No eventhandler found for event',
                    event
                });
                break;
        }
    }
}

interface IEventHandler {
    handleEvent(event: IWesketchEvent, server: WesketchServer): void;
}

class PlayerJoined implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        const player = {
            clientId: event.client,
            userId: event.userId,
            name: event.value.player,
            isReady: false
        };

        const existingPlayer = server.state.players
            .find((p: IPlayer) => p.userId === player.userId);

        if (existingPlayer === undefined) {
            server.state.players.push(player);
        }

        server.sendServerEvent(WesketchEventType.SystemMessage, { sender: 'system', message: `${player.name} joined the game` });
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
        console.log('### PlayerJoined-handler, userId: ' + event.userId);
    }
}

class PlayerLeft implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players = server.state.players.filter(p => p.userId !== event.userId)

        server.sendServerEvent(WesketchEventType.SystemMessage, { sender: 'system', message: `Player left the game` });
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
        console.log('### PlayerLeft-handler, userId: ' + event.userId);
    }
}

class PlayerReady implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players.forEach(p => {
            if (p.userId === event.userId) {
                p.isReady = !p.isReady;
            }
        });

        if (server.state.players.every(p => p.isReady) && server.state.players.length > 1) {
            server.sendServerEvent(WesketchEventType.SystemMessage, { sender: 'system', message: 'All players are ready, starting game!' });
            server.start();
        }

        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
        console.log('### PlayerReady-handler, userId: ' + event.userId);
    }
}

class Message implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendServerEvent(event.type, event.value);
        console.log('### Message-handler, userId: ' + event.userId);
    }
}

class Draw implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendServerEvent(event.type, event.value);
        // console.log('### Draw-handler, userId: ' + event.userId);
    }
}

class ClearCanvas implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendServerEvent(event.type, event.value);
        console.log('### ClearCanvas-handler, userId: ' + event.userId);
    }
}