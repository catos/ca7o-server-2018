import { WesketchEventTypes } from "../types/WesketchEventType";

export interface IWesketchEvent {
    clientId: string;
    userId: string;
    userName: string;
    timestamp: Date;
    type: WesketchEventTypes;
    value: any;
}
