import { ChatSounds, ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import { redTeam } from "../../players/redTeam";
import { blueTeam } from "../../players/blueTeam";
import checkForGoalieSetting from "../goalie/checkForGoaliesetting";
import { room } from "../../bot";
import setDiscPosition from "../setDiscPosition";

export default function penaltyDetected(player: Player, penalty: string, team: number) {
    if (!room.settings.penalty && !room.settings.disabledPenaltys) {
        room.send({ message: `Penalty by ${player.name}!`, color: team == 1 ? Colors.Crimson : Colors.CornflowerBlue, style: "bold", sound:2})
        room.send({message: `${penalty}`, color: team == 1? Colors.Crimson : Colors.CornflowerBlue, style: "bold"})
    }
    
    
    room.settings.penalty = team;
    if (!room.settings.disabledPenaltys) {
        setTimeout(() => {
            if (room.settings.penalty === 2) {
                setPenaltyRed()
            } else if (room.settings.penalty === 1) {
                setPenaltyBlue()
            }

            room.settings.penalty = 0
        }, 2000)
    }
}

export function setPenaltyRed() {
    try {
        room.settings.mode = "penred"
        const disc = room.discs[0]

    
        setDiscPosition(disc, 130, 0)       
        
        room.settings.penaltyKickers = 0
        room.settings.penaltyTakerTeam = 2
        room.settings.penaltyTakerId = 0
        room.settings.penaltyTimer = 0
        
        for (let i = 0; i < redTeam.length; i++){
            setDiscPosition(redTeam[i], -70, (i - 2) * 50) 
        }
        if (checkForGoalieSetting(room.players.blue(), 2)) {
            for (let i = 0; i < blueTeam.length; i++){
                if (blueTeam[i].settings.goalie) {
                    setDiscPosition(blueTeam[i], 666, 0) 
                } else {
                    blueTeam[i].y = 500
                }
            }
        } else {
            for (let i = 0; i < blueTeam.length; i++) { 
                blueTeam[i].y = 500           
            }
            const randomNumber = Math.floor(Math.random() * blueTeam.length)
            setDiscPosition(blueTeam[randomNumber], 666, 0) 
            blueTeam[randomNumber].settings.penaltyGoalie = 2
            blueTeam[randomNumber].setAvatar("🥊")
        }
    } catch(error) {
        console.log(error)
    }

}

export function setPenaltyBlue() {
    try {
        room.settings.mode = 'penblue'
        const disc = room.discs[0]

        room.settings.penaltyKickers = 0
        room.settings.penaltyTakerTeam = 1
        room.settings.penaltyTakerId = 0
        room.settings.penaltyTimer = 0

        setDiscPosition(disc, -130, 0) 
        
        for (let i = 0; i < blueTeam.length; i++) {
            setDiscPosition(blueTeam[i], 70, (i - 2) * 50) 
        }
        if (checkForGoalieSetting(room.players.red(), 1)) {
            for (let i = 0; i < redTeam.length; i++) {
                if (redTeam[i].settings.goalie) {
                    setDiscPosition(redTeam[i], -666, 0) 
                } else {
                    redTeam[i].y = 500
                }
            }
        } else {
            for (let i = 0; i < redTeam.length; i++) {
                redTeam[i].y = 500
            }
            const randomNumber = Math.floor(Math.random() * redTeam.length)
            setDiscPosition(redTeam[randomNumber], -666, 0) 
            redTeam[randomNumber].settings.penaltyGoalie = 1
            redTeam[randomNumber].setAvatar("🥊")
        }
        
    } catch (error) {
        console.log(error)
    }
}