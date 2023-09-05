import { Colors, Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "../detectLastPlayerTouch";
import { blueTeam } from "../../players/blueTeam";
import { redTeam } from "../../players/redTeam";
import insideBlueBox from "../insideBlueBox";
import insideRedBox from "../insideRedBox";
import calculateTotalSpeed from "../math/calculateTotalSpeed";
import headingTowardsGoal from "../headingTowardsGoal";
import { setPenaltyBlue, setPenaltyRed } from "../penalty/penaltyDetected";
import { room } from "../../bot";

let goalieBumpTimeout: NodeJS.Timeout = null;

export default function goalieBump(player: Player, goalieTeam: "red" | "blue") {
  const disc = room.discs[0];

  switch (goalieTeam) {
    case "red":
      for (const redPlayer of redTeam) {
        const redGoalie = redTeam.filter((p) => {
          p.settings.goalie == 1 || p.settings.penaltyGoalie == 1;
        });
        const goalieBumped =
          player.distanceTo(redPlayer) < 0.1 &&
          player.id !== redPlayer.id &&
          calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 &&
          player.team === 2 &&
          (redPlayer.settings.goalie || redPlayer.settings.penaltyGoalie) &&
          insideRedBox(redPlayer.x, redPlayer.y);


        const isHeadingTowardsGoal = headingTowardsGoal(
          disc.x,
          disc.y,
          disc.xspeed,
          disc.yspeed,
          1
        );

        if (goalieBumped) {
          room.settings.playerBumpedRedGoalie = player.id;
          if (goalieBumpTimeout) {
            clearTimeout(goalieBumpTimeout); // Clear the existing timeout
          }

          goalieBumpTimeout = setTimeout(() => {
            room.settings.playerBumpedRedGoalie = 0;
            goalieBumpTimeout = null; // Reset the timer reference
          }, 1000);
        }

        if (
          isHeadingTowardsGoal &&
          player.id === room.settings.playerBumpedRedGoalie
        ) {
          if (
            !room.settings.disabledPenaltys &&
            player.id !== room.settings.lastPlayerTouch &&
            redGoalie[0]?.id !== room.settings.lastPlayerTouch
          ) {
            clearTimeout(goalieBumpTimeout); // Clear the existing timeout
            room.settings.playerBumpedRedGoalie = 0;
            room.settings.disabledPenaltys = true;
            room.pause();
            room.unpause();
            setPenaltyRed();
            room.send({
              message: `Penalty by ${player.name}!`,
              color: Colors.CornflowerBlue,
              style: "bold",
            });
            room.send({
              message: `O animal bateu no Goleiro adversário`,
              color: Colors.CornflowerBlue,
              style: "bold",
            });
          }
        }
      }
      break;
    case "blue":
      for (const bluePlayer of blueTeam) {
        const blueGoalie = blueTeam.filter((p) => {
          player.settings.goalie == 2 || p.settings.penaltyGoalie == 2;
        });
        const goalieBumped =
          player.distanceTo(bluePlayer) < 0.1 &&
          player.id !== bluePlayer.id &&
          calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 &&
          player.team === 1 &&
          ( bluePlayer.settings.goalie || bluePlayer.settings.penaltyGoalie) &&
          insideBlueBox(bluePlayer.x, bluePlayer.y);
          
        const isHeadingTowardsGoal = headingTowardsGoal(
          disc.x,
          disc.y,
          disc.xspeed,
          disc.yspeed,
          2
        );

        if (goalieBumped) {
          room.settings.playerBumpedBlueGoalie = player.id;
          if (goalieBumpTimeout) {
            clearTimeout(goalieBumpTimeout); // Clear the existing timeout
          }

          goalieBumpTimeout = setTimeout(() => {
            room.settings.playerBumpedBlueGoalie = 0;
            goalieBumpTimeout = null; // Reset the timer reference
          }, 1000);
        }

        if (
          isHeadingTowardsGoal &&
          player.id === room.settings.playerBumpedBlueGoalie
        ) {
          if (
            !room.settings.disabledPenaltys &&
            player.id !== room.settings.lastPlayerTouch &&
            blueGoalie[0]?.id !== room.settings.lastPlayerTouch
          ) {
            clearTimeout(goalieBumpTimeout); // Clear the existing timeout
            room.settings.playerBumpedBlueGoalie = 0;
            room.settings.disabledPenaltys = true;
            room.pause();
            room.unpause();
            setPenaltyBlue();
            room.send({
              message: `Penalty by ${player.name}!`,
              color: Colors.Crimson,
              style: "bold",
            });
            room.send({
              message: `O animal bateu no Goleiro adversário`,
              color: Colors.Crimson,
              style: "bold",
            });
          }
        }
      }
      break;
  }
}
