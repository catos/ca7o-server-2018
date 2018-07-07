import { WORDLIST } from "./wordlist-new";
import { randomElement } from "../shared/utils";

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
    ResetGame,
    PauseGame,
    ShowScores
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
    score: number;
    drawCount: number;
    isDrawing: boolean;
    guessedWord: boolean;
}

interface IWesketchGameState {
    phase: PhaseTypes,
    players: IPlayer[],

    gamePaused: boolean;
    round: number;
    timeRemaining: number;
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
    public defaultState: IWesketchGameState;

    readonly ROUND_DURATION: number = 10; // 90
    readonly END_ROUND_DURATION: number = 5; // 10
    readonly END_GAME_DURATION: number = 10; // 60

    readonly DRAWINGS_PER_PLAYER: number = 3;
    readonly TIMER_DELAY: number = 1000;

    constructor(io: SocketIO.Server) {
        this._io = io;

        this.defaultState = {
            phase: PhaseTypes.Lobby,
            players: [],
            gamePaused: false,
            round: 1,
            timeRemaining: 0,
            currentWord: '',
            currentColor: '#000000',
            brushSize: 3
        };
        this.state = this.defaultState;

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
            case WesketchEventType.PauseGame:
                new PauseGame().handle(event, this);
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

    // startTimer = (duration: number, next: () => void) => {
    //     this.state.timeRemaining = duration;

    //     var self = this;
    //     this.intervalObj = setInterval(() => {
    //         console.log('startTime: ' + duration + ', remaining: ' + self.state.timeRemaining);
    //         if (self.state.timeRemaining <= 0) {
    //             self.stop = true;
    //         }

    //         if (self.stop) {
    //             clearInterval(self.intervalObj);

    //             if (!self.reset) {
    //                 return next();
    //             }
    //         } else {
    //             self.state.timeRemaining--;
    //         }

    //         self.sendServerEvent(WesketchEventType.UpdateGameState, self.state);
    //     }, 1000);
    // }

    startTimer = (duration: number, next: () => void) => {
        this.state.timeRemaining = duration;
        const intervalId = setInterval(() => {
            if (!this.state.gamePaused) {
                this.state.timeRemaining--;

                if (this.state.timeRemaining <= 0) {
                    clearInterval(intervalId);
                    console.log('cleared interval! run next()');
                    next();
                }

                this.sendServerEvent(WesketchEventType.UpdateGameState, this.state);
            }
        }, this.TIMER_DELAY);
    }

    startRound = () => {
        // Set phase to drawing
        this.state.phase = PhaseTypes.Drawing;

        // Increment round counter
        this.state.round += this.state.round;

        // Clear canvas
        this.sendServerEvent(WesketchEventType.ClearCanvas, {});

        // Choose drawing player
        const sortedPlayers = this.state.players.sort((a, b) => {
            if (a.drawCount > b.drawCount) {
                return 1;
            }

            if (b.drawCount > a.drawCount) {
                return -1;
            }

            return 0;
        });
        const drawingPlayer = sortedPlayers[0];

        this.state.players.map(player => {
            if (player.userId == drawingPlayer.userId) {
                player.isDrawing = true;
                player.drawCount++;
            }
        })

        // Choose current word
        this.state.currentWord = randomElement(WORDLIST);

        // Update game state
        this.sendServerEvent(WesketchEventType.UpdateGameState, this.state);

        // Start timer
        // new StartTimer().execute(server, new EndRound().execute);
        this.startTimer(this.ROUND_DURATION, this.endRound);
        this.sendServerEvent(WesketchEventType.SystemMessage, { message: `Round started!` })
    }

    endRound = () => {
        // Set phase to endRound
        this.state.phase = PhaseTypes.RoundEnd;

        // Show last word to players
        this.sendServerEvent(
            WesketchEventType.SystemMessage,
            { message: `The word was: ${this.state.currentWord}` });

        // Reset players
        this.state.players.map(p => {
            p.isDrawing = false;
            p.guessedWord = false;
        });

        // End game if all players have drawn DRAWINGS_PER_PLAYER times each
        if (this.state.players.every(p => p.drawCount === this.DRAWINGS_PER_PLAYER)) {
            this.endGame();
        }

        // Update game state
        this.sendServerEvent(WesketchEventType.UpdateGameState, this.state);

        // Start new round in X seconds
        this.startTimer(this.END_ROUND_DURATION, this.startRound);
        this.sendServerEvent(
            WesketchEventType.SystemMessage,
            { message: `Starting new round in ${this.END_ROUND_DURATION} seconds...` })
    }

    endGame = () => {
        // Set end phase
        this.state.phase = PhaseTypes.GameEnd;

        // Update game state
        this.sendServerEvent(WesketchEventType.UpdateGameState, this.state);

        // Show scores
        this.sendServerEvent(WesketchEventType.ShowScores, {});

        // Reset game in X seconds
        this.startTimer(this.END_GAME_DURATION, this.resetGame);
        this.sendServerEvent(
            WesketchEventType.SystemMessage,
            { message: `Reset game in ${this.END_GAME_DURATION} seconds...` })

    }

    resetGame = () => {
        // TODO: reset game
        // console.log('reset game!');
        
        this.state = this.defaultState;
        const players = this.state.players.map(p => {
            p.isReady = false;
            p.score = 0;
            p.drawCount = 0;
            p.isDrawing = false;
            p.guessedWord = false;
            return p;
        });
        
        this.state.players = players;

        this.sendServerEvent(WesketchEventType.SystemMessage, { message: 'Game has been reset' });
        this.sendServerEvent(WesketchEventType.UpdateGameState, this.state);
        this.sendServerEvent(WesketchEventType.ClearCanvas, {});
    }
}

/**************************************************************************************
 * EventHandlers: responds to client events, modifies gameState, may produce new events
 * TODO: move to separate files...?
 **************************************************************************************/

interface IWesketchEventHandler {
    handle(event: IWesketchEvent, server: WesketchServer): void;
}

class PlayerJoined implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        const player = {
            clientId: event.client,
            userId: event.userId,
            name: event.userName,
            isReady: false,
            score: 0,
            drawCount: 0,
            isDrawing: false,
            guessedWord: false
        };

        const existingPlayer = server.state.players
            .find((p: IPlayer) => p.userId === player.userId);

        if (existingPlayer === undefined) {
            server.state.players.push(player);
            server.sendServerEvent(WesketchEventType.SystemMessage, { message: `${player.name} joined the game` });
            server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
        }

    }
}

class PlayerLeft implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players = server.state.players.filter(p => p.userId !== event.userId)

        server.sendServerEvent(WesketchEventType.SystemMessage, { message: `Player left the game` });
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class PlayerReady implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.players.forEach(p => {
            if (p.userId === event.userId) {
                p.isReady = !p.isReady;
            }
        });

        if (server.state.players.every(p => p.isReady) && server.state.players.length > 1) {
            server.sendServerEvent(WesketchEventType.SystemMessage, { message: 'All players are ready, starting game!' });
            server.startRound();
        }

        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class Message implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}

class Draw implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}

class ClearCanvas implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.sendEvent(event);
    }
}

// TODO: group these events into ChangeDrawSettings ?
class ChangeColor implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.currentColor = event.value;
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class ChangeBrushSize implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.brushSize += +event.value;
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class ResetGame implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.resetGame();
    }
}

class PauseGame implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        server.state.gamePaused = !server.state.gamePaused;

        const message = server.state.gamePaused
            ? 'Game has been paused'
            : 'Game has been un-paused';

        server.sendServerEvent(WesketchEventType.SystemMessage, { message });
        server.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}