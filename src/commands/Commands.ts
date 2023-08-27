import { Colors, Player, PlayerList, Room } from "haxball-extended-room";
import checkForGoalieSetting from "../functions/checkForGoaliesetting";
import penaltyDetected, { setPenaltyBlue, setPenaltyRed } from "../functions/penaltyDetected";
import kickoffAfterMissedPenalty from "../functions/kickoffAfterMissedPenalty";
import kickoff from "../functions/kickoff";
import { room } from "../bot";

export default function readCommand(message: string, player: Player) {
    switch (message.toLowerCase()) {
        case "!go":
        case "!gk":
        case "!goalie":
            if (player.team == 1) {
                var redHasGoalie = checkForGoalieSetting(room.players.red(), 1)
                if (redHasGoalie) {
                    player.reply({message: "Ja tem goleiro no Red", color: Colors.HotPink} )
                } else {
                    player.settings.goalie = 1
                    player.setAvatar("🧤")
                    player.reply({ message: "Para remover a posição de goalie digite !li", color: Colors.HotPink })
                    room.send({ message: `${player.name} é o Goalie do Red`, color: Colors.Crimson})
                }
            } else if (player.team == 2) {
                var blueHasGoalie = checkForGoalieSetting(room.players.blue(), 2)
                if (blueHasGoalie) {
                    player.reply({ message: "Ja tem goleiro no Blue", color: Colors.DodgerBlue })
                } else {
                    player.settings.goalie = 2
                    player.setAvatar("🧤")
                    player.reply({ message: "Para remover a posição de goalie digite !li", color: Colors.DodgerBlue })
                    room.send({ message: `${player.name} é o Goalie do Blue`, color: Colors.CornflowerBlue })
                }       
            } else {
                player.reply({ message: "Tu ta no spec doidão", color: Colors.DarkGoldenRod})
            }
            break
        case "!li":
            if (player.settings.goalie) {
                if (room.isGameInProgress()) {
                    if (room.discs[0].x < -760 || room.discs[0].x > 760) {
                        player.settings.goalie = 0
                        player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
                        player.team === 1? room.send({ message: `${player.name} não é mais o Goalie do Red`, color: Colors.Crimson}) : room.send({ message: `${player.name} não é mais o Goalie do Blue`, color: Colors.CornflowerBlue})
                    } else {
                        player.reply({ message: `Só pode trocar a posição com o disco atras de algum gol`, color: Colors.DarkGoldenRod })
                    }
                } else if (room.paused) {
                    player.settings.goalie = 0
                    player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
                    player.team === 1? room.send({ message: `${player.name} não é mais o Goalie do Red`, color: Colors.Crimson}) : room.send({ message: `${player.name} não é mais o Goalie do Blue`, color: Colors.CornflowerBlue})
                }
            } else {
                player.reply({ message: `Tu nem era goleiro.. xiu`, color: Colors.DarkGoldenRod })
            }
            break
        case "!penred":
            if (player.admin && room.isGameInProgress()) {
                setPenaltyRed()
            }
            break
        case "!penblue":
            if (player.admin && room.isGameInProgress()) {
                setPenaltyBlue()
            }
            break
        case "!help":
        case "!commands":
            player.reply({ message: "Comandos disponiveis: !go, !li, !penred, !penblue, !help, !disc, !resetball,!rules", color: Colors.DarkGoldenRod})
            break 
        case "!resetball":
        case "!reset":
            if (player.admin && room.isGameInProgress()) {
                if (room.discs[0].x < 0) {
                    kickoffAfterMissedPenalty(-500, false)
                } else if (room.discs[0].x > 0) {
                    kickoffAfterMissedPenalty(500, false)
                } else {
                    kickoff()
                }
            }
            break
        case "!disc":
        case "!discord":
            player.reply({ message: "https://discord.gg/SHbvtrt8", color: Colors.Azure, style: "bold" })
            break
        case "!rules":
        case "!regras":
            player.reply({ message: "Cada time tem direito a um(a) Goalie.", color: Colors.MistyRose });
            player.reply({ message: "Goalie - Só pode pegar o disco dentro de sua própria área:", color: Colors.MistyRose });
            player.reply({ message: "         - na zona de ataque (à frente do meio-campo),", color: Colors.MistyRose });
            player.reply({ message: "         - na zona atrás de seu próprio gol,", color: Colors.MistyRose });
            player.reply({ message: "         - ou após o toque de um(a) companheiro(a) de time.", color: Colors.MistyRose });
            player.reply({ message: "Jogador(a) de linha - Não pode pegar o disco dentro da área defensiva,", color: Colors.MistyRose });
            player.reply({ message: "Não pode interferir com o(a) goleiro(a) adversário(a) caso esteja dentro de sua própria área.", color: Colors.MistyRose });
            player.reply({ message: "Qualquer infração causada resultará em um 'penal' para o adversário.", color: Colors.MistyRose });
            player.reply({ message: "Obs.: 1 pixel do(a) jogador(a) dentro da área é considerado dentro.", color: Colors.MistyRose });
            player.reply({ message: "         1 pixel do(a) Goalie à frente do meio-campo ou atrás do gol também é o suficiente para não ser penalizado(a).", color: Colors.MistyRose });
            break
        case "!bb":
            player.kick()
            break
        default :
            player.reply({message: "Não entendi teu comando brother", color: Colors.DarkGoldenRod})
            break
    }
}