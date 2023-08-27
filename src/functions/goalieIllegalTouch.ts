import { Player } from "haxball-extended-room";
import touchedDisc from "./touchedDisc";
import penaltyDetected from "./penaltyDetected";
import insideRedBox from "./insideRedBox";
import insideBlueBox from "./insideBlueBox";
import { room } from "../bot";

export default function goalieIllegalTouch(player: Player) {
    const previousTouchOnDisc = room.settings.lastTeamTouch
    if (player.settings.goalie || player.settings.penaltyGoalie) {
        if (touchedDisc(player)) {
            if (goalieOutsideBox(player)) {
                if (previousTouchOnDisc !== player.team) {
                    if (player.team === 2){
                        penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 2)   
                    } else if (player.team ===1){
                        penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 1)
                    }
                }
            }
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
