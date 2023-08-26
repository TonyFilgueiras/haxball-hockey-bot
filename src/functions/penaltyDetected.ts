import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import { redTeam } from "../players/redTeam";
import { blueTeam } from "../players/blueTeam";
import checkForGoalieSetting from "./checkForGoaliesetting";

export default function penaltyDetected(player: Player, penalty: string, room: Room, team: number) {
    if (!room.settings.penalty && !room.settings.disabledPenaltys) {
        room.send({ message: `Penalty by ${player.name}!`, color: team == 1 ? Colors.Crimson : Colors.CornflowerBlue, style: "bold" })
        room.send({message: `${penalty}`, color: team == 1? Colors.Crimson : Colors.CornflowerBlue, style: "bold"})
    }
    
    
    room.settings.penalty = team;
    if (!room.settings.disabledPenaltys) {
        setTimeout(() => {
            if (room.settings.penalty === 2) {
                setPenaltyRed(room)
            } else if (room.settings.penalty === 1) {
                setPenaltyBlue(room)
            }

            room.settings.penalty = 0
        }, 2000)
    }
}

export function setPenaltyRed(room: Room) {
    room.settings.mode = "penred"
    const disc = room.discs[0]

    disc.x = 130
    disc.y = 0
    disc.xspeed = 0
    disc.yspeed = 0

    room.settings.penaltyTimer = 0
    
    for (let i = 0; i < redTeam.length; i++){
        redTeam[i].x = -70
        redTeam[i].y = (i - 2) * 50
    }
    if (checkForGoalieSetting(room.players.blue(), 2)) {
        for (let i = 0; i < blueTeam.length; i++){
            if (blueTeam[i].settings.goalie) {
                blueTeam[i].y = 0
                blueTeam[i].x = 666
                blueTeam[i].xspeed = 0
                blueTeam[i].yspeed = 0
            } else {
                blueTeam[i].y = 500
            }
        }
    } else {
        for (let i = 0; i < blueTeam.length; i++) { 
            blueTeam[i].y = 500           
        }
        const randomNumber = Math.floor(Math.random() * redTeam.length)
        blueTeam[randomNumber].x = 666
        blueTeam[randomNumber].y = 0
        blueTeam[randomNumber].xspeed = 0
        blueTeam[randomNumber].yspeed = 0
        blueTeam[randomNumber].settings.penaltyGoalie = 2
        blueTeam[randomNumber].setAvatar("🥊")
    }
}

export function setPenaltyBlue(room: Room) {
    room.settings.mode = 'penblue'
    const disc = room.discs[0]
    
    room.settings.penaltyTimer = 0
    disc.x = -130
    disc.y = 0
    disc.xspeed = 0
    disc.yspeed = 0
    
    for (let i = 0; i < blueTeam.length; i++) {
        blueTeam[i].x = 70
        blueTeam[i].y = (i - 2) * 50
    }
    if (checkForGoalieSetting(room.players.red(), 1)) {
        for (let i = 0; i < redTeam.length; i++) {
            if (redTeam[i].settings.goalie) {
                redTeam[i].y = 0
                redTeam[i].x = -666
                redTeam[i].xspeed = 0
                redTeam[i].yspeed = 0
            } else {
                redTeam[i].y = 500
            }
        }
    } else {
        for (let i = 0; i < redTeam.length; i++) {
            redTeam[i].y = 500
        }
        const randomNumber = Math.floor(Math.random() * redTeam.length)
        redTeam[randomNumber].x = -666
        redTeam[randomNumber].y = 0
        redTeam[randomNumber].xspeed = 0
        redTeam[randomNumber].yspeed = 0
        redTeam[randomNumber].settings.penaltyGoalie = 1
        redTeam[randomNumber].setAvatar("🥊")
    }
}