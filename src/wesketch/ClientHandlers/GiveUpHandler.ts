import { WesketchEventTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

export class GiveUpHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.GiveUp) {
            return;
        }

        server.state.timer.remaining = 0;

        server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, {
            message: `${event.userName} gave up trying to draw the stupid word`
        });
    }
}
