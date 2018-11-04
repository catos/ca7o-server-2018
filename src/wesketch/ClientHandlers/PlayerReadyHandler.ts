import { WesketchEventTypes, PhaseTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

export class PlayerReadyHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.PlayerReady) {
            return;
        }

        // Toggle ready is only avaliable in Lobby-phase
        if (server.state.phase !== PhaseTypes.Lobby) {
            return;
        }

        // Reset ready on all players
        server.state.players.forEach(p => {
            if (p.userId === event.userId) {
                p.isReady = !p.isReady;
            }
        });

        // Everyone is ready, start game!
        if (server.state.players.every(p => p.isReady) && server.state.players.length > 1) {
            server.setDrawingPlayer();
            server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, { message: `All players are ready, starting game in ${server.START_ROUND_DURATION} seconds!` });
            server.startTimer(server.START_ROUND_DURATION, server.startRound);
        }

        // Play sound
        server.socket.sendServerEvent(WesketchEventTypes.PlaySound, {
            name: 'playerReady',
            userId: event.userId,
            global: false
        });

        // Update game state
        server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
    }
}
