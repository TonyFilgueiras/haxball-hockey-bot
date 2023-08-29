import { Player, Room } from "haxball-extended-room"
import { room } from "../bot"

export default function detectLastTouch(player: Player, penaltyMode: boolean = false) {
    room.settings.lastTeamTouch = player.team
    room.settings.lastPlayerTouch = player.id
    if (penaltyMode) {
        room.settings.penaltyTakerId = player.id
        room.settings.penaltyTakerTeam = player.team
    }
    player.team === 1 ? room.discs[0].color = 5570560 : room.discs[0].color = 85
}