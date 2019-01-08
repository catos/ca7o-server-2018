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

export class City {
    level: number;
    workTimer: number;
    isWorking: boolean;

    constructor() {
        this.level = 1;
        this.workTimer = 5000;
        this.isWorking = false;
    }
}

export class Army {
    level: number;
    strength: number;
    soldiers: number;

    constructor() {
        this.level = 1;
        this.strength = 100;
        this.soldiers = 10;
    }
}

export class Citizens {
    level: number;
    efficiency: number;
    workers: number;

    constructor() {
        this.level = 1;
        this.efficiency = 100;
        this.workers = 10;
    }
}

export class CacPlayer {
    socketId: string;
    name: string;
    coins: number;
    cps: number;
    isDead: boolean;
    isComputer: boolean;

    city: City;
    army: Army;
    citizens: Citizens;

    constructor(socketId: string, name: string) {
        this.socketId = socketId;
        this.name = name;

        this.coins = 0;
        this.cps = 1;
        this.isDead = false;
        this.isComputer = false;

        this.city = new City();
        this.army = new Army();
        this.citizens = new Citizens();
    }
}

export interface ICacEvent {
    socketId: string;
    name: string;
    timestamp: number;
    type: string;
    value: any;
}

export interface ICacGameState {
    gameOver: boolean;
    ticks: number;
    players: CacPlayer[];
}

export class CacServerOld {
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
        console.log('### new CacServerOld');
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
    server: CacServerOld;
    children: INode[];

    update: () => void;
}

/**
 * Base Node
 */
class Node implements INode {
    name: string;
    server: CacServerOld;
    children: INode[] = [];

    constructor(server: CacServerOld, name: string) {
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
    constructor(server: CacServerOld) {
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

    constructor(server: CacServerOld) {
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

