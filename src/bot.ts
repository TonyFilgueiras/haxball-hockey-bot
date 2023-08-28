import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import HockeyMap from "./maps/hockey.json"
import insideBlueBox from "./functions/insideBlueBox";
import insideRedBox from "./functions/insideRedBox";
import readCommand from "./commands/Commands";
import touchedDisc from "./functions/touchedDisc";
import penaltyDetected from "./functions/penalty/penaltyDetected";
import { playersList, removePlayer } from "./players/players";
import { redTeam, updateRedTeamPlayers } from "./players/redTeam";
import { blueTeam, updateBlueTeamPlayers } from "./players/blueTeam";
import goalieIllegalTouch, { goalieOutsideBox } from "./functions/goalie/goalieIllegalTouch";
import detectLastPlayerTouch from "./functions/detectLastPlayerTouch";
import illegalTouchInRedBox from "./functions/illegalTouchInRedBox";
import illegalTouchInBlueBox from "./functions/illegalTouchInBlueBox";
import kickoff from "./functions/kickoff";
import playerBump from "./functions/goalie/goalieBump";
import penaltyTimer from "./functions/penalty/penaltyTimer";
import missedPenalty from "./functions/penalty/MissedPenalty";


export const room = new Room({
    public: false,
    maxPlayers: 20,
    roomName: `Hockey [beta]`
});

room.onPlayerJoin = function (player:Player) {
    if (room.players.admins().size == 0) {
        player.admin = true
        room.setStadium(HockeyMap)
    } 
    player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
    playersList.push(player)
}

room.onPlayerLeave = function (player) {
    if (room.players.admins().size == 0) {
        if (player.id == playersList[0].id) {
            playersList[1].admin = true
        } else {
            playersList[0].admin = true
        }
    } 
    player.settings.goalie = 0
    removePlayer(player.id)
}

room.onPlayerTeamChange = function (player) {
    player.settings.goalie = 0
    player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
    updateRedTeamPlayers()
    updateBlueTeamPlayers()
}

room.onGameTick = function () {
    for (let i = 0; i < redTeam.length; i++){
        goalieIllegalTouch(redTeam[i])
        illegalTouchInRedBox(redTeam[i])
        touchedDisc(redTeam[i])
        playerBump(redTeam[i])
    }
    for (let i = 0; i < blueTeam.length; i++) { 
        goalieIllegalTouch(blueTeam[i])
        illegalTouchInBlueBox(blueTeam[i])  
        touchedDisc(blueTeam[i])
        playerBump(blueTeam[i])
    }
    if (room.settings.mode === "penred") {
        penaltyTimer()
        missedPenalty("penred")
    } else if (room.settings.mode === "penblue") {
        penaltyTimer()
        missedPenalty("penblue")
    }
}

room.onPlayerChat = function (player, message) {
    if (message.startsWith("!")) {
        readCommand(message, player)
        return false
    }
    if (room.settings.chatmuted) return false

}

room.onPlayerBallKick = function (player) {
    if (player.team == 1) {
        if (!player.settings.goalie && !player.settings.penaltyGoalie) {
            if (insideRedBox(player.x, player.y)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", 1)
            }
            
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
            if (goalieOutsideBox(player)) {
                const previousTeamTouchOnDisc = room.settings.lastTeamTouch
                if (previousTeamTouchOnDisc !== player.team) {
                    penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 1)
                }
            }
        }
    } else if (player.team == 2) {
        if (!player.settings.goalie && !player.settings.penaltyGoalie) {
            if (insideBlueBox(player.x, player.y)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", 2)
            }
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
            if (goalieOutsideBox(player)) {
                const previousTeamTouchOnDisc = room.settings.lastTeamTouch
                if (previousTeamTouchOnDisc !== player.team) {
                    penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 2)   
                }
            }
        }
    }
    detectLastPlayerTouch(player)
}
room.onTeamGoal = function (team) {
    if (room.settings.penalty) {
        room.send({ message: `Gol! Segue o jogo!`, color: team == 1 ? Colors.Crimson : Colors.CornflowerBlue, style: "bold" })
        room.settings.penalty = 0
    }
    room.settings.penaltyTimer = 0
    room.settings.disabledPenaltys = true
}

room.onGameStart = function () {
    room.settings.penaltyTimer = 0
    kickoff()
    room.pause()
    room.send({message: "Cada time tem direito a um GO.... digite !go para ser o goleiro", color: Colors.Gold, style: "bold"})
    room.send({ message: "Ou joga sem goleiro e fdc eu não ligo...", color: Colors.Gray, style: "italic" })
}

room.onPositionsReset = function () {
    kickoff()
}
