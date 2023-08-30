import { Player, Room } from "haxball-extended-room"
import { room } from "../bot";

export var blueTeam: Player[] = []

export function updateBlueTeamPlayers(): void {
    blueTeam = []
    for (const playerId in room.players.blue()) {
        const player = room.players.blue()[playerId];
        blueTeam.push(player)
    } 
}

export function pickRandomBluePlayer(): Player | null {
  
    if (blueTeam.length === 0) {
      return null; // No blue players found
    }
  
    const randomIndex = Math.floor(Math.random() * blueTeam.length);
    return blueTeam[randomIndex];
  }
    