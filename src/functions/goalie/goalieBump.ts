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
import getGoalie from "./getGoalie";

let goalieBumpTimeout: NodeJS.Timeout = null;

export default function goalieBump(player: Player, goalieTeam: "red" | "blue") {
  const disc = room.discs[0];

  switch (goalieTeam) {
    case "red":
      const redGoalie = getGoalie("red");
      if (redGoalie) {
        const goalieBumped =
          player.distanceTo(redGoalie) < 0.1 &&
          calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 &&
          player.team === 2 &&
          insideRedBox(redGoalie.x, redGoalie.y);

        const isHeadingTowardsGoal = headingTowardsGoal(disc.x, disc.y, disc.xspeed, disc.yspeed, 1);

        if (goalieBumped) {
          room.settings.playerBumpedRedGoalie = player.id;
          if (goalieBumpTimeout) {
            clearTimeout(goalieBumpTimeout); // Clear the existing timeout
          }

          goalieBumpTimeout = setTimeout(() => {
            room.settings.playerBumpedRedGoalie = 0;
            goalieBumpTimeout = null; // Reset the timer reference
          }, 500);
        }

        if (isHeadingTowardsGoal && player.id === room.settings.playerBumpedRedGoalie) {
          if (!room.settings.disabledPenaltys && player.id !== room.settings.lastPlayerTouch && redGoalie?.id !== room.settings.lastPlayerTouch) {
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
      const blueGoalie = getGoalie("blue");
      if (blueGoalie) {
        const goalieBumped =
          player.distanceTo(blueGoalie) < 0.1 &&
          calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 &&
          player.team === 1 &&
          insideBlueBox(blueGoalie.x, blueGoalie.y);

        const isHeadingTowardsGoal = headingTowardsGoal(disc.x, disc.y, disc.xspeed, disc.yspeed, 2);

        if (goalieBumped) {
          console.log(blueGoalie);
          room.settings.playerBumpedBlueGoalie = player.id;
          if (goalieBumpTimeout) {
            clearTimeout(goalieBumpTimeout); // Clear the existing timeout
          }

          goalieBumpTimeout = setTimeout(() => {
            room.settings.playerBumpedBlueGoalie = 0;
            goalieBumpTimeout = null; // Reset the timer reference
          }, 500);
        }

        if (isHeadingTowardsGoal && player.id === room.settings.playerBumpedBlueGoalie) {
          if (!room.settings.disabledPenaltys && player.id !== room.settings.lastPlayerTouch && blueGoalie?.id !== room.settings.lastPlayerTouch) {
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
