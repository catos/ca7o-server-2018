import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent } from "../interfaces";
import { WesketchServer } from "../wesketch-server";

export class DrawHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.Draw) {
            return;
        }

        server.socket.sendEvent(event);
    }
}