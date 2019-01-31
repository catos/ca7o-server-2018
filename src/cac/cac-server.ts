import { IGameState } from "./i-game-state";
import { ISocketEvent } from "./socket/i-socket-event";
import { ISocketEventHandler } from "./socket/i-socket-event-handler";
import { SocketServerService } from "./socket/socket-server-service";
import { newPlayer, IPlayer } from "./i-player";
import { INode } from "./i-node";

/**
 * Main game class
 */
export class CacServer {
    nodes: INode[] = [];
    interval: number = 250;
    intervalId: any = {};
    socketService: SocketServerService;
    state: IGameState = {
        ticks: 0,
        timer: 0,
        phase: 'lobby',
        gameOver: false,
        players: []
    };

    constructor(io: SocketIO.Server) {
        console.log('### Create CacSocket');
        this.socketService = new SocketServerService(io, 'cac', this.onConnect, this.onDisconnect, this.onEvent);

        console.log('### Create Nodes');
        this.nodes.push(new DevNode(this));
        this.nodes.push(new TimerNode(this));
        this.nodes.push(new GameStateSyncNode(this));
        this.nodes.push(new StartStopGameNode(this));
        this.nodes.push(new PlayerNode(this));
        this.nodes.push(new CityNode(this));
        this.nodes.push(new ArmyNode(this));
    }

    update = () => {
        this.nodes.forEach(n => n.update());
    }

    tick = () => {
        this.nodes.forEach(n => n.tick());
    }

    sync = () => {
        this.socketService.emit(this.state, 'update-game-state');
    }

    sendMessage = (message: string) => {
        this.socketService.emit(message, 'message');
    }

    private onConnect = (client: SocketIO.Socket) => {
        console.log(`### Client Connected, id: ${client.id}`)
        let player = newPlayer;
        player.socketId = client.id;
        player.name = `Player ${this.state.players.length + 1}`
        this.state.players.push(player);
        this.sync();
    }

    private onDisconnect = (client: SocketIO.Socket) => {
        console.log(`### Client Disconnected, socketId: ${client.id}`);
        this.state.players = this.state.players.filter(p => p.socketId !== client.id);
        this.sync();
    }

    private onEvent = (event: ISocketEvent) => {
        console.log(`### Client Event, type: ${event.type}`);

        // All events must have a player
        const player = this.state.players.find(p => p.socketId === event.socketId);
        if (player === undefined) {
            this.sendMessage(`No player found with socketId: ${event.socketId}`);
            return;
        }

        // Handle event
        this.nodes.forEach(n => {
            n.eventHandlers
                .filter(p => p.eventType == event.type)
                .map(h => h.handle(event, player));
        });
    }
}

/**
 * Base Node
 */
class Node implements INode {
    name: string;
    game: CacServer;
    eventHandlers: ISocketEventHandler[] = [];

    constructor(game: CacServer, name: string) {
        console.log(`## Node '${name}' created`);
        this.game = game;
    }

    update = () => { }
    tick = () => { }
}

/**
 * Player Node - handle client input related to player 
 */
class PlayerNode extends Node {
    constructor(game: CacServer) {
        super(game, "Player");
        this.eventHandlers.push({ eventType: 'join-game', handle: this.joinGame });
    }

    private joinGame = (event: ISocketEvent, player: IPlayer) => {
        player.name = event.value;
        this.game.sendMessage(`${player.name} joined the game`);
        this.game.sync();
    }
}

/**
 * CityNode
 */
class CityNode extends Node {
    constructor(game: CacServer) {
        super(game, 'City');
        this.eventHandlers.push({ eventType: 'city-work', handle: this.work });
        this.eventHandlers.push({ eventType: 'city-hire-worker', handle: this.hireWorker });
        this.eventHandlers.push({ eventType: 'city-upgrade', handle: this.upgrade });
    }

