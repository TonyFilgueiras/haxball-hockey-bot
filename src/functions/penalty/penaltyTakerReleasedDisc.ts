import { Player } from "haxball-extended-room";
import { room } from "../../bot";
import touchedDisc from "../touchedDisc";
import { blueTeam } from "../../players/blueTeam";
import { redTeam } from "../../players/redTeam";

export default function penaltyTakerReleasedDisc(player: Player): boolean{
    if (touchedDisc(player)) {
        if (room.settings.penaltyKickerReleased) {
            return true
        }
    }else if (player.distanceTo(room.discs[0]) > 2 && room.settings.penaltyTakerId === player.id) {
        room.settings.penaltyKickerReleased = true
        return false
    } else {
        return false
    }
}