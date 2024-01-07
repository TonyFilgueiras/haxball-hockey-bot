import { Player } from "haxball-extended-room";
import { redTeam } from "../../players/redTeam";
import { blueTeam } from "../../players/blueTeam";

export default function getGoalie(team: "red" | "blue"): Player | undefined {
  switch (team) {
    case "red":
      for (const redPlayer of redTeam) {
        if (redPlayer.settings.goalie == 1 || redPlayer.settings.penaltyGoalie == 1) {
          return redPlayer;
        }
      }
    case "blue":
      for (const bluePlayer of blueTeam) {
        if (bluePlayer.settings.goalie == 2 || bluePlayer.settings.penaltyGoalie == 2) {
          return bluePlayer;
        }
      }
  }
}
