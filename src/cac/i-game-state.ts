import { IPlayer } from "./i-player";

export interface IGameState {
    timer: number;
    ticks: number;
    phase: string;
    gameOver: boolean;
    players: IPlayer[];
}