import { Player, Room } from "haxball-extended-room";
import insideRedBox from "./insideRedBox";
import penaltyDetected from "./penalty/penaltyDetected";
import touchedDisc from "./touchedDisc";

export default function illegalTouchInRedBox(player: Player) {
    if (insideRedBox(player.x, player.y)) {
        if (!player.settings.goalie && player.settings.penaltyGoalie !== 1) {
            if (touchedDisc(player)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", 1)
            }
        }
    }

}
