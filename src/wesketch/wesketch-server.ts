import { WORDLIST } from "./wordlist-new";
import { WesketchServerSocket } from "./wesketch-server-socket";
import { randomElement } from "../shared/utils";

import { PhaseTypes, WesketchEventTypes } from "./Types";
import {
    IWesketchGameSettings, IWesketchGameState, IWesketchDrawing,
    IWesketchEventHandler, IWesketchPlayer, IWesketchEvent
} from "./Interfaces";

import {
    PlayerJoinedHandler, PlayerReadyHandler, MessageHandler,
    DrawHandler, GiveUpHandler, GiveHintHandler, ClearCanvasHandler,
    ChangeColorHandler, ChangeBrushSizeHandler, ResetGameHandler,
    SaveDrawingHandler, UpdateGameSettingsHandler, UpdateGameStateHandler,
    PlayerLeftHandler
} from "./ClientHandlers";
import { Word } from "./word.model";

/**
 * WesketchServer
 */
export class WesketchServer {

    public readonly MAX_HINTS_ALLOWED: number = 3;
    public readonly GUESS_SCORE: number = 10;
    public readonly FIRST_GUESS_TIME_REMAINING: number = 30;
    public readonly START_ROUND_DURATION: number = 3;
    public readonly ROUND_DURATION: number = 90;
    public readonly END_ROUND_DURATION: number = 10;
    public readonly DRAWINGS_PER_PLAYER: number = 3;
    public readonly TIMER_DELAY: number = 1000;

    public socket: WesketchServerSocket;
    public settings: IWesketchGameSettings;
    public state: IWesketchGameState;
    public drawings: IWesketchDrawing[] = [];

    private handlers: IWesketchEventHandler[];
    private intervalId: any;
    private static DEFAULT_STATE: IWesketchGameState = {
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

    constructor(io: SocketIO.Server) {

        // Default values
        this.settings = {
            language: 1,
            difficulties: [2],
            wordCount: 0
        };
        this.state = JSON.parse(JSON.stringify(WesketchServer.DEFAULT_STATE));
        this.intervalId = 0;

        // Initialize handlers
        this.handlers = [
            new PlayerJoinedHandler(),
            new PlayerLeftHandler(),
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
            new UpdateGameSettingsHandler(),
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
        let next: IWesketchPlayer = null;
        let prev: IWesketchPlayer = null;
        players.forEach((p: IWesketchPlayer) => {
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
        if (event.type !== WesketchEventTypes.Draw) {
            console.log(`### [ WesketchServerSocket.onEvent ]  event.userId: ${event.userId}, type: ${WesketchEventTypes[event.type]}`);
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
            this.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, this.state);
        }, this.TIMER_DELAY);
    }

    startRound = async() => {
        // Set phase to drawing
        this.state.phase = PhaseTypes.Drawing;

        // Increment round counter
        this.state.round += 1;

        // Clear canvas
        this.socket.sendServerEvent(WesketchEventTypes.ClearCanvas, {});

        // Reset drawing tools
        this.state.primaryColor = WesketchServer.DEFAULT_STATE.primaryColor;
        this.state.secondaryColor = WesketchServer.DEFAULT_STATE.secondaryColor;
        this.state.brushSize = WesketchServer.DEFAULT_STATE.brushSize;

        // Choose current word
        const random = Math.floor(Math.random() * this.settings.wordCount);
        const word = await Word
            .findOne({
                difficulty: { $in: this.settings.difficulties },
                language: { $in: this.settings.language }
            })
            .skip(random)
            .exec();
        this.state.currentWord = word.word;

        // Update game state
        this.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, this.state);

        // Start timer
        this.startTimer(this.ROUND_DURATION, this.endRound);
        this.socket.sendServerEvent(WesketchEventTypes.SystemMessage, { message: `Round ${this.state.round} started!` })
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
            this.socket.sendServerEvent(WesketchEventTypes.SaveDrawing, { player: drawingPlayer.name, word: this.state.currentWord });
        }

        // Set phase to endRound
        this.state.phase = PhaseTypes.RoundEnd;

        // Reset hints
        this.state.hintsGiven = 0;

        // Show last word to players
        this.socket.sendServerEvent(
            WesketchEventTypes.SystemMessage,
            { message: `The word was: ${this.state.currentWord}` });

        // Choose next drawing player
        this.setDrawingPlayer();

        // Update game state
        this.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, this.state);

        // Stop sounds
        this.socket.sendServerEvent(WesketchEventTypes.StopSound, {});

        // Start new round in X seconds
        this.startTimer(this.END_ROUND_DURATION, this.startRound);
        this.socket.sendServerEvent(
            WesketchEventTypes.SystemMessage,
            { message: `Starting new round in ${this.END_ROUND_DURATION} seconds...` })
    }

    endGame = () => {
        // Set end phase
        this.state.phase = PhaseTypes.GameEnd;

        // Update game state
        this.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, this.state);

        // Show scores
        this.socket.sendServerEvent(WesketchEventTypes.ShowScores, {});

        // Send drawings to clients
        this.socket.sendServerEvent(WesketchEventTypes.GetDrawings, this.drawings);
    }

    resetGame = (reason: string) => {

        // Stop timer
        clearInterval(this.intervalId);

        // Reset gamestate & players
        let players = [...this.state.players];
        players = players.map(p => {
            p.drawCount = 0;
            p.guessedWord = false;
            p.isDrawing = false;
            p.isReady = false;
            p.score = 0;
            return p;
        })
        this.state = JSON.parse(JSON.stringify(WesketchServer.DEFAULT_STATE));
        this.state.players = players;

        this.socket.sendServerEvent(WesketchEventTypes.SystemMessage, { message: `Game has been reset: ${reason}` });
        this.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, this.state);
        this.socket.sendServerEvent(WesketchEventTypes.ClearCanvas, {});
    }
}