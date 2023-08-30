import { Player, Room } from "haxball-extended-room"
import { playersList } from "./players";
import { room } from "../bot";

export var redTeam: Player[] = []

export function updateRedTeamPlayers(): void {
    redTeam = []
    for (const playerId in room.players.red()) {
        const player = room.players.red()[playerId];
        redTeam.push(player)
    } 
}

export function pickRandomRedPlayer(): Player | null {
    
    if (redTeam.length === 0) {
      return null; // No red players found
    }
  
    const randomIndex = Math.floor(Math.random() * redTeam.length);
    return redTeam[randomIndex];
  }
    