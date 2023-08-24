import { Player, Room } from "haxball-extended-room";
import insideRedBox from "./insideRedBox";
import penaltyDetected from "./penaltyDetected";
import touchedDisc from "./touchedDisc";

export default function illegalTouchInRedBox(player: Player, room : Room) {
    if (insideRedBox(player.x, player.y)) {
        if (!player.settings.goalie) {
            if (touchedDisc(room, player)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", room, 1)
            }
        }
    }

}
