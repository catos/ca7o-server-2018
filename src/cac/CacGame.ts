import { Player, IGameState, IEvent, INode, IEventHandler } from "./Models";
import { CacSocket } from "./CacSocket";

/**
 * Main game class
 */
export class CacGame {
    nodes: INode[] = [];
    interval: number = 100;
    intervalId: any = {};
    cs: CacSocket;
    state: IGameState = {
        ticks: 0,
        timer: 0,
        phase: 'lobby',
        gameOver: false,
        players: []
    };

    constructor(io: SocketIO.Server) {
        console.log('### Create CacSocket');
        this.cs = new CacSocket(io, this.onConnect, this.onEvent, this.onDisconnect);

        console.log('### Create Nodes');
        this.nodes.push(new TimerNode(this));
        this.nodes.push(new GameStateSyncNode(this));
        this.nodes.push(new StartStopGameNode(this));
        this.nodes.push(new PlayerNode(this));
    }

    update = () => {
        this.nodes.forEach(n => n.update());
    }

    sync = () => {
        const syncEvent: IEvent = {
            socketId: 'na',
            name: 'server',
            timestamp: Date.now(),
            type: 'UpdateGameState',
            value: this.state
        };
        this.cs.emit(syncEvent);
    }

    private onConnect = (client: SocketIO.Socket) => {
        console.log('### Client Connected')
        this.sync();
    }

    private onEvent = (event: IEvent) => {
        console.log('### Client Event');
        this.nodes.forEach(n => {
            n.eventHandlers
                .filter(p => p.eventType == event.type)
                .map(h => h.handle(event));
        });
    }

    private onDisconnect = (socket: SocketIO.Socket) => {
        console.log(`### Client Disconnected, socketId: ${socket.id}`);
        this.state.players = this.state.players.filter(p => p.socketId !== socket.id);
        this.sync();
    }
}

/**
 * Base Node
 */
class Node implements INode {
    name: string;
    game: CacGame;
    eventHandlers: IEventHandler[] = [];

    constructor(game: CacGame, name: string) {
        console.log(`## Node '${name}' created`);
        this.game = game;
    }

    update = () => { }
}

/**
 * Player Node - handle client input related to player 
 */
class PlayerNode extends Node {
    constructor(game: CacGame) {
        super(game, "Player");
        this.eventHandlers.push({ eventType: 'join-game', handle: this.joinGame });
        this.eventHandlers.push({ eventType: 'work', handle: this.work });
    }

    update = () => {

        this.game.state.players.forEach(p => {
            // Update craft timers
            if (p.city.isWorking && p.city.workTimer > 0) {
                p.city.workTimer -= this.game.interval;
            }

            if (p.city.isWorking && p.city.workTimer <= 0) {
                p.city.isWorking = false;
                p.city.workTimer = 5000;

                p.coins += Math.floor(p.citizens.workers / 2);
                console.log(`${p.name} finished working!`);
            }
        });
    }

    private joinGame = (event: IEvent) => {
        const existingPlayer = this.game.state.players.find(p => p.socketId === event.socketId);
        if (existingPlayer === undefined) {
            let player = new Player(event.socketId, event.name);
            this.game.state.players.push(player);

            this.game.sync();
        }
    }

    private work = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);
        if (player !== undefined) {
            player.city.isWorking = true;

            this.game.sync();
        }
    }
}

/**
 * GameStateSync Node - sends gamestate to clients every x seconds
 */
class GameStateSyncNode extends Node {
    lastSync: number = Date.now();
    syncRate: number = 1000;

    constructor(game: CacGame) {
        super(game, "GameStateSync");
    }

    update = () => {
        // Sync GameState
        let sendUpdate: boolean = false;

        // No players ?
        if (this.game.state.players.length <= 0) {
            return;
        }

        // Send update each syncRate
        const now = Date.now();
        const elapsed = now - this.lastSync;
        if (elapsed > this.syncRate) {
            console.log('Send update each syncRate');
            this.lastSync = now;
            sendUpdate = true;
        }

        if (sendUpdate) {
            this.game.sync();
        }
    }
}

class TimerNode extends Node {
    private timerAcc: number = 0;
    private timerIntervall: number = 10;

    constructor(game: CacGame) {
        super(game, 'Tick');
    }

    update = () => {
        this.game.state.timer++;

        this.timerAcc++;
        if (this.timerAcc > this.timerIntervall) {
            this.game.state.ticks++;
            this.timerAcc = 0;
        }
    }
}

/**
 * StartStopGameNode - listens to start and stop events
 */
class StartStopGameNode extends Node {
    constructor(game: CacGame) {
        super(game, 'StartStopGame');
        this.eventHandlers.push({ eventType: 'start-game', handle: this.startGame });
        this.eventHandlers.push({ eventType: 'stop-game', handle: this.stopGame });
    }

    private startGame = (event: any) => {
        console.log('### Start game');
        this.game.state.phase = 'running';
        this.game.intervalId = setInterval(() => {
            this.game.update();
        }, this.game.interval);
    }

    private stopGame = (event?: any) => {
        console.log('### Stop game');
        this.game.state.phase = 'lobby';
        this.game.sync();
        clearInterval(this.game.intervalId);
    }
}