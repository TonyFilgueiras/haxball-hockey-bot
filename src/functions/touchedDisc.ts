import { Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "./detectLastPlayerTouch";
import { room } from "../bot";

export default function touchedDisc( player: Player): boolean {
    if (room.discs[0].distanceTo(player) < 1) {
        detectLastPlayerTouch(player)
        return true
    } else {
        return false
    }
}