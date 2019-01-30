import { CacServer } from "./cac-server";
import { ISocketEventHandler } from "./socket/i-socket-event-handler";

export interface IProperty {
    value: number;
    cost: number;
    timeRemaining: number;
    timeToUpgrade: number;
    inProgress: boolean;
}

export interface ICityBonuses {
    work: number;
    buildCost: number;
    buildTime: number;
    defence: number;
}

export class City {
    level: IProperty;
    work: IProperty;
    bonuses: ICityBonuses;

    constructor() {
        this.level = {
            value: 1,
            cost: 100,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        };
        this.work = {
            value: 1,
            cost: 0,
            timeRemaining: 3000,
            timeToUpgrade: 3000,
            inProgress: false
        };
        this.bonuses = {
            work: 0,
            buildCost: 0,
            buildTime: 0,
            defence: 10
        };
    }
}

export class Army {
    level: IProperty;
    soldiers: IProperty;
    strengthBonus: number;

    constructor() {
        this.level = {
            value: 1,
            cost: 100,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        };
        this.soldiers = {
            value: 10,
            cost: 10,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        };
        this.strengthBonus = 0;
    }
}

export class Citizens {
    level: number;
    efficiency: number;
    workers: IProperty;

    constructor() {
        this.level = 1;
        this.efficiency = 100;
        this.workers = {
            value: 10,
            cost: 10,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        };
    }
}

export class Player {
    socketId: string;
    name: string;
    coins: number;
    cpt: number;
    isDead: boolean;
    isComputer: boolean;

    city: City;
    army: Army;
    citizens: Citizens;

    constructor(socketId: string, name: string) {
        this.socketId = socketId;
        this.name = name;

        this.coins = 100;
        this.cpt = 1;
        this.isDead = false;
        this.isComputer = false;

        this.city = new City();
        this.army = new Army();
        this.citizens = new Citizens();
    }
}

/**
 * 
 */
export interface IGameState {
    timer: number;
    ticks: number;
    phase: string;
    gameOver: boolean;
    players: Player[];
}

/**
 * 
 */
export interface INode {
    name: string;
    game: CacServer;
    eventHandlers: ISocketEventHandler[];
    update: () => void;
    tick: () => void;
}