    update = () => {
        this.game.state.players.forEach(p => {

            // Work
            if (p.city.work.inProgress && p.city.work.timeRemaining > 0) {
                p.city.work.timeRemaining -= this.game.interval;
            }

            if (p.city.work.inProgress && p.city.work.timeRemaining <= 0) {
                p.city.work.inProgress = false;
                p.city.work.timeRemaining = p.city.work.timeToUpgrade;

                const newCoins = Math.floor(p.city.workers.value * (p.city.bonuses.work / 100 + 1));
                p.coins += newCoins;
                this.game.sendMessage(`${p.name} finished working and gained ${newCoins} coins`);
            }

            // Hire worker
            if (p.city.workers.inProgress && p.city.workers.timeRemaining > 0) {
                p.city.workers.timeRemaining -= this.game.interval;
            }

            if (p.city.workers.inProgress && p.city.workers.timeRemaining <= 0) {
                p.city.workers.inProgress = false;
                p.city.workers.timeRemaining = p.city.workers.timeToUpgrade;

                p.city.workers.value++;

                // Update work "cost" (aka. reward)
                p.city.work.cost = Math.floor(p.city.workers.value * (p.city.bonuses.work / 100 + 1));

                this.game.sendMessage(`${p.name} just hired another worker`);
            }

            // Leveling
            if (p.city.level.inProgress && p.city.level.timeRemaining > 0) {
                p.city.level.timeRemaining -= this.game.interval;
            }

            // Leveling finished
            if (p.city.level.inProgress && p.city.level.timeRemaining <= 0) {
                p.city.level.inProgress = false;
                p.city.level.timeRemaining = p.city.level.timeToUpgrade;

                // Increment city level
                p.city.level.value++;
                p.city.level.cost += p.city.level.cost * p.city.level.value;

                // Update bonuses
                p.city.bonuses.work = (p.city.level.value - 1) * 10;
                p.city.bonuses.buildCost = (p.city.level.value - 1) * 10;
                p.city.bonuses.buildTime = (p.city.level.value - 1) * 10;
                p.city.bonuses.defence = p.city.level.value * 10;

                // Update cpt
                p.cpt = p.city.level.value;
                
                // Update work "cost" (aka. reward)
                p.city.work.cost = Math.floor(p.city.workers.value * (p.city.bonuses.work / 100 + 1));

                this.game.sendMessage(`${p.name} upgraded his city to level ${p.city.level.value}`);
            }
        });
    }

    tick = () => {
        this.game.state.players.forEach(p => {
            // cps
            p.coins += p.cpt;
        });
    }

    private work = (event: ISocketEvent, player: IPlayer) => {
        // Already upgrading
        if (player.city.work.inProgress === true) {
            this.game.sendMessage(`${player.name} is already working`);
            return;
        }

        player.city.work.inProgress = true;
        this.game.sync();
    }

    private hireWorker = (event: ISocketEvent, player: IPlayer) => {
        if (player.city.workers.inProgress === true) {
            this.game.sendMessage(`${player.name} is already hiring workers`);
            return;
        }

        if (player.coins < player.city.workers.cost) {
            this.game.sendMessage(`${player.name} cannot afford to hire any more workers`);
            return;
        }

        player.coins -= player.city.workers.cost;
        player.city.workers.inProgress = true;
        this.game.sendMessage(`${player.name} started hiring workers`);
        this.game.sync();
    }

    private upgrade = (event: ISocketEvent, player: IPlayer) => {
        // Already upgrading
        if (player.city.level.inProgress === true) {
            this.game.sendMessage(`${player.name} is already upgrading his city`);
            return;
        }

        // Check if player can afford to upgrade
        if (player.coins < player.city.level.cost) {
            this.game.sendMessage(`${player.name} cannot afford to upgrade his city`);
            return;
        }

        player.coins -= player.city.level.cost;
        player.city.level.inProgress = true;
        this.game.sendMessage(`${player.name} started upgrading his city`);
        this.game.sync();
    }
}

class ArmyNode extends Node {
    constructor(game: CacServer) {
        super(game, 'Army');
        this.eventHandlers.push({ eventType: 'army-recruit', handle: this.recruit });
        this.eventHandlers.push({ eventType: 'army-upgrade', handle: this.upgrade });
    }

