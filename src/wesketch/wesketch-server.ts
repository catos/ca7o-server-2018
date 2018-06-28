enum WesketchEventType {
    PlayerJoined,
    PlayerLeft,
    Message,
    SystemMessage,
    StartDraw,
    Draw,
    StopDraw,
    ClearCanvas,
    GameStateChange
}

interface IWesketchEvent {
    client: string
    timestamp: Date
    type: WesketchEventType
    value: any
}

enum PhaseTypes {
    Lobby,
    Drawing,
    RoundEnd,
    GameEnd
}

interface IPlayer {
    clientId: string;
    name: string;
}

interface WesketchState {
    phase: PhaseTypes,
    players: IPlayer[],
    // round: number;
    // currentWord: string;    
}

export class WesketchServer {
    public state: WesketchState;

    constructor(io: SocketIO.Server) {
        this.state = {
            phase: PhaseTypes.Lobby,
            players: []
        };

        io.on('connection', (client: SocketIO.Socket) => {
            console.log('### client connected')

            client.on('event', (event: IWesketchEvent) => {
                console.log(`### client: ${client}, timestamp: ${event.timestamp}, type: ${WesketchEventType[event.type]}`, event.value)
                if (event.type === WesketchEventType.PlayerJoined) {
                    this.addPlayer({
                        clientId: client.id,
                        name: event.value.player
                    });
                }
                io.emit('event', event)
            })

            client.on('disconnect', () => {
                console.log('### client disconnected')
            })
        });
    }

    addPlayer(player: IPlayer) {
        const existingPlayer = this.state.players
            .find(p => p.name === player.name);
        console.log('existingPlayer', existingPlayer);

        if (existingPlayer === undefined) {
            this.state.players.push(player);
        }

        console.log(this.state);
    }
}