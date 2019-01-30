import { CacServer } from "./cac-server";
import { ISocketEventHandler } from "./socket/i-socket-event-handler";

export interface INode {
    name: string;
    game: CacServer;
    eventHandlers: ISocketEventHandler[];
    update: () => void;
    tick: () => void;
}