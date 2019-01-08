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
