import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent } from "../interfaces";
import { WesketchServer } from "../wesketch-server";

export class ChangeBrushSizeHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.ChangeBrushSize) {
            return;
        }

        let newBrushSize = server.state.brushSize + +event.value;

        if (newBrushSize > 0 && newBrushSize <= 24) {
            server.state.brushSize = newBrushSize;
            server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
        }
    }
}
