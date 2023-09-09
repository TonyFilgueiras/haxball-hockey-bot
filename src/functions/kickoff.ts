import { Room } from "haxball-extended-room";
import { blueTeam, updateBlueTeamPlayers } from "../players/blueTeam";
import { redTeam, updateRedTeamPlayers } from "../players/redTeam";
import { room } from "../bot";
import setDiscPosition from "./setDiscPosition";

export default function kickoff() {
    let redPlayerSorted = 0
    let bluePlayerSorted = 0

    room.settings.mode = "game"
    room.settings.disabledPenaltys = false
    room.settings.lastTeamTouch = 0
    room.settings.penaltyKickerReleased = false
    room.settings.penaltyKickers = 0
    room.settings.penaltyTimer = 0
    room.settings.penaltyDetected = 0
    room.settings.playerBumpedBlueGoalie = 0
    room.settings.playerBumpedRedGoalie = 0


    const disc = room.discs[0]
    disc.color = 0
    setDiscPosition(disc, 0, 0)

    while (redTeam.length > 0) {
        const randomIndex = Math.floor(Math.random() * redTeam.length);
        const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
        
        if (randomRedPlayer.settings.penaltyGoalie) {
            randomRedPlayer.setAvatar(randomRedPlayer.name.replace(/[^\w\s]/gi, '').slice(0, 2))
            randomRedPlayer.settings.penaltyGoalie = 0  
        }
        
        if (!randomRedPlayer.settings.goalie) {
            if (redPlayerSorted == 0) {
                setDiscPosition(randomRedPlayer, -40, 1)
            } else if (redPlayerSorted == 1) {
                setDiscPosition(randomRedPlayer, -20, -150)
                
            } else if (redPlayerSorted == 2) {
                setDiscPosition(randomRedPlayer, -20, 150)                
            } else if (redPlayerSorted == 3) {
                setDiscPosition(randomRedPlayer, -150, 0)                
            } else if (redPlayerSorted == 4) {
                setDiscPosition(randomRedPlayer, -600, 0)
            }
            redPlayerSorted++
        } else {
            setDiscPosition(randomRedPlayer, -666, 0)
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
                setDiscPosition(randomBluePlayer, 40, -1)               
            } else if (bluePlayerSorted == 1) {
                setDiscPosition(randomBluePlayer, 20, 150)               
            } else if (bluePlayerSorted == 2) {
                setDiscPosition(randomBluePlayer, 20, -150)                              
            } else if (bluePlayerSorted == 3) {
                setDiscPosition(randomBluePlayer, 150, 0)                               
            } else if (bluePlayerSorted == 4) {
                setDiscPosition(randomBluePlayer, 600, 0)               
            }
            bluePlayerSorted++
        } else {
            setDiscPosition(randomBluePlayer, 666, 0)               
        }
    }
    updateBlueTeamPlayers()
}