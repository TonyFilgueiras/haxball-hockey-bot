import { Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "../detectLastPlayerTouch";
import { room } from "../../bot";
import touchedDisc from "../touchedDisc";
import { playersList } from "../../players/players";
import { blueTeam } from "../../players/blueTeam";
import { redTeam } from "../../players/redTeam";

export default function penaltyCarrierChange(player: Player): boolean {
    const previousPlayerTouchOnDisc = room.settings.penaltyTakerId

    if (touchedDisc(player, true) && player.id !== previousPlayerTouchOnDisc) {
        room.settings.penaltyKickers++

        if (room.settings.penaltyKickers > 1) {
            room.settings.penaltyKickers = 0
            return true
        }
        return false
    } else {
        return false;
    }
}