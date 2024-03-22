export interface TeamColors {
    angle: number,
    textColor: number,
    colors: number[]
}

export interface MessageObject {
    message: string,
    targetID?: number,
    color?: number | string,
    style?: ChatStyle,
    sound?: ChatSounds
}

export enum Team {
    Spectators = 0,
    Red = 1,
    Blue = 2
}