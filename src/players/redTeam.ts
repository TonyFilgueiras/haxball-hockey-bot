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
    const redPlayers = redTeam.filter((p) => p.settings.goalie === 0)
    
    if (redPlayers.length === 0) {
      return null; // No red players found
    }
  
    const randomIndex = Math.floor(Math.random() * redPlayers.length);
    return redPlayers[randomIndex];
  }
    