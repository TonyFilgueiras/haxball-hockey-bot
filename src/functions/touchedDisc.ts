import { Player, Room } from "haxball-extended-room";
import detectLastTeamTouch from "./detectLastTeamTouch";

export default function touchedDisc(room: Room, player: Player): boolean {
    if (room.discs[0].distanceTo(player) < 1) {
        detectLastTeamTouch(player.team)
        return true
    } else {
        return false
    }
}