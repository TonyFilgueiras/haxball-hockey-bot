import { Colors, Player, PlayerList, Room } from "haxball-extended-room";
import checkForGoalieSetting from "../functions/checkForGoaliesetting";
import penaltyDetected, { setPenaltyBlue, setPenaltyRed } from "../functions/penaltyDetected";

export default function readCommand(message: string, player: Player, room: Room) {
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
                    player.setAvatar("go")
                    player.reply({ message: "Para remover a posição de goalie digite !li", color: Colors.HotPink })
                    room.send({ message: `${player.name} é o Goalie do Red`, color: Colors.Red})
                }
            } else if (player.team == 2) {
                var blueHasGoalie = checkForGoalieSetting(room.players.blue(), 2)
                if (blueHasGoalie) {
                    player.reply({ message: "Ja tem goleiro no Blue", color: Colors.Cyan })
                } else {
                    player.settings.goalie = 2
                    player.setAvatar("go")
                    player.reply({ message: "Para remover a posição de goalie digite !li", color: Colors.Cyan })
                    room.send({ message: `${player.name} é o Goalie do Red`, color: Colors.Blue })
                }       
            } else {
                player.reply({ message: "Tu ta no spec doidão", color: Colors.Yellow})
            }
            break
        case "!li":
            if (player.settings.goalie) {
                player.settings.goalie = ""
                player.clearAvatar()
            } else {
                player.reply({ message: `Tu nem era goleiro.. xiu`, color: Colors.Yellow })
            }
            break
        case "!penred":
            setPenaltyRed(room)
        case "!penblue":
            setPenaltyBlue(room)
        default :
            player.reply({message: "Não entendi teu comando brother", color: Colors.Yellow})
            break
    }
}