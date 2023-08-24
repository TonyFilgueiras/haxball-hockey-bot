import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import { redTeam } from "../players/redTeam";
import { blueTeam } from "../players/blueTeam";
import checkForGoalieSetting from "./checkForGoaliesetting";

export default function penaltyDetected(player: Player, penalty: string, room: Room, team: number) {
    if (!room.settings.penalty) {
        room.send({ message: `Penalty by ${player.name}!`, color: team == 1 ? Colors.Red : Colors.Blue, style: "bold" })
        room.send({message: `${penalty}`, color: team == 1? Colors.Red : Colors.Blue, style: "bold"})
    }
    
    
    room.settings.penalty = team;
    setTimeout(() => {
        if (room.settings.penalty === 2) {
            setPenaltyRed(room)
        } else if (room.settings.penalty === 1) {
            setPenaltyBlue(room)
        }

        room.settings.penalty = ""
    }, 2000)
}

export function setPenaltyRed(room: Room) {
    room.settings.mode = "penred"
    const disc = room.discs[0]

    disc.x = 130
    disc.y = 0
    disc.xspeed = 0
    disc.yspeed = 0
    
    for (let i = 0; i < redTeam.length; i++){
        redTeam[i].x = -70
        redTeam[i].y = (i - 2) * 10
    }
    if (checkForGoalieSetting(room.players.blue(), 2)) {
        for (let i = 0; i < blueTeam.length; i++){
            if (blueTeam[i].settings.goalie) {
                blueTeam[i].y = 0
                blueTeam[i].x = 666
            } else {
                blueTeam[i].y = 480
                blueTeam[i].x = 0
            }
        }
    } else {
        for (let i = 0; i < blueTeam.length; i++) { 
            blueTeam[i].y = 480
            blueTeam[i].x = 0            
        }
        const randomNumber = Math.floor(Math.random() * redTeam.length)
        blueTeam[randomNumber].x = 666
        blueTeam[randomNumber].y = 0
    }
}

export function setPenaltyBlue(room: Room) {
    room.settings.mode = 'penblue'
    const disc = room.discs[0]

    disc.x = -130
    disc.y = 0
    disc.xspeed = 0
    disc.yspeed = 0

    for (let i = 0; i < blueTeam.length; i++){
        blueTeam[i].x = 70
        blueTeam[i].y = (i - 2) * 10
    }
    if (checkForGoalieSetting(room.players.red(), 1)) {
        for (let i = 0; i < redTeam.length; i++){
            if (redTeam[i].settings.goalie) {
                redTeam[i].y = 0
                redTeam[i].x = -666
            } else {
                redTeam[i].y = 480
                redTeam[i].x = 0
            }
        }
    } else {
        for (let i = 0; i < redTeam.length; i++) { 
            redTeam[i].y = 480
            redTeam[i].x = 0           
        }
        const randomNumber = Math.floor(Math.random() * redTeam.length)
        redTeam[randomNumber].x = -666
        redTeam[randomNumber].y = 0
    }
}