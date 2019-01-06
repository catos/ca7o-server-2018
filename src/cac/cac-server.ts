/**
 * https://github.com/Arcanorum/basic-networked-multiplayer-game/blob/master/Server.js
 * 
 */

import { IPlayer } from "./IPlayer";
import { ICacEvent } from "./ICacEvent";

export interface ISocket extends SocketIO.Socket {
    name: string;
    isInGame: boolean;
}

export interface ICacGameState {
    gameOver: boolean;
    ticks: number;
    players: IPlayer[];
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
    components: ICacComponent[] = [];

    constructor() {
        console.log('### new CacServer');
    }

    init = (io: SocketIO.Server) => {
        console.log('### init io');
        this.io = io.of('/cac');
        this.io.on('connection', this.onConnection);

        console.log('### initEventHandlers');
        this.handlers.push(new JoinGameHandler());
        this.handlers.push(new ClickHandler());
        this.handlers.push(new StopHandler());
        this.handlers.push(new StartHandler());

        console.log('### initComponents');
        this.components.push(new SyncComponent());
        this.components.push(new UpdateTicksComponent());
        this.components.push(new GameOverComponent());
    }

    onConnection = (client: ISocket) => {
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
        this.components.forEach(component => component.update(this));
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

// ----------------------------------------------------------------------

interface ICacComponent {
    update: (server: CacServer) => void;
}

class SyncComponent implements ICacComponent {
    update = (server: CacServer) => {
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

class UpdateTicksComponent implements ICacComponent {
    update = (server: CacServer) => {
        server.gameState.ticks += 1;
    }
}

class GameOverComponent implements ICacComponent {
    update = (server: CacServer) => {
        const { gameState } = server;

        if (gameState.players.find(p => p.clicks >= 10) && !gameState.gameOver) {
            gameState.gameOver = true;

            // clearInterval(state.intervalId);
            console.log('### Game Over!');
        }
    }
}

// ----------------------------------------------------------------------

interface IEventHandler {
    onEvent: (event: ICacEvent, server: CacServer) => void;
}

class JoinGameHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        const { gameState } = server;
        if (event.type !== 'join-game') {
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
            player.clicks++;
            server.sync();
        }
    };
}

class StartHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        if (event.type !== 'start-game') {
            return;
        }
        server.start();
    };
}

class StopHandler implements IEventHandler {
    onEvent = (event: ICacEvent, server: CacServer) => {
        if (event.type !== 'stop-game') {
            return;
        }
        server.stop();
    };
}

