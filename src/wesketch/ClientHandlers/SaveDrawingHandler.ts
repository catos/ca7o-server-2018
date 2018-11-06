import { WesketchEventTypes } from "../Types";
import { IWesketchEventHandler, IWesketchEvent, IWesketchDrawing } from "../Interfaces";
import { WesketchServer } from "../wesketch-server";

export class SaveDrawingHandler implements IWesketchEventHandler {
    handle = (event: IWesketchEvent, server: WesketchServer) => {
        if (event.type !== WesketchEventTypes.SaveDrawing) {
            return;
        }
        const data = event.value.data as string;
        console.log(`SaveImage received from ${event.value.player} data: ${data.length}`);
        const drawing: IWesketchDrawing = {
            player: event.value.player,
            word: event.value.word,
            data
        };
        server.drawings.push(drawing);
        // const imageDataCompressed = zlib.deflateSync(imageData);
        // console.log('imageDataCompressed.length: ', imageDataCompressed.length);
        // var base64Data = imageData.replace(/^data:image\/png;base64,/, "");
        // fs.writeFile("out.png", base64Data, 'base64', (err: NodeJS.ErrnoException) => {
        //     console.log(err);
        // });
    }
}
