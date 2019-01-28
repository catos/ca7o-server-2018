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
        const syncEvent: IEvent = {
            socketId: 'na',
            name: 'server',
            timestamp: Date.now(),
            type: 'UpdateGameState',
            value: this.state
        };
        this.cs.emit(syncEvent);
    }

    sendMessage = (message: string) => {
        const syncEvent: IEvent = {
            socketId: 'na',
            name: 'server',
            timestamp: Date.now(),
            type: 'Message',
            value: message
        };
        this.cs.emit(syncEvent);
    }

    private onConnect = (client: SocketIO.Socket) => {
        console.log(`### Client Connected, id: ${client.id}`)
        let player = new Player(client.id, `Player ${this.state.players.length + 1}`);
        this.state.players.push(player);
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
    tick = () => { }
}

/**
 * Player Node - handle client input related to player 
 */
class PlayerNode extends Node {
    constructor(game: CacGame) {
        super(game, "Player");
        this.eventHandlers.push({ eventType: 'join-game', handle: this.joinGame });
    }

    private joinGame = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);
        if (player !== undefined) {
            player.name = event.name;
            this.game.sendMessage(`${player.name} joined the game`);
            this.game.sync();
        }
    }
}

/**
 * CityNode
 */
class CityNode extends Node {
    constructor(game: CacGame) {
        super(game, 'City');
        this.eventHandlers.push({ eventType: 'city-work', handle: this.work });
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

                const newCoins = Math.floor(p.citizens.workers * (p.city.bonuses.work / 100 + 1));
                p.coins += newCoins;
                this.game.sendMessage(`${p.name} finished working and gained ${newCoins} coins`);
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

                // Update bonuses
                p.city.bonuses.work = (p.city.level.value - 1) * 10;
                p.city.bonuses.buildCost = (p.city.level.value - 1) * 10;
                p.city.bonuses.buildTime = (p.city.level.value - 1) * 10;
                p.city.bonuses.defence = p.city.level.value * 10;

                // Update cpt
                p.cpt = p.city.level.value;

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

    private work = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);
        // Player not found
        if (player === undefined) {
            this.game.sendMessage(`No player found with socketId: ${event.socketId}`);
            return;
        }

        // Already upgrading
        if (player.city.work.inProgress === true) {
            this.game.sendMessage(`${player.name} is already working`);
            return;
        }

        player.city.work.inProgress = true;
        this.game.sync();
    }

    private upgrade = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);

        // Player not found
        if (player === undefined) {
            this.game.sendMessage(`No player found with socketId: ${event.socketId}`);
            return;
        }

        // Already upgrading
        if (player.city.level.inProgress === true) {
            this.game.sendMessage(`${player.name} is already upgrading his city`);
            return;
        }

        const cost = player.city.level.value * player.city.level.cost;
        if (player.coins < cost) {
            this.game.sendMessage(`${player.name} cannot afford to upgrade his army`);
            return;
        }

        player.coins -= cost;
        player.city.level.inProgress = true;
        this.game.sendMessage(`${player.name} started upgrading his city`);
        this.game.sync();
    }
}

class ArmyNode extends Node {
    constructor(game: CacGame) {
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
                p.army.strength = (p.army.level.value - 1) * 10;

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

    private recruit = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);

        // Player not found
        if (player === undefined) {
            this.game.sendMessage(`No player found with socketId: ${event.socketId}`);
            return;
        }

        // Already upgrading
        if (player.army.level.inProgress === true) {
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

    private upgrade = (event: IEvent) => {
        const player = this.game.state.players.find(p => p.socketId === event.socketId);

        // Player not found
        if (player === undefined) {
            this.game.sendMessage(`No player found with socketId: ${event.socketId}`);
            return;
        }

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

    constructor(game: CacGame) {
        super(game, "GameStateSync");
    }

    tick = () => {
        // No players ?
        if (this.game.state.players.length <= 0) {
            return;
        }

        this.game.sync();
    }
}

class TimerNode extends Node {
    private timerAcc: number = 0;
    private timerIntervall: number = 10;

    constructor(game: CacGame) {
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