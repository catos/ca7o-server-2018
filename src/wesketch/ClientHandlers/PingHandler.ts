import { WesketchServer } from "../wesketch-server";
import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent } from "../interfaces";

export class PingHandler implements IWesketchEventHandler {
    handle(event: IWesketchEvent, server: WesketchServer): void {
        if (event.type !== WesketchEventTypes.Ping) {
            return;
        }

        server.state.players = server.state.players.map(p => {
            if (p.userId === event.userId) {
                p.pingCount = 0;
            }

            return p;
        });

        // TODO: fjern denne
        // server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
    }
}