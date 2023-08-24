import { Player, Room } from "haxball-extended-room"
import { playersList } from "./players";

export var redTeam: Player[] = []

export function updateRedTeamPlayers(room: Room): void {
    redTeam = []
    for (const playerId in room.players.red()) {
        const player = room.players.red()[playerId];
        redTeam.push(player)
    } 
}