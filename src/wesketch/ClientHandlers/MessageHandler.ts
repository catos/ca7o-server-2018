import { WesketchEventTypes, PhaseTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

import { guessIsClose } from "../../shared/utils";

export class MessageHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.Message) {
            return;
        }

        const { state } = server;

        // Player not found...
        let player = state.players.find(p => p.userId === event.userId);
        if (player === undefined) {
            return;
        }

        // Drawing player is not allowed to guess or talk during draw-phase
        if (player.isDrawing) {
            return;
        }

        // Someone guessed the word
        const guessedWord = event.value.message.toLowerCase() === state.currentWord.toLowerCase();
        if (state.phase === PhaseTypes.Drawing && guessedWord) {

            // Check if player already has guessed it
            if (player.guessedWord) {
                return;
            }

            // Send message to clients
            server.socket.sendServerEvent(WesketchEventTypes.PlaySound, {
                name: 'playerGuessedTheWord',
                userId: player.userId,
                global: false
            });
            server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, {
                message: `${event.userName} guessed the word!`
            });

            // Update player score
            const finishedPlayersCount = state.players.reduce((n, player) => {
                return (player.guessedWord && !player.isDrawing)
                    ? n + 1
                    : n;
            }, 0);
            const firstGuess = finishedPlayersCount === 0;
            const score = server.GUESS_SCORE - finishedPlayersCount;
            player.score += score;
            player.guessedWord = true;

            // Update drawing player score
            let drawingPlayer = state.players.find(p => p.isDrawing);
            let drawScore = firstGuess
                ? 10 - (3 * state.hintsGiven)
                : 1;
            drawingPlayer.score += drawScore;

            // Check if all non-drawing players guessed the word
            const playersRemaining = state.players.reduce((n, player) => {
                return (!player.guessedWord && !player.isDrawing)
                    ? n + 1
                    : n;
            }, 0);
            if (playersRemaining === 0) {
                state.timer.remaining = 0;
                server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, {
                    message: `All players guessed the word!`
                });
            }

            // Reduce timer after first guess
            if (firstGuess && state.timer.remaining > server.FIRST_GUESS_TIME_REMAINING) {
                server.socket.sendServerEvent(WesketchEventTypes.PlaySound, {
                    name: 'timerTension',
                    userId: player.userId,
                    global: true
                });
                state.timer.remaining = server.FIRST_GUESS_TIME_REMAINING;
            }

            server.socket.sendServerEvent(WesketchEventTypes.UpdateGameState, server.state);
            return;
        }

        // Someone is close
        const isClose = guessIsClose(event.value.message, state.currentWord);
        if (state.phase === PhaseTypes.Drawing && isClose) {
            server.socket.sendServerEvent(WesketchEventTypes.PlaySound, {
                name: 'playerIsClose',
                userId: event.userId,
                global: false
            });
            server.socket.sendServerEvent(WesketchEventTypes.SystemMessage, {
                message: `${event.userName} is close...`
            });
            return;
        }

        // Bounce event if not correct or close
        server.socket.sendEvent(event);
    }
}

