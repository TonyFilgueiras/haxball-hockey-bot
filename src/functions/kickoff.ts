import { Room } from "haxball-extended-room";
import { blueTeam, updateBlueTeamPlayers } from "../players/blueTeam";
import { redTeam, updateRedTeamPlayers } from "../players/redTeam";
import { room } from "../bot";

export default function kickoff() {
    let redPlayerSorted = 0
    let bluePlayerSorted = 0

    room.settings.mode = "game"
    room.settings.disabledPenaltys = false
    

    const disc = room.discs[0]
    disc.x = 0
    disc.y = 0
    disc.xspeed = 0
    disc.yspeed = 0

    while (redTeam.length > 0) {
        const randomIndex = Math.floor(Math.random() * redTeam.length);
        const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
        
        if (randomRedPlayer.settings.penaltyGoalie) {
            randomRedPlayer.setAvatar(randomRedPlayer.name.replace(/[^\w\s]/gi, '').slice(0, 2))
            randomRedPlayer.settings.penaltyGoalie = 0  
        }
        
        if (!randomRedPlayer.settings.goalie) {
            if (redPlayerSorted == 0) {
                randomRedPlayer.x = -40
                randomRedPlayer.y = 0
                randomRedPlayer.xspeed = 0
                randomRedPlayer.yspeed = 0
                
            } else if (redPlayerSorted == 1) {
                randomRedPlayer.x = -20
                randomRedPlayer.y = -150
                randomRedPlayer.xspeed = 0
                randomRedPlayer.yspeed = 0
                
            } else if (redPlayerSorted == 2) {
                randomRedPlayer.x = -20
                randomRedPlayer.y = 150
                randomRedPlayer.xspeed = 0
                randomRedPlayer.yspeed = 0
                
            } else if (redPlayerSorted == 3) {
                randomRedPlayer.x = -150
                randomRedPlayer.y = 0
                randomRedPlayer.xspeed = 0
                randomRedPlayer.yspeed = 0
                
            } else if (redPlayerSorted == 4) {
                randomRedPlayer.x = -600
                randomRedPlayer.y = 0
                randomRedPlayer.xspeed = 0
                randomRedPlayer.yspeed = 0
                
            }
            redPlayerSorted++
        } else {
            randomRedPlayer.x = -666
            randomRedPlayer.y = 0
            randomRedPlayer.xspeed = 0
            randomRedPlayer.yspeed = 0
        }
    }
    updateRedTeamPlayers()
    while (blueTeam.length > 0) {
        const randomIndex = Math.floor(Math.random() * blueTeam.length);
        const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
        
        if (randomBluePlayer.settings.penaltyGoalie) {
            randomBluePlayer.setAvatar(randomBluePlayer.name.replace(/[^\w\s]/gi, '').slice(0, 2))
            randomBluePlayer.settings.penaltyGoalie = 0  
        }

        if (!randomBluePlayer.settings.goalie) {
            if (bluePlayerSorted == 0) {
                randomBluePlayer.x = 40
                randomBluePlayer.y = 0
                randomBluePlayer.xspeed = 0
                randomBluePlayer.yspeed = 0
                
            } else if (bluePlayerSorted == 1) {
                randomBluePlayer.x = 20
                randomBluePlayer.y = 150
                randomBluePlayer.xspeed = 0
                randomBluePlayer.yspeed = 0
                
            } else if (bluePlayerSorted == 2) {
                randomBluePlayer.x = 20
                randomBluePlayer.y = -150
                randomBluePlayer.xspeed = 0
                randomBluePlayer.yspeed = 0
                
            } else if (bluePlayerSorted == 3) {
                randomBluePlayer.x = 150
                randomBluePlayer.y = 0
                randomBluePlayer.xspeed = 0
                randomBluePlayer.yspeed = 0
                
            } else if (bluePlayerSorted == 4) {
                randomBluePlayer.x = 600
                randomBluePlayer.y = 0
                randomBluePlayer.xspeed = 0
                randomBluePlayer.yspeed = 0
                
            }
            bluePlayerSorted++
        } else {
            randomBluePlayer.x = 666
            randomBluePlayer.y = 0
            randomBluePlayer.xspeed = 0
            randomBluePlayer.yspeed = 0
        }
    }
    updateBlueTeamPlayers()
}