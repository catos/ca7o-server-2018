import { ICacPlayer } from "./i-cac-player";

export interface ICacGameState {
    timer: number;
    ticks: number;
    phase: string;
    gameOver: boolean;
    players: ICacPlayer[];
}