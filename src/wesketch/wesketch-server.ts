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

interface WesketchState {
    phase: PhaseTypes,
    players: string[],
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
            console.log('WesketchServer client connected')
    
            client.on('event', (event: IWesketchEvent) => {
                console.log(`client: ${event.client}, timestamp: ${event.timestamp}, type: ${event.type}`)
                io.emit('event', event)
            })
    
            client.on('disconnect', () => {
                console.log('WesketchServer client disconnected')
            })
        });
    }
}