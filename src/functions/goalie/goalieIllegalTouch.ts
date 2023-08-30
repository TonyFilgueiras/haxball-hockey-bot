import { Player } from "haxball-extended-room";
import touchedDisc from "..//touchedDisc";
import penaltyDetected from "../penalty/penaltyDetected";
import insideRedBox from "../insideRedBox";
import insideBlueBox from "../insideBlueBox";
import { room } from "../../bot";

export default function goalieIllegalTouch(player: Player) {
    const previousTouchOnDisc = room.settings.lastTeamTouch;

    if ((player.settings.goalie || player.settings.penaltyGoalie) && touchedDisc(player) && goalieOutsideBox(player) && previousTouchOnDisc !== 0) {
        if (previousTouchOnDisc !== player.team) {
            const penaltyMessage = "O animal tocou no disco fora da área de goleiro após o toque do adversário";
            penaltyDetected(player, penaltyMessage, player.team);
        }
    }
}

export function goalieOutsideBox(player: Player): boolean{
    switch (player.team) {
        case 1:
            if (!insideRedBox(player.x, player.y)){
                if (player.x < -15 && player.x >= -744) {
                    return true
                }
                else {
                    return false
                }
            } else {
                return false
            }
        case 2:
            if (!insideBlueBox(player.x, player.y)){
                if (player.x > 15 && player.x <= 744) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        default:
            return false
    }
}
