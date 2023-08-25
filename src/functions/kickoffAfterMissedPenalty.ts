import { Colors, Room } from "haxball-extended-room";
import { redTeam, updateRedTeamPlayers } from "../players/redTeam";
import { blueTeam, updateBlueTeamPlayers } from "../players/blueTeam";

export default function kickoffAfterMissedPenalty(xAxis: 500 | -500, room : Room) {
    let redPlayerSorted = 0
    let bluePlayerSorted = 0

    room.settings.mode = "game"
    room.pause()
    room.send({ message: "Penalty perdido!", color: xAxis > 0 ? Colors.Crimson : Colors.CornflowerBlue })
    room.unpause()
    
    function getRandom1OrMinus1(): 1 | -1 {
        return Math.random() >= 0.5 ? 1 : -1;
    }
    
    const topOrBottom = getRandom1OrMinus1();

    const disc = room.discs[0]
    switch (xAxis) {
        case 500: 
        disc.x = 500
        disc.y = 210 * topOrBottom
        disc.xspeed = 0
        disc.yspeed = 0
        
        while (redTeam.length > 0) {
                const randomIndex = Math.floor(Math.random() * redTeam.length);
                const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
                
                
                if (!randomRedPlayer.settings.goalie) {
                    if (redPlayerSorted == 0) {
                        randomRedPlayer.x = 460
                        randomRedPlayer.y = 210 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 1) {
                        randomRedPlayer.x = 390
                        randomRedPlayer.y = 100 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 2) {
                        randomRedPlayer.x = 380
                        randomRedPlayer.y = 310 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 3) {
                        randomRedPlayer.x = 220
                        randomRedPlayer.y = 210 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 4) {
                        randomRedPlayer.x = 0
                        randomRedPlayer.y = 130 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    }
                    redPlayerSorted++
                } else {
                    randomRedPlayer.x = 0
                    randomRedPlayer.y = 130 * topOrBottom
                    randomRedPlayer.xspeed = 0
                    randomRedPlayer.yspeed = 0
                }
            }
            updateRedTeamPlayers(room)
            while (blueTeam.length > 0) {
                const randomIndex = Math.floor(Math.random() * blueTeam.length);
                const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
                
                if (randomBluePlayer.settings.penaltyGoalie) {
                    randomBluePlayer.clearAvatar()
                    randomBluePlayer.settings.penaltyGoalie = 0  
                }
                
                if (!randomBluePlayer.settings.goalie) {
                    if (bluePlayerSorted == 0) {
                        randomBluePlayer.x = 540
                        randomBluePlayer.y = 210 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 1) {
                        randomBluePlayer.x = 610
                        randomBluePlayer.y = 100 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 2) {
                        randomBluePlayer.x = 620
                        randomBluePlayer.y = 310 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 3) {
                        randomBluePlayer.x = 510
                        randomBluePlayer.y = 50 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 4) {
                        randomBluePlayer.x = 640
                        randomBluePlayer.y = 130 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    }
                    bluePlayerSorted++
                } else {
                    randomBluePlayer.x = 670
                    randomBluePlayer.y = 55 * topOrBottom
                    randomBluePlayer.xspeed = 0
                    randomBluePlayer.yspeed = 0
                }
            }
            updateBlueTeamPlayers(room)
            break
        case -500:
            disc.x = -500
            disc.y = 210 * topOrBottom
            disc.xspeed = 0
            disc.yspeed = 0

            while (blueTeam.length > 0) {
                const randomIndex = Math.floor(Math.random() * blueTeam.length);
                const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
                
                
                if (!randomBluePlayer.settings.goalie) {
                    if (bluePlayerSorted == 0) {
                        randomBluePlayer.x = -460
                        randomBluePlayer.y = 210 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 1) {
                        randomBluePlayer.x = -390
                        randomBluePlayer.y = 100 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 2) {
                        randomBluePlayer.x = -380
                        randomBluePlayer.y = 310 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 3) {
                        randomBluePlayer.x = -220
                        randomBluePlayer.y = 210 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    } else if (bluePlayerSorted == 4) {
                        randomBluePlayer.x = 0
                        randomBluePlayer.y = 130 * topOrBottom
                        randomBluePlayer.xspeed = 0
                        randomBluePlayer.yspeed = 0
                        
                    }
                    bluePlayerSorted++
                } else {
                    randomBluePlayer.x = 0
                    randomBluePlayer.y = 130 * topOrBottom
                    randomBluePlayer.xspeed = 0
                    randomBluePlayer.yspeed = 0
                }
            }
            updateBlueTeamPlayers(room)
            while (redTeam.length > 0) {
                const randomIndex = Math.floor(Math.random() * redTeam.length);
                const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player
               
                if (randomRedPlayer.settings.penaltyGoalie) {
                    randomRedPlayer.settings.penaltyGoalie = 0
                    randomRedPlayer.clearAvatar()
                }

                
                if (!randomRedPlayer.settings.goalie) {
                    if (redPlayerSorted == 0) {
                        randomRedPlayer.x = -540
                        randomRedPlayer.y = 210 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 1) {
                        randomRedPlayer.x = -610
                        randomRedPlayer.y = 100 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 2) {
                        randomRedPlayer.x = -620
                        randomRedPlayer.y = 310 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 3) {
                        randomRedPlayer.x = -510
                        randomRedPlayer.y = 50 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    } else if (redPlayerSorted == 4) {
                        randomRedPlayer.x = -640
                        randomRedPlayer.y = 130 * topOrBottom
                        randomRedPlayer.xspeed = 0
                        randomRedPlayer.yspeed = 0
                        
                    }
                    redPlayerSorted++
                } else {
                    randomRedPlayer.x = -670
                    randomRedPlayer.y = 55 * topOrBottom
                    randomRedPlayer.xspeed = 0
                    randomRedPlayer.yspeed = 0
                }
            }
            updateRedTeamPlayers(room)
            break
    }
}