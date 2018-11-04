import { WesketchEventTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

export class GiveHintHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.GiveHint) {
            return;
        }

        if (server.state.hintsGiven >= server.MAX_HINTS_ALLOWED) {
            return;
        }

        server.state.hintsGiven++;
        let message = server.state.hintsGiven > 1
            ? `${event.userName} presents yet another hint!`
            : `${event.userName} presents a hint!`;
        server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, { message });
        server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
    }
}