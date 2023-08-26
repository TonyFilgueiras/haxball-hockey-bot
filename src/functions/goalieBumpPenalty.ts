import { Player, Room } from "haxball-extended-room";
import { redTeam } from "../players/redTeam";
import { blueTeam } from "../players/blueTeam";
import insideRedBox from "./insideRedBox";
import insideBlueBox from "./insideBlueBox";

export default function goalieBumpPenalty(player: Player, room: Room): void {
    for (let i = 0; i < redTeam.length; i++){
        if (player.collidingWith(redTeam[i])) {
            console.log("cheguei no colide")
            if (player.team === 2) {
                console.log("cheguei no time")
                if (redTeam[i].settings.goalie || redTeam[i].settings.penaltyGoalie) {
                    console.log("bateu no gk")
                    if (insideRedBox(redTeam[i].x, redTeam[i].y)) {
                        room.send({message: "Goalie bumped by a player in the Blue Team"});
                    }
                }
            }
        }
    }
    for (let i = 0; i < blueTeam.length; i++){
        if (player.collidingWith(blueTeam[i])) {
            console.log("cheguei no colide")
            if (player.team === 1) {
                console.log("cheguei no time")
                if (blueTeam[i].settings.goalie || blueTeam[i].settings.penaltyGoalie) {
                    console.log("bateu no gk")
                    if (insideBlueBox(blueTeam[i].x, blueTeam[i].y)) {
                        room.send({message: "Goalie bumped by a player in the Red Team"});
                    }
                }
            }
        }
    }
}