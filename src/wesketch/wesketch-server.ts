import { WORDLIST } from "./wordlist-new";
import { WesketchServerSocket } from "./wesketch-server-socket";
import { randomElement, guessIsClose } from "../shared/utils";

export enum WesketchEventType {
    ServerError,
    PlayerJoined,
    PlayerLeft,
    PlayerReady,
    PlaySound,
    StopSound,
    Message,
    SystemMessage,
    Draw,
    StopDraw,
    GiveUp,
    GiveHint,
    ClearCanvas,
    ChangeColor,
    ChangeBrushSize,
    UpdateGameState,
    ResetGame,
    SaveDrawing,
    GetDrawings,
    ShowScores,
}

export interface IWesketchEvent {
    clientId: string;
    userId: string;
    userName: string;
    timestamp: Date;
    type: WesketchEventType;
    value: any;
}

export enum PhaseTypes {
    Lobby,
    Drawing,
    RoundEnd,
    GameEnd
}

export interface IPlayer {
    clientId: string;
    userId: string;
    name: string;
    isReady: boolean;
    score: number;
    drawCount: number;
    isDrawing: boolean;
    guessedWord: boolean;
}

export interface ITimer {
    remaining: number;
    duration: number;
}

export interface IDrawing {
    player: string;
    word: string;
    data: string;
}

export interface IWesketchGameState {
    debugMode: boolean;
    phase: PhaseTypes,
    players: IPlayer[],

    stop: boolean;
    round: number;
    timer: ITimer;
    currentWord: string;
    hintsGiven: number;

    primaryColor: string;
    secondaryColor: string;
    brushSize: number;
}



/**
 * WesketchServer
 * init: initializes server with sockets, routes events to handleEvent-function
 * handleEvent: factory-pattern-switch, handles events from clients
 * sendServerEvent: goto method for event-handlers to create events
 */
export class WesketchServer {

    public socket: WesketchServerSocket;

    public state: IWesketchGameState;
    static DEFAULT_STATE: IWesketchGameState = {
        debugMode: false,
        phase: PhaseTypes.Lobby,
        players: [],
        stop: false,
        round: 0,
        timer: {
            remaining: 0,
            duration: 0
        },
        currentWord: '',
        hintsGiven: 0,
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        brushSize: 3
    };
    public drawings: IDrawing[] = [];

    public readonly MAX_HINTS_ALLOWED: number = 3;
    public readonly GUESS_SCORE: number = 10;
    public readonly FIRST_GUESS_TIME_REMAINING: number = 30;
    public readonly START_ROUND_DURATION: number = 3;
    public readonly ROUND_DURATION: number = 90;
    public readonly END_ROUND_DURATION: number = 10;
    public readonly DRAWINGS_PER_PLAYER: number = 3;
    public readonly TIMER_DELAY: number = 1000;

    private handlers: IWesketchEventHandler[];
    private intervalId: any;

    constructor(io: SocketIO.Server) {

        // Default values
        this.state = JSON.parse(JSON.stringify(WesketchServer.DEFAULT_STATE));
        this.intervalId = 0;

        // Initialize handlers
        this.handlers = [
            new PlayerJoined(),
            new PlayerLeft(),
            new PlayerReadyHandler(),
            new MessageHandler(),
            new DrawHandler(),
            new GiveUpHandler(),
            new GiveHintHandler(),
            new ClearCanvasHandler(),
            new ChangeColorHandler(),
            new ChangeBrushSizeHandler(),
            new ResetGameHandler(),
            new SaveDrawingHandler(),
            new UpdateGameStateHandler(),
        ];

        // Handle events
        this.socket = new WesketchServerSocket(io, this.onEvent);
    }

    // TODO: remove / move / refactor
    setDrawingPlayer() {
        const { players } = this.state;

        this.state.players.map(p => {
            p.guessedWord = false;
        });

        // None = First
        const isDrawing = players.find(p => p.isDrawing);
        if (isDrawing === undefined) {
            players[0].isDrawing = true;
            players[0].drawCount += 1;
            return;
        }

        // Last = First
        const last = players[players.length - 1];
        if (last.isDrawing) {
            last.isDrawing = false;
            players[0].isDrawing = true;
            players[0].drawCount += 1;
            return;
        }

        // Next
        let next: IPlayer = null;
        let prev: IPlayer = null;
        players.forEach((p: IPlayer) => {
            if (prev !== null && prev.isDrawing) {
                next = p;
                prev.isDrawing = false;
                next.isDrawing = true;
                next.drawCount += 1;
                return;
            }

            prev = p;
        });

        return;
    }

