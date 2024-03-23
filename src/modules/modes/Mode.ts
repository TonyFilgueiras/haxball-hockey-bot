import type Game from "../Game";

import Module from "../../core/Module";
import { GameModes } from "../Game";

export abstract class Mode extends Module {
    abstract mode: GameModes;
    abstract name: string;

    constructor(protected game: Game) {
        super();
    }
}