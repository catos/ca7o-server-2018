import { WesketchEventTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

export class ChangeColorHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.ChangeColor) {
            return;
        }

        server.state.primaryColor = event.value;
        server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
    }
}
