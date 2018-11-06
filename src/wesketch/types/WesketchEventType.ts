export enum WesketchEventTypes {
    ServerError,
    Ping,

    PlayerJoined,
    PlayerLeft,
    PlayerReady,

    PlaySound,
    StopSound,

    Message,
    SystemMessage,
    Draw,
    StopDraw,
    GiveUp,
    GiveHint,
    ClearCanvas,
    ChangeColor,
    ChangeBrushSize,

    UpdateGameSettings,
    UpdateGameState,

    ResetGame,
    SaveDrawing,
    GetDrawings,
    ShowScores,
}