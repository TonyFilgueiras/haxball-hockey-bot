import { Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "../detectLastPlayerTouch";
import { room } from "../../bot";
import touchedDisc from "../touchedDisc";

export default function penaltyCarrierChange(player: Player): boolean {
    const previousPlayerTouchOnDisc = room.settings.penaltyTakerId
    const previousTeamTouchOnDisc = room.settings.penaltyTakerTeam

    if (touchedDisc(player, true) && player.id !== previousPlayerTouchOnDisc && player.team === previousTeamTouchOnDisc) {
        room.settings.penaltyKickers++
        if (room.settings.penaltyKickers >= 1) {
            room.settings.penaltyKickers = 0
            return true
        }
        return false
    } else {
        return false;
    }
}