import { Player, IGameState, IEvent, INode, IEventHandler } from "./Models";
import { CacSocket } from "./CacSocket";

/**
 * Main game class
 */
export class CacGame {
    nodes: INode[] = [];
    intervalId: any = {};
    cs: CacSocket;
    state: IGameState = {
        gameOver: false,
        ticks: 0,
        players: []
    };

    constructor(io: SocketIO.Server) {
        console.log('### Create CacSocket');
        this.cs = new CacSocket(io, this.onConnect, this.onEvent, this.onDisconnect);

        console.log('### Create Nodes');
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
    }

    private onEvent = (event: IEvent) => {
        console.log('### Client Event');
        this.nodes.forEach(n => {
            n.eventHandlers
                .filter(p => p.eventType == event.type)
                .map(h => h.handle(event));
        });
    }

    private onDisconnect = (event: IEvent) => {
        // TODO: event.socketId er undefined
        console.log(`### Client Disconnected, socketId: ${event.socketId}`, event);
        this.state.players = this.state.players.filter(p => p.socketId !== event.socketId);
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
    
    update = () => {
        // console.log('Node->update');
        // this.children.forEach(n => n.update())
    };
}

/**
 * Player Node - handle client input related to player
 */
class PlayerNode extends Node {
    constructor(game: CacGame) {
        super(game, "Player");
        this.eventHandlers.push({ eventType: 'join-game', handle: this.joinGame });
        this.eventHandlers.push({ eventType: 'click', handle: this.click });
    }

    private joinGame = (event: IEvent) => {
        const existingPlayer = this.game.state.players.find(p => p.socketId === event.socketId);
        if (existingPlayer === undefined) {
            let player = new Player(event.socketId, event.name);
            this.game.state.players.push(player);
            this.game.sync();
        }
    }

    private click = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);
        if (player !== undefined) {
            player.coins++;
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
        this.game.intervalId = setInterval(() => {
            this.game.update();
        }, 100);
    }

    private stopGame = (event?: any) => {
        console.log('### Stop game');
        clearInterval(this.game.intervalId);
    }
}