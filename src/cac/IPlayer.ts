export interface ICity {
    level: number;
    workTimer: number;
    isWorking: boolean;
}

export interface IArmy {
    level: number;
    strength: number;
    soldiers: number;
}

export interface ICitizens {
    level: number;
    efficiency: number;
    workers: number;
}

export interface IPlayer {
    socketId: string;
    name: string;
    coins: number;
    cps: number;
    isDead: boolean;
    isComputer: boolean;

    city: ICity;
    army: IArmy;
    citizens: ICitizens;
}

export const newPlayer: IPlayer = {
    socketId: '-1',
    name: 'New Player',
    coins: 0,
    cps: 0,
    isDead: false,
    isComputer: false,

    city: {
        level: 1,
        workTimer: 5000,
        isWorking: false
    },

    army: {
        level: 1,
        strength: 100,
        soldiers: 10,
    },

    citizens: {
        level: 1,
        efficiency: 100,
        workers: 10,
    }
}