/**
 * https://github.com/Arcanorum/basic-networked-multiplayer-game/blob/master/Server.js
 * 
 * 
 * 
 *  Game
        ManyGameVariablesAndConstants
        sync()
        update()

        SocketIOServer
            onEvent() // Events fra clients med socket.io    

        PlayerObject
            update()
        ShopObject
            update()
        CraftingObject
            update()

 * 
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

    // GameState - will be synces to all clients each update / tick
    gameState: ICacGameState = {
        gameOver: false,
        ticks: 0,
        players: []
    };

    intervalId: any = {};
    io: SocketIO.Namespace = undefined;

    eventHandlers: IEventHandler[] = [];
    nodes: INode[] = [];

    constructor() {
        console.log('### new CacServer');
    }

    init = (io: SocketIO.Server) => {

        console.log('### Create Nodes');
        this.nodes.push(new RootNode(this));

        console.log('### init io');
        this.io = io.of('/cac');
        this.io.on('connection', (client: SocketIO.Socket) => {
            console.log('### CacClient Connected')

            // Event
            client.on('event', this.onEvent);

            // Disconnect
            client.on('disconnect', () => {
                console.log('### CacClient Disconnected', client.id)
                this.gameState.players = this.gameState.players.filter(p => p.socketId !== client.id);
            })
        });
    }

    onEvent = (event: any) => {
        this.eventHandlers
            .filter(p => p.eventType === event.type)
            .map(h => h.onEvent(event));
    }

    registerEventHandler(eventHandler: IEventHandler): any {
        this.eventHandlers.push(eventHandler)
    }

    update = () => {
        // Sync GameState
        let sendUpdate: boolean = false;

        // No players ?
        if (this.gameState.players.length <= 0) {
            return;
        }

        // Send update each syncRate
        // TODO: move lastSync and syncRate to this class ?
        const now = Date.now();
        const elapsed = now - this.lastSync;
        if (elapsed > this.syncRate) {
            console.log('Send update each syncRate');
            this.lastSync = now;
            sendUpdate = true;
        }

        if (sendUpdate) {
            this.sync();
        }

        this.nodes.forEach(n => n.update());
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

/**
 * EventHandler... interface
 */
interface IEventHandler {
    eventType: string;
    onEvent: (event: any) => void;
}

/**
 * Node interface
 */
interface INode {
    name: string;
    server: CacServer;
    children: INode[];

    update: () => void;
}

/**
 * Base Node
 */
class Node implements INode {
    name: string;
    server: CacServer;
    children: INode[] = [];

    constructor(server: CacServer, name: string) {
        console.log(`## Node '${name}' created`);
        this.server = server;
    }

    update = () => {
        console.log('Node->update');
        this.children.forEach(n => n.update())
    };
}

/**
 * TODO: split up RootNode ?
 * 
 * SyncGameStateCommand
 * UpdateTicksCommand
 * GameOverCommand
 * 
 */
class RootNode extends Node {
    constructor(server: CacServer) {
        super(server, "game");
        
        this.children.push(new PlayerNode(server));

        this.server.registerEventHandler({ eventType: 'start-game', onEvent: this.startGame });
        this.server.registerEventHandler({ eventType: 'stop-game', onEvent: this.stopGame });
        
        // this.server.registerStateSpawner({ condition: this.server.gameState.players.find(p => p.coins >= 10) && !this.server.gameState.gameOver, stateType = "game-over" });
        // this.server.registerStateHandler({ stateType: 'game-over', onState: this.gameOver });
    }

    update = () => {
        Node.prototype.update();
        console.log('RootNode.update');

        // Update ticks
        this.server.gameState.ticks += 1;

        // Check if game over
        if (this.server.gameState.players.find(p => p.coins >= 10) && !this.server.gameState.gameOver) {
            this.stopGame();
            console.log('### Game Over!');
        }
    }

    private startGame = (event: any) => {
        console.log('### Start game');
        this.server.intervalId = setInterval(() => {
            this.server.update();
        }, 100);
    }

    private stopGame = (event?: any) => {
        console.log('### Stop');
        clearInterval(this.server.intervalId);
    }

    // private gameOver = (event: any) => {
    //     this.server.gameState.gameOver = true;
    //     this.stopGame();
    // }
}

/**
 * PlayerNode
 */
class PlayerNode extends Node {

    constructor(server: CacServer) {
        super(server, "player");

        this.server.registerEventHandler({ eventType: 'join-game', onEvent: this.joinGame });
        this.server.registerEventHandler({ eventType: 'click', onEvent: this.click });
    }

    update = () => {
        console.log('PlayerNode.update');
    }

    private joinGame = (event: any) => {
        const existingPlayer = this.server.gameState.players.find(p => p.socketId === event.socketId);
        if (existingPlayer === undefined) {
            let player = new CacPlayer(event.socketId, event.name);
            // player.socketId = event.socketId;
            // player.name = event.name;
            this.server.gameState.players.push(player);
            this.server.sync();
        }
    }

    private click = (event: any) => {
        const player = this.server.gameState.players.find(p => p.socketId === event.socketId);
        if (player !== undefined) {
            player.coins++;
            this.server.sync();
        }
    }
}