    onEvent = (event: IWesketchEvent) => {
        if (event.type !== WesketchEventType.Draw) {
            console.log(`### [ WesketchServerSocket.onEvent ]  event.userId: ${event.userId}, type: ${WesketchEventType[event.type]}`);
        }

        this.handlers.forEach((handler: IWesketchEventHandler) => {
            handler.handle(event, this);
        });
    }

    startTimer = (duration: number, next: () => void) => {
        const { timer } = this.state;
        timer.duration = duration;
        timer.remaining = duration;
        this.intervalId = setInterval(() => {
            if (timer.remaining <= 0) {
                console.log('clearInterval, remaining: ' + timer.remaining);
                clearInterval(this.intervalId);
                next();
                return;
            }

            timer.remaining--;
            this.socket.sendServerEvent(WesketchEventType.UpdateGameState, this.state);
        }, this.TIMER_DELAY);
    }

    startRound = () => {
        // Set phase to drawing
        this.state.phase = PhaseTypes.Drawing;

        // Increment round counter
        this.state.round += 1;

        // Clear canvas
        this.socket.sendServerEvent(WesketchEventType.ClearCanvas, {});

        // Reset drawing tools
        this.state.primaryColor = WesketchServer.DEFAULT_STATE.primaryColor;
        this.state.secondaryColor = WesketchServer.DEFAULT_STATE.secondaryColor;
        this.state.brushSize = WesketchServer.DEFAULT_STATE.brushSize;

        // Choose current word
        this.state.currentWord = randomElement(WORDLIST);

        // Update game state
        this.socket.sendServerEvent(WesketchEventType.UpdateGameState, this.state);

        // Start timer
        this.startTimer(this.ROUND_DURATION, this.endRound);
        this.socket.sendServerEvent(WesketchEventType.SystemMessage, { message: `Round ${this.state.round} started!` })
    }

    endRound = () => {
        // End game if all players have drawn DRAWINGS_PER_PLAYER times each
        if (this.state.players.every(p => p.drawCount === this.DRAWINGS_PER_PLAYER)) {
            this.endGame();
            return;
        }

        // Request drawing player to save image        
        const drawingPlayer = this.state.players.find(p => p.isDrawing);
        if (drawingPlayer !== undefined) {
            this.socket.sendServerEvent(WesketchEventType.SaveDrawing, { player: drawingPlayer.name, word: this.state.currentWord });
        }

        // Set phase to endRound
        this.state.phase = PhaseTypes.RoundEnd;

        // Reset hints
        this.state.hintsGiven = 0;

        // Show last word to players
        this.socket.sendServerEvent(
            WesketchEventType.SystemMessage,
            { message: `The word was: ${this.state.currentWord}` });

        // Choose next drawing player
        this.setDrawingPlayer();

        // Update game state
        this.socket.sendServerEvent(WesketchEventType.UpdateGameState, this.state);

        // Stop sounds
        this.socket.sendServerEvent(WesketchEventType.StopSound, {});

        // Start new round in X seconds
        this.startTimer(this.END_ROUND_DURATION, this.startRound);
        this.socket.sendServerEvent(
            WesketchEventType.SystemMessage,
            { message: `Starting new round in ${this.END_ROUND_DURATION} seconds...` })
    }

    endGame = () => {
        // Set end phase
        this.state.phase = PhaseTypes.GameEnd;

        // Update game state
        this.socket.sendServerEvent(WesketchEventType.UpdateGameState, this.state);

        // Show scores
        this.socket.sendServerEvent(WesketchEventType.ShowScores, {});

        // Send drawings to clients
        this.socket.sendServerEvent(WesketchEventType.GetDrawings, this.drawings);
    }

