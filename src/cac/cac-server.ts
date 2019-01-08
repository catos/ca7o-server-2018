/**
 * https://github.com/Arcanorum/basic-networked-multiplayer-game/blob/master/Server.js
 * 
 */

import { CacPlayer } from "./CacModels";
import { ICacEvent } from "./ICacEvent";

export interface ICacGameState {
    gameOver: boolean;
    ticks: number;
    players: CacPlayer[];
}

export class CacServer {
    lastSync: number = Date.now();
    syncRate: number = 1000;
    gameState: ICacGameState = {
        gameOver: false,
        ticks: 0,
        players: []
    };

    intervalId: any = {};
    io: SocketIO.Namespace = undefined;
    handlers: IEventHandler[] = [];
    commands: ICacCommand[] = [];

    constructor() {
        console.log('### new CacServer');
    }

    init = (io: SocketIO.Server) => {
        console.log('### init io');
        this.io = io.of('/cac');
        this.io.on('connection', this.onConnection);

        console.log('### Init EventHandlers');
        this.handlers.push(new JoinGameHandler());
        this.handlers.push(new ClickHandler());
        this.handlers.push(new StopGameHandler());
        this.handlers.push(new StartGameHandler());

        console.log('### Init Commands');
        this.commands.push(new SyncGameStateCommand());
        this.commands.push(new UpdateTicksCommand());
        this.commands.push(new GameOverCommand());
    }

    onConnection = (client: SocketIO.Socket) => {
        console.log('### CacClient Connected')

        // Event
        client.on('event', (event: any) => {
            this.handlers.forEach(handler => handler.onEvent(event, this));
        })

        // Disconnect
        client.on('disconnect', () => {
            console.log('### CacClient Disconnected', client.id)
            this.gameState.players = this.gameState.players.filter(p => p.socketId !== client.id);
        })
    }

    start = () => {
        console.log('### Start');
        this.intervalId = setInterval(() => {
            this.update();
        }, 100);
    }

    stop = () => {
        console.log('### Stop');
        clearInterval(this.intervalId);
    }

    update = () => {
        this.commands.forEach(command => command.execute(this));
    }

    sync = () => {
        const syncEvent: ICacEvent = {
            socketId: 'na',
            name: 'server',
            timestamp: Date.now(),
            type: 'UpdateGameState',
            value: this.gameState
        };
        this.io.emit('event', syncEvent);
    }
}

// Commands ----------------------------------------------------------------------

interface ICacCommand {
    execute: (server: CacServer) => void;
}

class SyncGameStateCommand implements ICacCommand {
    execute = (server: CacServer) => {
        const { gameState } = server;
        let sendUpdate: boolean = false;

        // No players ?
        if (gameState.players.length <= 0) {
            return;
        }

        // Send update each syncRate
        const now = Date.now();
        const elapsed = now - server.lastSync;
        if (elapsed > server.syncRate) {
            console.log('Send update each syncRate');
            server.lastSync = now;
            sendUpdate = true;
        }

        if (sendUpdate) {
            server.sync();
        }
    }
}

class UpdateTicksCommand implements ICacCommand {
    execute = (server: CacServer) => {
        server.gameState.ticks += 1;
    }
}

class GameOverCommand implements ICacCommand {
    execute = (server: CacServer) => {
        const { gameState } = server;

        if (gameState.players.find(p => p.coins >= 100) && !gameState.gameOver) {
            gameState.gameOver = true;

            // clearInterval(state.intervalId);
            console.log('### Game Over!');
        }
    }
}

// EventHandlers ----------------------------------------------------------------------

interface IEventHandler {
    onEvent: (event: ICacEvent, server: CacServer) => void;
}

class JoinGameHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        if (event.type !== 'join-game') {
            return;
        }

        const existingPlayer = server.gameState.players.find(p => p.socketId === event.socketId);
        if (existingPlayer === undefined) {
            let player = new CacPlayer(event.socketId, event.name);
            // player.socketId = event.socketId;
            // player.name = event.name;
            server.gameState.players.push(player);
            server.sync();
        }
    }
}

class ClickHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        const { gameState } = server;
        if (event.type !== 'click') {
            return;
        }

        const player = gameState.players.find(p => p.socketId === event.socketId);
        if (player !== undefined) {
            player.coins++;
            server.sync();
        }
    };
}

class StartGameHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        if (event.type !== 'start-game') {
            return;
        }
        server.start();
    };
}

class StopGameHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        if (event.type !== 'stop-game') {
            return;
        }
        server.stop();
    };
}

