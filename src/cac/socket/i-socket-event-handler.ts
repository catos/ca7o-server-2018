import { ISocketEvent } from "../../shared/socket-server-service";
import { IPlayer } from "../i-player";

export interface ISocketEventHandler {
    eventType: string;
    handle: (event: ISocketEvent, player: IPlayer) => void;
}