    resetGame = (reason: string) => {

        // Stop timer
        clearInterval(this.intervalId);

        // Reset gamestate but keep players
        const players = {...this.state.players};
        this.state = JSON.parse(JSON.stringify(WesketchServer.DEFAULT_STATE));
        this.state.players = players;

        this.socket.sendServerEvent(WesketchEventType.SystemMessage, { message: `Game has been reset: ${reason}` });
        this.socket.sendServerEvent(WesketchEventType.UpdateGameState, this.state);
        this.socket.sendServerEvent(WesketchEventType.ClearCanvas, {});
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
        if (event.type !== WesketchEventType.PlayerJoined) {
            return;
        }

        const player = {
            clientId: event.clientId,
            userId: event.userId,
            name: event.userName,
            isReady: false,
            score: 0,
            drawCount: 0,
            isDrawing: false,
            guessedWord: false
        };

        console.log(`### [ PlayerJoined ] players.length ${server.state.players.length}`);

        const existingPlayer = server.state.players
            .find((p: IPlayer) => p.userId === player.userId);

        if (existingPlayer === undefined) {
            server.state.players.push(player);
            server.socket.sendServerEvent(WesketchEventType.PlaySound, {
                name: 'playerJoined',
                userId: player.userId,
                global: false
            });
            server.socket.sendServerEvent(WesketchEventType.SystemMessage, { message: `${player.name} joined the game` });
            server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
        }

    }
}

class PlayerLeft implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.PlayerLeft) {
            return;
        }
        console.log(`### [ PlayerLeft ] event: ${event.userId} - ${event.userName}`);

        // If leaving player is drawing
        const leavingPlayer = server.state.players.find(p => p.userId === event.userId);
        console.log(`### [ PlayerLeft ] players.length: ${server.state.players.length}`);
        console.log(`### [ PlayerLeft ] player: ${leavingPlayer.userId} - ${leavingPlayer.name}`);
        // TODO: Reset timer if leaving player was drawing
        // if (leavingPlayer.isDrawing) {
        //     server.state.timer.remaining = 0;
        // }

        // Update players
        server.state.players = server.state.players.filter(p => p.userId !== event.userId)
        console.log(`### [ PlayerLeft ] players.length: ${server.state.players.length}`);

        // Reset game if only 1 player left
        if (server.state.players.length <= 1) {
            server.resetGame('too few players left to continue');
        }

        server.socket.sendServerEvent(WesketchEventType.SystemMessage, { message: `${event.userName} left the game` });
        server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class PlayerReadyHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.PlayerReady) {
            return;
        }

        // Toggle ready is only avaliable in Lobby-phase
        if (server.state.phase !== PhaseTypes.Lobby) {
            return;
        }

        server.state.players.forEach(p => {
            if (p.userId === event.userId) {
                p.isReady = !p.isReady;
            }
        });

        if (server.state.players.every(p => p.isReady) && server.state.players.length > 1) {
            // TODO: refactor... Set drawing player
            server.setDrawingPlayer();
            server.socket.sendServerEvent(WesketchEventType.SystemMessage, { message: `All players are ready, starting game in ${server.START_ROUND_DURATION} seconds!` });
            server.startTimer(server.START_ROUND_DURATION, server.startRound);
        }

        server.socket.sendServerEvent(WesketchEventType.PlaySound, {
            name: 'playerReady',
            userId: event.userId,
            global: false
        });
        server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class MessageHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.Message) {
            return;
        }

        const { state } = server;
        let player = state.players.find(p => p.userId === event.userId);
        if (player === undefined) {
            return;
        }

        // Drawing player is not allowed to guess or talk during draw-phase
        if (player.isDrawing) {
            return;
        }

        // Someone guessed the word
        const guessedWord = event.value.message.toLowerCase() === state.currentWord.toLowerCase();
        if (state.phase === PhaseTypes.Drawing && guessedWord) {

            // Check if player already has guessed it
            if (player.guessedWord) {
                return;
            }

            // Send message to clients
            server.socket.sendServerEvent(WesketchEventType.PlaySound, {
                name: 'playerGuessedTheWord',
                userId: player.userId,
                global: false
            });
            server.socket.sendServerEvent(WesketchEventType.SystemMessage, {
                message: `${event.userName} guessed the word!`
            });

            // Update player score
            const finishedPlayersCount = state.players.reduce((n, player) => {
                return (player.guessedWord && !player.isDrawing)
                    ? n + 1
                    : n;
            }, 0);
            const firstGuess = finishedPlayersCount === 0;
            const score = server.GUESS_SCORE - finishedPlayersCount;
            player.score += score;
            player.guessedWord = true;

            // Update drawing player score
            let drawingPlayer = state.players.find(p => p.isDrawing);
            let drawScore = firstGuess
                ? 10 - (3 * state.hintsGiven)
                : 1;
            drawingPlayer.score += drawScore;

            // Check if all non-drawing players guessed the word
            const playersRemaining = state.players.reduce((n, player) => {
                return (!player.guessedWord && !player.isDrawing)
                    ? n + 1
                    : n;
            }, 0);
            if (playersRemaining === 0) {
                state.timer.remaining = 0;
                server.socket.sendServerEvent(WesketchEventType.SystemMessage, {
                    message: `All players guessed the word!`
                });
            }

            // Reduce timer after first guess
            if (firstGuess && state.timer.remaining > server.FIRST_GUESS_TIME_REMAINING) {
                server.socket.sendServerEvent(WesketchEventType.PlaySound, {
                    name: 'timerTension',
                    userId: player.userId,
                    global: true
                });
                state.timer.remaining = server.FIRST_GUESS_TIME_REMAINING;
            }

            server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
            return;
        }

        // Someone is close
        const isClose = guessIsClose(event.value.message, state.currentWord);
        if (state.phase === PhaseTypes.Drawing && isClose) {
            server.socket.sendServerEvent(WesketchEventType.PlaySound, {
                name: 'playerIsClose',
                userId: event.userId,
                global: false
            });
            server.socket.sendServerEvent(WesketchEventType.SystemMessage, {
                message: `${event.userName} is close...`
            });
            return;
        }

        // Bounce event if not correct or close
        server.socket.sendEvent(event);
    }
}

class DrawHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.Draw) {
            return;
        }

        server.socket.sendEvent(event);
    }
}

class GiveUpHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.GiveUp) {
            return;
        }

        server.state.timer.remaining = 0;

        server.socket.sendServerEvent(WesketchEventType.SystemMessage, {
            message: `${event.userName} gave up trying to draw the stupid word`
        });
    }
}

class GiveHintHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.GiveHint) {
            return;
        }

        if (server.state.hintsGiven >= server.MAX_HINTS_ALLOWED) {
            return;
        }

        server.state.hintsGiven++;
        let message = server.state.hintsGiven > 1
            ? `${event.userName} presents yet another hint!`
            : `${event.userName} presents a hint!`;
        server.socket.sendServerEvent(WesketchEventType.SystemMessage, { message });
        server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class ClearCanvasHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.ClearCanvas) {
            return;
        }

        server.socket.sendEvent(event);
    }
}

// TODO: group these events into ChangeDrawSettings ?
class ChangeColorHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.ChangeColor) {
            return;
        }

        server.state.primaryColor = event.value;
        server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
    }
}

class ChangeBrushSizeHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.ChangeBrushSize) {
            return;
        }

        let newBrushSize = server.state.brushSize + +event.value;

        if (newBrushSize > 0 && newBrushSize <= 24) {
            server.state.brushSize = newBrushSize;
            server.socket.sendServerEvent(WesketchEventType.UpdateGameState, server.state);
        }
    }
}

class ResetGameHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.ResetGame) {
            return;
        }

        server.resetGame('a reset button was clicked!');
    }
}

class SaveDrawingHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventType.SaveDrawing) {
            return;
        }

        const data = event.value.data as string;
        const drawing: IDrawing = {
            player: event.value.player,
            word: event.value.word,
            data
        };
        server.drawings.push(drawing);
        // const imageDataCompressed = zlib.deflateSync(imageData);
        // console.log('imageDataCompressed.length: ', imageDataCompressed.length);
        // var base64Data = imageData.replace(/^data:image\/png;base64,/, "");
        // fs.writeFile("out.png", base64Data, 'base64', (err: NodeJS.ErrnoException) => {
        //     console.log(err);
        // });
    }
}

class UpdateGameStateHandler implements IWesketchEventHandler {
    handle(event: IWesketchEvent, server: WesketchServer): void {
        if (event.type !== WesketchEventType.UpdateGameState) {
            return;
        }

        server.state = event.value;
        server.socket.sendEvent(event);
    }
}