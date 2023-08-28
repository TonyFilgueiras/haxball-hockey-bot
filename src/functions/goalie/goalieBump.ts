import { Colors, Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "../detectLastPlayerTouch";
import { blueTeam } from "../../players/blueTeam";
import { redTeam } from "../../players/redTeam";
import insideBlueBox from "../insideBlueBox";
import insideRedBox from "../insideRedBox";
import calculateTotalSpeed from "../math/calculateTotalSpeed"
import headingTowardsGoal from "../headingTowardsGoal";
import { setPenaltyBlue, setPenaltyRed } from "../penalty/penaltyDetected";
import { room } from "../../bot";

export default function goalieBump(player: Player) {
    const disc = room.discs[0]

    for (const redPlayer of redTeam) {
        const isCloseEnough = player.distanceTo(redPlayer) < 1 && player.id !== redPlayer.id;
        const isHeadingTowardsGoal = calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 && headingTowardsGoal(disc.x, disc.y, disc.xspeed, disc.yspeed, 1);
    
        if (player.team === 2 && (redPlayer.settings.goalie || redPlayer.settings.penaltyGoalie) && insideRedBox(redPlayer.x, redPlayer.y) && isCloseEnough && isHeadingTowardsGoal) {
            disc.xspeed = 0;
            disc.x = 130;
    
            if (!room.settings.disabledPenaltys && player.id !== room.settings.lastPlayerTouch) {
                room.pause();
                room.unpause();
                setPenaltyRed();
                room.send({ message: `Penalty by ${player.name}!`, color: Colors.CornflowerBlue, style: "bold" });
                room.send({ message: `O animal bateu no Goleiro adversário`, color: Colors.CornflowerBlue, style: "bold" });
            }
        }
    }
    for (const bluePlayer of blueTeam) {
        const isCloseEnough = player.distanceTo(bluePlayer) < 1 && player.id !== bluePlayer.id;
        const isHeadingTowardsGoal = calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 && headingTowardsGoal(disc.x, disc.y, disc.xspeed, disc.yspeed, 2);
    
        if (player.team === 1 && (bluePlayer.settings.goalie || bluePlayer.settings.penaltyGoalie) && insideBlueBox(bluePlayer.x, bluePlayer.y) && isCloseEnough && isHeadingTowardsGoal) {
            if (!room.settings.disabledPenaltys && player.id !== room.settings.lastPlayerTouch) {
                room.pause();
                room.unpause();
                disc.x = -130;
                disc.y = 0;
                disc.xspeed = 0;
                disc.yspeed = 0;
                setPenaltyBlue();
                room.send({ message: `Penalty by ${player.name}!`, color: Colors.Crimson, style: "bold" });
                room.send({ message: `O animal bateu no Goleiro adversário`, color: Colors.Crimson, style: "bold" });
            }
        }
    }
    
}