import { ISocketEvent } from "./i-socket-event";
import { IPlayer } from "../i-player";

export interface ISocketEventHandler {
    eventType: string;
    handle: (event: ISocketEvent, player: IPlayer) => void;
}