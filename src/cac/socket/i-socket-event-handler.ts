import { ISocketEvent } from "./i-socket-event";
import { Player } from "../Models";

export interface ISocketEventHandler {
    eventType: string;
    handle: (event: ISocketEvent, player: Player) => void;
}