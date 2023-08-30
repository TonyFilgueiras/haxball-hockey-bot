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
    const bluePlayers = blueTeam.filter((p) => p.settings.goalie === 0)
  
    if (bluePlayers.length === 0) {
      return null; // No blue players found
    }
  
    const randomIndex = Math.floor(Math.random() * bluePlayers.length);
    return bluePlayers[randomIndex];
  }
    