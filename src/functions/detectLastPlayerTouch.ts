import { Player, Room } from "haxball-extended-room"
import { room } from "../bot"

export default function detectLastTouch(player: Player) {
    room.settings.lastTeamTouch = player.team
    room.settings.lastPlayerTouch = player.id
}