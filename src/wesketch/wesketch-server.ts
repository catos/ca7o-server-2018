enum WesketchEventType {
    ServerError,
    PlayerJoined,
    PlayerLeft,
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

    start() {
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

    sendEvent(event: IWesketchEvent) {
        this._io.emit('event', event)
    }

    updateGameState() {
        const event = {
            client: '',
            userId: '',
            timestamp: new Date(),
            type: WesketchEventType.UpdateGameState,
            value: this.state
        };
        this.sendEvent(event);
    }

    handleEvent(event: IWesketchEvent) {
        switch (event.type) {
            case WesketchEventType.PlayerJoined:
                new PlayerJoined().handleEvent(event, this);
                break;
                case WesketchEventType.PlayerLeft:
                new PlayerLeft().handleEvent(event, this);
                break;
            case WesketchEventType.Message:
                new Message().handleEvent(event, this);
                break;
            default:
                var errorEvent: IWesketchEvent = {
                    client: '',
                    userId: '',
                    timestamp: new Date(),
                    type: WesketchEventType.ServerError,
                    value: {
                        message: 'No eventhandler found for event',
                        event
                    }
                };
                this.sendEvent(errorEvent);
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
            name: event.value.player
        };

        const existingPlayer = server.state.players
            .find((p: IPlayer) => p.userId === player.userId);

        if (existingPlayer === undefined) {
            server.state.players.push(player);
        }

        server.updateGameState();
        console.log('### PlayerJoined-handler, userId: ' + event.userId);
    }
}

class PlayerLeft implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players = server.state.players.filter(p => p.userId !== event.userId)

        server.updateGameState();
        console.log('### PlayerLeft-handler, userId: ' + event.userId);
    }
}

class Message implements IEventHandler {
    handleEvent = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}