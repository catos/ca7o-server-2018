import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent, IWesketchPlayer } from "../interfaces";
import { WesketchServer } from "../wesketch-server";

export class PlayerLeftHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.PlayerLeft) {
            return;
        }

        // If leaving player is drawing
        const leavingPlayer = server.state.players.find((p: IWesketchPlayer) => p.userId === event.userId);

        // Reset timer if leaving player was drawing
        if (leavingPlayer.isDrawing) {
            server.state.timer.remaining = 0;
        }

        // Update players
        server.state.players = server.state.players.filter((p: IWesketchPlayer) => p.userId !== event.userId)
        server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, { message: `${event.userName} left the game` });
        server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);

        // Reset game if only 1 player left
        if (server.state.players.length <= 1) {
            server.resetGame('too few players left to continue');
        }
    }
}
