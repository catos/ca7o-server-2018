import { ISocketEventHandler } from "../socket-server-service";

export interface INode {
    name: string;
    eventHandlers: ISocketEventHandler[];
    update: () => void;
    tick: () => void;
}