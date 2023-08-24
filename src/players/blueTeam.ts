import { Player, Room } from "haxball-extended-room"

export var blueTeam: Player[] = []

export function updateBlueTeamPlayers(room: Room): void {
    blueTeam = []
    for (const playerId in room.players.blue()) {
        const player = room.players.blue()[playerId];
        blueTeam.push(player)
    } 
}