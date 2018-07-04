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
    ChangeColor,
    ChangeBrushSize,
    UpdateGameState,
    ResetGame
}

interface IWesketchEvent {
    client: string;
    userId: string;
    userName: string;
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
    currentColor: string;
    brushSize: number;
}

/**
 * WesketchServer
 * init: initializes server with sockets, routes events to handleEvent-function
 * handleEvent: factory-pattern-switch, handles events from clients
 * sendServerEvent: goto method for event-handlers to create events
 */
export class WesketchServer {
    private _io: SocketIO.Server;
    public state: IWesketchGameState;

    constructor(io: SocketIO.Server) {
        this._io = io;

        this.state = {
            phase: PhaseTypes.Lobby,
            players: [],
            round: 1,
            currentWord: '',
            currentColor: '#000000',
            brushSize: 3
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

    handleEvent(event: IWesketchEvent) {
        switch (event.type) {
            case WesketchEventType.PlayerJoined:
                new PlayerJoined().handle(event, this);
                break;
            case WesketchEventType.PlayerLeft:
                new PlayerLeft().handle(event, this);
                break;
            case WesketchEventType.PlayerReady:
                new PlayerReady().handle(event, this);
                break;
            case WesketchEventType.Message:
                new Message().handle(event, this);
                break;
            case WesketchEventType.Draw:
                new Draw().handle(event, this);
                break;
            case WesketchEventType.ClearCanvas:
                new ClearCanvas().handle(event, this);
                break;
            case WesketchEventType.ChangeColor:
                new ChangeColor().handle(event, this);
                break;
            case WesketchEventType.ChangeBrushSize:
                new ChangeBrushSize().handle(event, this);
                break;
            case WesketchEventType.ResetGame:
                new ResetGame().handle(event, this);
                break;
            default:
                this.sendServerEvent(WesketchEventType.ServerError,
                    {
                        message: `No eventhandler found for event: ${WesketchEventType[event.type]}`,
                        event
                    });
                break;
        }
    }

    sendServerEvent(type: WesketchEventType, value: any) {
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

    sendEvent(event: IWesketchEvent) {
        this._io.emit('event', event);
    }
}

/**
 * ServerCommand: triggered by events and conditions, produces events
 * startGame
 * resetGame
 * startRound
 * endRound
 * endGame
 * 
 * startTimer
 */
interface IServerCommand {
    execute(server: WesketchServer): void;
}

class UpdateGameState implements IServerCommand {
    execute(server: WesketchServer): void {
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class StartGame implements IServerCommand {
    execute(server: WesketchServer): void {
        server.sendServerEvent(WesketchEventType.SystemMessage, { message: `Game started!` })

        if (server.state.phase === PhaseTypes.Lobby) {
            server.state.phase = PhaseTypes.Drawing;
            new UpdateGameState().execute(server);
        }
    }
}

// TODO: er dette en command eller event ? Skal alt bare være events ?
// class ResetGame implements IServerCommand {
//     execute(server: WesketchServer): void {
//         var resetState = {
//             phase: PhaseTypes.Lobby,
//             players: server.state.players,
//             round: 1,
//             currentWord: ''
//         } as IWesketchGameState;
//         server.state = resetState;

//         new UpdateGameState().execute(server);
//     }

// }

/**
 * EventHandlers: responds to client events, modifies gameState, may produce new events
 * PlayerJoined
 * PlayerLeft
 * PlayerReady
 */

interface IEventHandler {
    handle(event: IWesketchEvent, server: WesketchServer): void;
}

class PlayerJoined implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        const player = {
            clientId: event.client,
            userId: event.userId,
            name: event.userName,
            isReady: false
        };

        const existingPlayer = server.state.players
            .find((p: IPlayer) => p.userId === player.userId);

        if (existingPlayer === undefined) {
            server.state.players.push(player);
            server.sendServerEvent(WesketchEventType.SystemMessage, { message: `${player.name} joined the game` });
            new UpdateGameState().execute(server);
        }

    }
}

class PlayerLeft implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players = server.state.players.filter(p => p.userId !== event.userId)

        server.sendServerEvent(WesketchEventType.SystemMessage, { message: `Player left the game` });
        new UpdateGameState().execute(server);
    }
}

class PlayerReady implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players.forEach(p => {
            if (p.userId === event.userId) {
                p.isReady = !p.isReady;
            }
        });

        if (server.state.players.every(p => p.isReady) && server.state.players.length > 1) {
            server.sendServerEvent(WesketchEventType.SystemMessage, { message: 'All players are ready, starting game!' });
            new StartGame().execute(server);
        }

        new UpdateGameState().execute(server);
    }
}

class Message implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}

class Draw implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}

class ClearCanvas implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}

class ChangeColor implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.currentColor = event.value;
        new UpdateGameState().execute(server);
    }
}

class ChangeBrushSize implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.brushSize += +event.value;
        new UpdateGameState().execute(server);
    }
}

class ResetGame implements IEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        var resetState = {
            phase: PhaseTypes.Lobby,
            players: server.state.players,
            round: 1,
            currentWord: ''
        } as IWesketchGameState;
        server.state = resetState;

        server.sendServerEvent(WesketchEventType.SystemMessage, { message: 'Game has been reset' });
        new UpdateGameState().execute(server);  
        
        // TODO: hmmm, want o be able to do this...somehow
        // new ClearCanvas().handle({}, server);
    }
}