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

export interface ICity {
    level: IProperty;
    work: IProperty;
    bonuses: ICityBonuses;
    workers: IProperty;
}

export interface IArmy {
    level: IProperty;
    soldiers: IProperty;
    strengthBonus: number;
}

export interface IPlayer {
    socketId: string;
    name: string;
    coins: number;
    cpt: number;
    isDead: boolean;
    isComputer: boolean;
    city: ICity;
    army: IArmy;
}

export const newPlayer: IPlayer = {
    socketId: '',
    name: '',
    coins: 100,
    cpt: 1,
    isDead: false,
    isComputer: false,
    city: {
        level: {
            value: 1,
            cost: 100,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        },
        work: {
            value: 1,
            cost: 10,
            timeRemaining: 3000,
            timeToUpgrade: 3000,
            inProgress: false
        },
        bonuses: {
            work: 0,
            buildCost: 0,
            buildTime: 0,
            defence: 10
        },
        workers: {
            value: 10,
            cost: 10,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        }
    },
    army: {
        level: {
            value: 1,
            cost: 100,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        },
        soldiers: {
            value: 10,
            cost: 10,
            timeRemaining: 5000,
            timeToUpgrade: 5000,
            inProgress: false
        },
        strengthBonus: 0,

    }
}