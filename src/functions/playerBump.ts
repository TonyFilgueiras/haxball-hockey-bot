import { Colors, Player, Room } from "haxball-extended-room";
import detectLastPlayerTouch from "./detectLastPlayerTouch";
import { blueTeam } from "../players/blueTeam";
import { redTeam } from "../players/redTeam";
import insideBlueBox from "./insideBlueBox";
import insideRedBox from "./insideRedBox";
import calculateTotalSpeed from "./calculateTotalSpeed"
import headingTowardsGoal from "./headingTowardsGoal";
import penaltyDetected, { setPenaltyBlue, setPenaltyRed } from "./penaltyDetected";
import { room } from "../bot";

export default function playerBump(player: Player) {
    const disc = room.discs[0]

    for (let i = 0; i < redTeam.length; i++) {
        if (player.distanceTo(redTeam[i]) < 1 && player.id !== redTeam[i].id) {
            if (player.team === 2) {
                if (redTeam[i].settings.goalie || redTeam[i].settings.penaltyGoalie) {
                    if (insideRedBox(redTeam[i].x, redTeam[i].y)) {
                        if (calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 && headingTowardsGoal(disc.x, disc.y, disc.xspeed, disc.yspeed, 1)) {
                            disc.xspeed = 0
                            disc.x = 130
                            if (!room.settings.disabledPenaltys && player.id !== room.settings.lastPlayerTouch) {
                                room.pause()
                                room.unpause()
                                setPenaltyRed()
                                room.send({ message: `Penalty by ${player.name}!`,color : Colors.CornflowerBlue, style: "bold" })
                                room.send({message: `O animal bateu no Goleiro adversário`, color: Colors.CornflowerBlue, style: "bold"})
                            }
                        }
                    }
                }
            }
        }
    }
    for (let i = 0; i < blueTeam.length; i++) {
        if (player.distanceTo(blueTeam[i]) < 1 && player.id !== blueTeam[i].id) {
            if (player.team === 1) {
                if (blueTeam[i].settings.goalie || blueTeam[i].settings.penaltyGoalie) {
                    if (insideBlueBox(blueTeam[i].x, blueTeam[i].y)) {
                        if (calculateTotalSpeed(player.xspeed, player.yspeed) >= 0.2 && headingTowardsGoal(disc.x, disc.y, disc.xspeed, disc.yspeed, 2)) {
                            if (!room.settings.disabledPenaltys && player.id !== room.settings.lastPlayerTouch) {
                                room.pause()
                                room.unpause()
                                disc.x = -130
                                disc.y = 0
                                disc.xspeed = 0
                                disc.yspeed = 0
                                setPenaltyBlue()
                                room.send({ message: `Penalty by ${player.name}!`, color: Colors.Crimson, style: "bold" })
                                room.send({ message: `O animal bateu no Goleiro adversário`, color: Colors.Crimson, style: "bold" })
                            }
                        }
                    }
                }
            }
        }
    }
}