import Room from "../../core/Room";
import Game, { GameModes } from "../Game";
import { Mode } from "./Mode";

export default class Shootout extends Mode{
  name = "shootout"
  mode = GameModes.Shootout

  constructor(room: Room, game: Game) {
    super(game)
  }

}