    update = () => {
        this.game.state.players.forEach(p => {
            // Leveling
            if (p.army.level.inProgress && p.army.level.timeRemaining > 0) {
                p.army.level.timeRemaining -= this.game.interval;
            }

            // Leveling finished
            if (p.army.level.inProgress && p.army.level.timeRemaining <= 0) {
                p.army.level.inProgress = false;
                p.army.level.timeRemaining = p.army.level.timeToUpgrade;

                // Increment army level
                p.army.level.value++;

                // Update bonuses
                p.army.strengthBonus = (p.army.level.value - 1) * 10;

                this.game.sendMessage(`${p.name} upgraded his army to level ${p.army.level.value}`);
            }

            // Recruiting 
            if (p.army.soldiers.inProgress && p.army.soldiers.timeRemaining > 0) {
                p.army.soldiers.timeRemaining -= this.game.interval;
            }

            // Recruiting finished
            if (p.army.soldiers.inProgress && p.army.soldiers.timeRemaining <= 0) {
                p.army.soldiers.inProgress = false;
                p.army.soldiers.timeRemaining = p.army.soldiers.timeToUpgrade;

                // Increment army level
                // TODO: increase with ordered amount!!
                p.army.soldiers.value++;

                this.game.sendMessage(`${p.name} recruited a soldier`);
            }

        });
    }

    private recruit = (event: ISocketEvent, player: IPlayer) => {
        // Already upgrading
        if (player.army.soldiers.inProgress === true) {
            this.game.sendMessage(`${player.name} is already upgrading his army`);
            return;
        }

        // Cannot afford
        const cost = player.army.soldiers.cost;
        if (player.coins < cost) {
            this.game.sendMessage(`${player.name} cannot afford to recruit a soldier`);
            return;
        }

        player.coins -= cost;
        player.army.soldiers.inProgress = true;
        this.game.sendMessage(`${player.name} started recruiting`);
        this.game.sync();
    }

    private upgrade = (event: ISocketEvent, player: IPlayer) => {
        // Already upgrading
        if (player.army.level.inProgress === true) {
            this.game.sendMessage(`${player.name} is already upgrading his army`);
            return;
        }

        // Cannot afford
        const cost = player.army.level.value * player.army.level.cost;
        if (player.coins < cost) {
            this.game.sendMessage(`${player.name} cannot afford to upgrade his army`);
            return;
        }

        player.coins -= cost;
        player.army.level.inProgress = true;
        this.game.sendMessage(`${player.name} started upgrading his army`);
        this.game.sync();
    }
}

/**
 * GameStateSync Node - sends gamestate to clients every x seconds
 */
class GameStateSyncNode extends Node {
    lastSync: number = Date.now();
    syncRate: number = 1000;

    constructor(game: CacServer) {
        super(game, "GameStateSync");
    }

    update = () => {
        // No players ?
        if (this.game.state.players.length <= 0) {
            return;
        }

        this.game.sync();
    }

    tick = () => {
        // // No players ?
        // if (this.game.state.players.length <= 0) {
        //     return;
        // }

        // this.game.sync();
    }
}

class TimerNode extends Node {
    private timerAcc: number = 0;
    private timerIntervall: number = 10;

    constructor(game: CacServer) {
        super(game, 'Timer');
    }

    update = () => {
        this.game.state.timer++;

        this.timerAcc++;
        if (this.timerAcc > this.timerIntervall) {
            this.game.state.ticks++;
            this.timerAcc = 0;
            this.game.tick();
        }
    }
}

/**
 * StartStopGameNode - listens to start and stop events
 */
class StartStopGameNode extends Node {
    constructor(game: CacServer) {
        super(game, 'StartStopGame');
        this.eventHandlers.push({ eventType: 'start-game', handle: this.startGame });
        this.eventHandlers.push({ eventType: 'stop-game', handle: this.stopGame });
    }

    private startGame = (event: ISocketEvent, player: IPlayer) => {
        if (this.game.state.players.length <= 0) {
            this.game.sendMessage(`Unable to start game, no players found`);
            return;
        }

        this.game.state.phase = 'running';
        this.game.sendMessage(`${player.name} started the game`);
        this.game.intervalId = setInterval(() => {
            this.game.update();
        }, this.game.interval);
    }

    private stopGame = (event: ISocketEvent, player: IPlayer) => {
        this.game.state.phase = 'lobby';
        this.game.sendMessage(`${player.name} stopped the game`);
        this.game.sync();
        clearInterval(this.game.intervalId);
    }
}

/**
 * Dev tools
 */
class DevNode extends Node {
    constructor(game: CacServer) {
        super(game, "Dev");
        this.eventHandlers.push({ eventType: 'dev-get-coins', handle: this.coin });
    }

    private coin = (event: ISocketEvent, player: IPlayer) => {
        player.coins += parseInt(event.value);
        this.game.sendMessage(`${player.name} received ${event.value} coins`);
        this.game.sync();
    }

}