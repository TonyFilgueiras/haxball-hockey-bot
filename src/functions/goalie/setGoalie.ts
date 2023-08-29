import { Colors, Player } from "haxball-extended-room"
import { room } from "../../bot"
import setDiscPosition from "../setDiscPosition"

export default function setGoalie(player: Player) {
    var goalieTeam: 0 | 1 | 2 = 0
    var discPosition = 0

    player.team === 1 ? goalieTeam = 1 : goalieTeam = 2
    player.team === 1 ? discPosition = -666 : discPosition = 666

    player.settings.goalie = goalieTeam
    player.setAvatar("🧤")
    player.reply({ message: "Para remover a posição de goalie digite !li", color: player.team === 1 ? Colors.HotPink : Colors.DodgerBlue })
    player.reply({ message: "Voce só pode tocar na bola na:", color: player.team === 1 ? Colors.HotPink : Colors.DodgerBlue})
    player.reply({ message: "-       Zona ofensiva", color: player.team === 1 ? Colors.HotPink : Colors.DodgerBlue})
    player.reply({ message: "-       Zona atras do gol", color: player.team === 1 ? Colors.HotPink : Colors.DodgerBlue})
    player.reply({ message: "-       Ou quando um companheiro de equipe tocar por ultimo",  color: player.team === 1 ? Colors.HotPink : Colors.DodgerBlue})
    room.send({ message: `${player.name} é o Goalie do Red`, color: player.team === 1 ? Colors.Crimson : Colors.CornflowerBlue })
    if (room.scores.time < 2) {
        setDiscPosition(player, discPosition, 0)
    }
}