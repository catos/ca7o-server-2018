import { ISocketEvent } from "./i-socket-event";

export interface ISocketEventHandler {
    eventType: string;
    handle: (event: ISocketEvent) => void;
}