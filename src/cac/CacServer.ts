/**
 * https://github.com/Arcanorum/basic-networked-multiplayer-game/blob/master/Server.js
 * 
 * 
 * 
 *  Game
        ManyGameVariablesAndConstants
        sync()
        update()

        SocketIOServer
            onEvent() // Events fra clients med socket.io    

        PlayerObject
            update()
        ShopObject
            update()
        CraftingObject
            update()

 * 
 * 
 */

export class CacSocket {
    io: SocketIO.Namespace;

    constructor(io: SocketIO.Server, onEvent: (event: any) => void, onDisconnect: (event: any) => void) {
        this.io = io.of('/cac');
        this.io.on('connection', (client: SocketIO.Socket) => {
            console.log('### Client Connected')
            client.on('event', onEvent);
            client.on('disconnect', onDisconnect);
        });
    }
}

export class CacGame {
    cs: CacSocket;
    eventHandlers: IEventHandler[] = [];

    constructor(io: SocketIO.Server) {
        this.cs = new CacSocket(io, this.onEvent, this.onDisconnect);
    }

    onEvent = (event: any) => {
        console.log('### Client Disconnected');

        this.eventHandlers
            .filter(p => p.eventType === event.type)
            .map(eh => eh.handle(event));
    }

    onDisconnect = (event: any) => {
        console.log('### Client Disconnected');
        // this.gameState.players = this.gameState.players.filter(p => p.socketId !== client.id);
    }

    // Main game loop
    update = () => {

    }
}


interface IEventHandler {
    eventType: string;
    handle: (event: any) => void;
}
