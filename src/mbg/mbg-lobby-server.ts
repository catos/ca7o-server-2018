import { ISocketEvent, SocketServerService } from '../shared/socket-server-service';

export class MbgLobbyServer {
    socketService: SocketServerService;
    clients: string[] = [];
    rooms: string[] = ['room1', 'room2', 'room3'];

    constructor(io: SocketIO.Server) {
        console.log('### MbgLobbyServer created');
        this.socketService = new SocketServerService(io, 'mbg', this.onConnect, this.onDisconnect, this.onEvent);
    }

    private onConnect = (client: SocketIO.Socket) => {
        console.log(`### MbgLobbyServer Client Connected, id: ${client.id}`)
        this.clients.push(client.id);
        this.socketService.emit('get-clients', this.clients);
        // let player = newPlayer;
        // player.socketId = client.id;
        // player.name = `Player ${this.state.players.length + 1}`
        // this.state.players.push(player);
        // this.sync();
    }

    private onDisconnect = (client: SocketIO.Socket) => {
        console.log(`### MbgLobbyServer Client Disconnected, socketId: ${client.id}`);
        this.clients = this.clients.filter(p => p !== client.id);
        // this.state.players = this.state.players.filter(p => p.socketId !== client.id);
        // this.sync();
    }

    private onEvent = (event: ISocketEvent) => {
        console.log(`### MbgLobbyServer Client Event, type: ${event.type}`);

        // // TODO: this is true for mbg-server, not mbg-lobby-server!!! All events must have a player
        // const player = this.state.players.find(p => p.socketId === event.socketId);
        // if (player === undefined) {
        //     this.sendMessage(`No player found with socketId: ${event.socketId}`);
        //     return;
        // }

        // // Handle event
        // this.nodes.forEach(n => {
        //     n.eventHandlers
        //         .filter(p => p.eventType == event.type)
        //         .map(h => h.handle(event, player));
        // });

        if (event.type === 'get-rooms') {
            this.socketService.emit('get-rooms', this.rooms);
        }
    }
}