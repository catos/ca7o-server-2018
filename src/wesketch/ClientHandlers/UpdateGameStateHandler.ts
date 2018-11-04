import { WesketchEventTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

export class UpdateGameStateHandler implements IWesketchEventHandler {
    handle(event: IWesketchEvent, server: WesketchServer): void {
        if (event.type !== WesketchEventTypes.UpdateGameState) {
            return;
        }

        server.state = event.value;
        server.socket.sendEvent(event);
    }
}