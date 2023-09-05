import { PlayerList } from "haxball-extended-room";

export default function checkForGoalieSetting(players: PlayerList, teamId: number): boolean {
    for (const playerId in players) {
        const player = players[playerId];
            if (player.settings && player.settings.goalie === teamId) {
                return true; // Found a player with goalie setting
            }
    }
    return false; // No player with goalie setting found
}