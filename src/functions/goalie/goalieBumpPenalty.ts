import { Player, Room } from "haxball-extended-room";
import { redTeam } from "../../players/redTeam";
import { blueTeam } from "../../players/blueTeam";
import insideRedBox from "../insideRedBox";
import insideBlueBox from "../insideBlueBox";
import { room } from "../../bot";

export default function goalieBumpPenalty(player: Player): void {
  for (let i = 0; i < redTeam.length; i++) {
    if (player.collidingWith(redTeam[i])) {
      if (player.team === 2) {
        if (redTeam[i].settings.goalie || redTeam[i].settings.penaltyGoalie) {
          if (insideRedBox(redTeam[i].x, redTeam[i].y)) {
            room.send({
              message: "Goalie bumped by a player in the Blue Team",
            });
          }
        }
      }
    }
  }
  for (let i = 0; i < blueTeam.length; i++) {
    if (player.collidingWith(blueTeam[i])) {
      if (player.team === 1) {
        if (blueTeam[i].settings.goalie || blueTeam[i].settings.penaltyGoalie) {
          if (insideBlueBox(blueTeam[i].x, blueTeam[i].y)) {
            room.send({ message: "Goalie bumped by a player in the Red Team" });
          }
        }
      }
    }
  }
}
