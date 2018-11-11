import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent } from "../interfaces";
import { WesketchServer } from "../wesketch-server";

export class ClearCanvasHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.ClearCanvas) {
            return;
        }

        server.socket.sendEvent(event);
    }
}