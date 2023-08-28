import { Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "./detectLastPlayerTouch";
import { room } from "../bot";

export default function touchedDisc( player: Player, penaltyMode: boolean = false): boolean {
    if (room.discs[0].distanceTo(player) < 0.1) {
        detectLastPlayerTouch(player, penaltyMode)
        return true
    } else {
        return false
    }
}