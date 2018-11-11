import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent, IWesketchPlayer } from "../interfaces";

import { WesketchServer } from "../wesketch-server";

export class PlayerJoinedHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.PlayerJoined) {
            return;
        }

        const player = {
            clientId: event.clientId,
            userId: event.userId,
            name: event.userName,
            isReady: false,
            score: 0,
            drawCount: 0,
            isDrawing: false,
            guessedWord: false,
            pingCount: 0
        } as IWesketchPlayer;

        const existingPlayer = server.state.players
            .find((p: IWesketchPlayer) => p.userId === player.userId);

        if (existingPlayer === undefined) {
            server.state.players.push(player);
            server.socket.sendServerEvent(WesketchEventTypes.PlaySound, {
                name: 'playerJoined',
                userId: player.userId,
                global: false
            });
            server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, { message: `${player.name} joined the game` });
        }

        server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
    }
}