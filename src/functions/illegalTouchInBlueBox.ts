import { Player, Room } from "haxball-extended-room";
import insideBlueBox from "./insideBlueBox";
import penaltyDetected from "./penaltyDetected";
import touchedDisc from "./touchedDisc";

export default function illegalTouchInBlueBox(player: Player, room : Room) {
    if (insideBlueBox(player.x, player.y)) {
        if (!player.settings.goalie && player.settings.penaltyGoalie !== 2) {
            if (touchedDisc(room, player)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", room, 2)
            }
        }
    }

}
