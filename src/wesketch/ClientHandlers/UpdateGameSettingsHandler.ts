import { WesketchEventTypes } from "../types";
import { IWesketchEventHandler, IWesketchEvent, IWesketchGameSettings } from "../interfaces";
import { WesketchServer } from "../wesketch-server";
import { Word } from "../word.model";

export class UpdateGameSettingsHandler implements IWesketchEventHandler {
    async handle(event: IWesketchEvent, server: WesketchServer): Promise<void> {
        if (event.type !== WesketchEventTypes.UpdateGameSettings) {
            return;
        }

        const gameSettings = event.value as IWesketchGameSettings;

        // Get word count
        gameSettings.wordCount = await Word
            .find({
                difficulty: { $in: gameSettings.difficulties },
                language: { $in: gameSettings.language }
            }).countDocuments();

        server.settings = gameSettings;
        server.socket.sendEvent(event);
    }
}
