import { ISocketEvent, SocketServerService, ISocketClient } from '../shared/socket-server-service';

export interface IMbgPlayer extends ISocketClient { }

export class MbgLobbyServer {
    socketService: SocketServerService;
    players: IMbgPlayer[] = [];
    rooms: string[] = ['room1', 'room2', 'room3'];

    constructor(io: SocketIO.Server) {
        console.log('### MbgLobbyServer created');
        this.socketService = new SocketServerService(io, 'mbg', this.onConnect, this.onDisconnect, this.onEvent);
    }

    private onConnect = (client: SocketIO.Socket) => {
        console.log(`### MbgLobbyServer Client Connected, id: ${client.id}`)
        this.players.push({
            socketId: client.id,
            name: ''
        });
        this.socketService.emit('get-clients', this.players);
        this.socketService.emit('get-rooms', this.rooms);

        // let player = newPlayer;
        // player.socketId = client.id;
        // player.name = `Player ${this.state.players.length + 1}`
        // this.state.players.push(player);
        // this.sync();
    }

    private onDisconnect = (client: SocketIO.Socket) => {
        console.log(`### MbgLobbyServer Client Disconnected, socketId: ${client.id}`);
        this.players = this.players.filter(p => p.socketId !== client.id);
        this.socketService.emit('get-players', this.players);

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

        if (event.type === 'get-players') {
            this.socketService.emit('get-players', this.players);
        }

        if (event.type === 'join') {
            console.log('join', event.socketId, event.value);

            var player = this.players.find(p => p.socketId === event.socketId);
            console.log('player', player);
            
            player.name = event.value;
            this.socketService.emit('get-players', this.players);
        }

        if (event.type === 'join-room') {
            console.log('join-room', event.socketId, event.value);

            var player = this.players.find(p => p.socketId === event.socketId);
            console.log(`player ${player.name} wants to join room: ${event.value}`);
        }
    }
}