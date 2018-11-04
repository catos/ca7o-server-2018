import { IWesketchEvent } from "./IWesketchEvent";
import { WesketchServer } from "../wesketch-server";

export interface IWesketchEventHandler {
    handle(event: IWesketchEvent, server: WesketchServer): void;
}