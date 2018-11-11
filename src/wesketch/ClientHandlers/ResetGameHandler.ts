import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent } from "../interfaces";
import { WesketchServer } from "../wesketch-server";

export class ResetGameHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.ResetGame) {
            return;
        }

        server.resetGame('a reset button was clicked!');
    }
}
