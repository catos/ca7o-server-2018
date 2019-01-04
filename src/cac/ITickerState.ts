import { IPlayer } from "./IPlayer";

export interface ITickerState {
    gameOver: boolean;
    // gameSpeed: number;
    updated: number;
    prevUpdated: number;
    ticks: number;

    players: IPlayer[];
}

export const defaultTickerState: ITickerState = {
    gameOver: false,
    // gameSpeed: 100,
    updated: Date.now(),
    prevUpdated: Date.now(),
    ticks: 0,

    players: []
}