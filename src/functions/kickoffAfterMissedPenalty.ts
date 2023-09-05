import { Colors } from "haxball-extended-room";
import { redTeam, updateRedTeamPlayers } from "../players/redTeam";
import { blueTeam, updateBlueTeamPlayers } from "../players/blueTeam";
import { room } from "../bot";
import setDiscPosition from "./setDiscPosition";

export default function kickoffAfterMissedPenalty(xAxis: 500 | -500, reasonMissedPenalty?: string, afterPenalty: boolean = true) {
    try {
        let redPlayerSorted = 0
        let bluePlayerSorted = 0
        
        room.settings.lastTeamTouch = 0
        room.settings.disabledPenaltys = false
        room.settings.penaltyKickers = 0
        room.settings.penaltyTimer = 0
        room.settings.penaltyKickerReleased = false
        room.settings.penaltyDetected = 0
        room.settings.playerBumpedBlueGoalie = 0
        room.settings.playerBumpedRedGoalie = 0
    
        room.settings.mode = "game"
        room.pause()
        if (afterPenalty) {
            room.send({ message: "Penalty perdido!", color: xAxis > 0 ? Colors.Crimson : Colors.CornflowerBlue, sound: 2, style: "bold" })
            room.send({ message: `${reasonMissedPenalty}`, color: xAxis > 0 ? Colors.Crimson : Colors.CornflowerBlue , sound: 2, style: "bold"})
        }
        room.unpause()
        
        function getRandom1OrMinus1(): 1 | -1 {
            return Math.random() >= 0.5 ? 1 : -1;
        }
        
        const topOrBottom = getRandom1OrMinus1();
    
const disc = room.discs[0]
        disc.color = 0
        switch (xAxis) {
            case 500: 
                setDiscPosition(disc, 500, 210 * topOrBottom)
                
                while (redTeam.length > 0) {
                    const randomIndex = Math.floor(Math.random() * redTeam.length);
                    const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
                    
                    
                    if (!randomRedPlayer.settings.goalie) {
                        if (redPlayerSorted == 0) {
                            setDiscPosition(randomRedPlayer, 460, 210 * topOrBottom)                            
                        } else if (redPlayerSorted == 1) {
                            setDiscPosition(randomRedPlayer, 390, 100 * topOrBottom)                                                        
                        } else if (redPlayerSorted == 2) {
                            setDiscPosition(randomRedPlayer, 380, 310 * topOrBottom)                                                        
                        } else if (redPlayerSorted == 3) {
                            setDiscPosition(randomRedPlayer, 220, 210 * topOrBottom)                            
                        } else if (redPlayerSorted == 4) {
                            setDiscPosition(randomRedPlayer, 0, 130 * topOrBottom)                                                        
                        }
                        redPlayerSorted++
                    } else {
                        setDiscPosition(randomRedPlayer, 0, 130 * topOrBottom)                            
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
                            setDiscPosition(randomBluePlayer, 540, 210 * topOrBottom)                            
                        } else if (bluePlayerSorted == 1) {
                            setDiscPosition(randomBluePlayer, 610, 100 * topOrBottom)                                                        
                        } else if (bluePlayerSorted == 2) {
                            setDiscPosition(randomBluePlayer, 620, 310 * topOrBottom)                            
                        } else if (bluePlayerSorted == 3) {
                            setDiscPosition(randomBluePlayer, 510, 50 * topOrBottom)                            
                        } else if (bluePlayerSorted == 4) {
                            setDiscPosition(randomBluePlayer, 640, 130 * topOrBottom)                            
                        }
                        bluePlayerSorted++
                    } else {
                        setDiscPosition(randomBluePlayer, 670, 55 * topOrBottom)                            
                    }
                }
                updateBlueTeamPlayers()
                break
            case -500:
                setDiscPosition(disc, -500, 210 * topOrBottom)
    
                while (blueTeam.length > 0) {
                    const randomIndex = Math.floor(Math.random() * blueTeam.length);
                    const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
                    
                    
                    if (!randomBluePlayer.settings.goalie) {
                        if (bluePlayerSorted == 0) {
                            setDiscPosition(randomBluePlayer, -460, 210 * topOrBottom)                            
                        } else if (bluePlayerSorted == 1) {
                            setDiscPosition(randomBluePlayer, -390, 100 * topOrBottom)                                                        
                        } else if (bluePlayerSorted == 2) {
                            setDiscPosition(randomBluePlayer, -380, 310 * topOrBottom)                                                        
                        } else if (bluePlayerSorted == 3) {
                            setDiscPosition(randomBluePlayer, -220, 210 * topOrBottom)                            
                        } else if (bluePlayerSorted == 4) {
                            setDiscPosition(randomBluePlayer, 0, 130 * topOrBottom)                                                        
                        }
                        bluePlayerSorted++
                    } else {
                        setDiscPosition(randomBluePlayer, 0, 130 * topOrBottom) 
                    }
                }
                updateBlueTeamPlayers()
                while (redTeam.length > 0) {
                    const randomIndex = Math.floor(Math.random() * redTeam.length);
                    const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
                   
                    if (randomRedPlayer.settings.penaltyGoalie) {
                        randomRedPlayer.settings.penaltyGoalie = 0
                        randomRedPlayer.setAvatar(randomRedPlayer.name.replace(/[^\w\s]/gi, '').slice(0, 2))
                    }
    
                    
                    if (!randomRedPlayer.settings.goalie) {
                        if (redPlayerSorted == 0) {
                            setDiscPosition(randomRedPlayer, -540, 210 * topOrBottom)                            
                        } else if (redPlayerSorted == 1) {
                            setDiscPosition(randomRedPlayer, -610, 100 * topOrBottom)                                                        
                        } else if (redPlayerSorted == 2) {
                            setDiscPosition(randomRedPlayer, -620, 310 * topOrBottom)                            
                        } else if (redPlayerSorted == 3) {
                            setDiscPosition(randomRedPlayer, -510, 50 * topOrBottom)                            
                        } else if (redPlayerSorted == 4) {
                            setDiscPosition(randomRedPlayer, -640, 130 * topOrBottom)                            
                        }
                        redPlayerSorted++
                    } else {
                        setDiscPosition(randomRedPlayer, -670, 55 * topOrBottom) 
                    }
                }
                updateRedTeamPlayers()
                break
        }
        
    } catch (error) {
        console.log(error)
    }
}