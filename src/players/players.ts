import { Player } from "haxball-extended-room"

export var playersList: Player[] = []

export function removePlayer(id: number) {
    playersList = playersList.filter(item => item.id !== id);
}