import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import HockeyMap from "./maps/hockey.json"
import insideBlueBox from "./functions/insideBlueBox";
import insideRedBox from "./functions/insideRedBox";
import readCommand from "./commands/Commands";
import touchedDisc from "./functions/touchedDisc";
import penaltyDetected, { setPenaltyBlue, setPenaltyRed } from "./functions/penalty/penaltyDetected";
import { playersList, removePlayer } from "./players/players";
import { redTeam, updateRedTeamPlayers } from "./players/redTeam";
import { blueTeam, updateBlueTeamPlayers } from "./players/blueTeam";
import goalieIllegalTouch, { goalieOutsideBox } from "./functions/goalie/goalieIllegalTouch";
import detectLastPlayerTouch from "./functions/detectLastPlayerTouch";
import illegalTouchInRedBox from "./functions/illegalTouchInRedBox";
import illegalTouchInBlueBox from "./functions/illegalTouchInBlueBox";
import kickoff from "./functions/kickoff";
import goalieBump from "./functions/goalie/goalieBump";
import penaltyTimer from "./functions/penalty/penaltyTimer";
import missedPenalty from "./functions/penalty/MissedPenalty";
import kickoffAfterMissedPenalty from "./functions/kickoffAfterMissedPenalty";
import { message } from "gulp-typescript/release/utils";

// TENTAR FAZER A PAREDE NA FALTA (fdc isso por enquanto)
// goaliebump detected add
// FAZER SHOOTOUT NO OVERTIME OU COMO MODO

export const room = new Room({
    public: true,
    maxPlayers: 20,
    roomName: `🏑 Ice Hockey [beta]`,
    geo: {code: 'br', lat: - 22.908333, lon: -43.196388}
});

room.onPlayerJoin = function (player:Player) {
    if (room.players.admins().size == 0) {
        player.admin = true
        room.setStadium(HockeyMap)
        room.lockTeams()
    } 
    console.log(player)
    // room.setTimeLimit(0)
    // room.setScoreLimit(0)
    player.reply({ message: "digite !help para mais informações....", color: Colors.Chartreuse, sound: 2 })
    player.reply({ message: "Entre no nosso discord - discord.gg/VeMMMtx2zc", color: Colors.Azure, style: "bold" })
    player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
    playersList.push(player)
}

room.onPlayerLeave = function (player) {
    removePlayer(player.id)
    if (room.players.admins().size == 0) {
        if (player.id == playersList[0].id) {
            playersList[1].admin = true
        } else {
            playersList[0].admin = true
        }
    } 
    updateBlueTeamPlayers()
    updateRedTeamPlayers()
    if (room.settings.mode === "penred" && (player.settings.goalie || player.settings.penaltyGoalie)) {
        room.send({message: "Goleiro saiu no meio da cobrança", color :Colors.Crimson , style: "bold", sound:2})
        setPenaltyRed()
    } else if (room.settings.mode === "penblue" && (player.settings.goalie || player.settings.penaltyGoalie)) {
        room.send({message: "Goleiro saiu no meio da cobrança", color :Colors.CornflowerBlue , style: "bold", sound:2})
        setPenaltyBlue()
    }
}

room.onPlayerTeamChange = function (player) {
    player.settings.goalie = 0
        player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
        updateRedTeamPlayers()
    updateBlueTeamPlayers()
}

room.onGameTick = function () {
    if (room.settings.mode === "penred") {
        penaltyTimer()
        missedPenalty("penred")
    } else if (room.settings.mode === "penblue") {
        penaltyTimer()
        missedPenalty("penblue")
    }
    for (let i = 0; i < redTeam.length; i++){
        goalieIllegalTouch(redTeam[i])
        illegalTouchInRedBox(redTeam[i])
        touchedDisc(redTeam[i])
        goalieBump(redTeam[i], "blue")
    }
    for (let i = 0; i < blueTeam.length; i++) { 
        goalieIllegalTouch(blueTeam[i])
        illegalTouchInBlueBox(blueTeam[i])  
        touchedDisc(blueTeam[i])
        goalieBump(blueTeam[i], "red")
    }
}

room.onPlayerChat = function (player, message) {
    if (message.startsWith("!")) {
        readCommand(message, player)
        return false
    }
    if (room.settings.chatmuted) return false
}

room.onStadiumChange = function (newStadiumName, byPlayer) {
    if (byPlayer) {
        room.setStadium(HockeyMap)
    }
}

room.onPlayerBallKick = function (player) {
    if (player.team == 1) {
        if (!player.settings.goalie && !player.settings.penaltyGoalie) {
            if (insideRedBox(player.x, player.y) && !room.settings.disabledPenaltys) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", 1)
            }
            
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
            if (goalieOutsideBox(player)) {
                const previousTeamTouchOnDisc = room.settings.lastTeamTouch
                if (previousTeamTouchOnDisc === 2 && !room.settings.disabledPenaltys) {
                    penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 1)
                }
            }
        }
    } else if (player.team == 2) {
        if (!player.settings.goalie && !player.settings.penaltyGoalie) {
            if (insideBlueBox(player.x, player.y) && !room.settings.disabledPenaltys) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", 2)
            }
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
            if (goalieOutsideBox(player)) {
                const previousTeamTouchOnDisc = room.settings.lastTeamTouch
                if (previousTeamTouchOnDisc === 1 && !room.settings.disabledPenaltys) {
                    penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 2)   
                }
            }
        }
    }
    if (room.settings.mode !== "game") {
        const previousPlayerTouchOnDisc = room.settings.lastPlayerTouch
        detectLastPlayerTouch(player, true)
        if (room.settings.penaltyKickerReleased && !room.settings.disabledPenaltys) {
            if (room.settings.mode === "penred" && player.team == 1) {
                kickoffAfterMissedPenalty(500, "O jogador soltou o disco")
            } else if (room.settings.mode === "penblue" && player.team == 2) {
                kickoffAfterMissedPenalty(-500, "O jogador soltou o disco")
            }
        } else if (player.id !== previousPlayerTouchOnDisc) {
            room.settings.penaltyKickers++
            if (room.settings.penaltyKickers > 1 && !room.settings.disabledPenaltys) {
                if (room.settings.mode === "penred" && player.team == 1) {
                    kickoffAfterMissedPenalty(500, "Só pode um jogador bater o penal");
                } else if (room.settings.mode === "penblue" && player.team == 2) {
                    kickoffAfterMissedPenalty(-500, "Só pode um jogador bater o penal");
                }
                room.settings.penaltyKickers = 0
            }
        }
    }
    detectLastPlayerTouch(player)
}
room.onTeamGoal = function (team) {
    if (room.settings.penaltyDetected) {
        room.send({ message: `Gol! Segue o jogo!`, color: team == 1 ? Colors.Crimson : Colors.CornflowerBlue, style: "bold" })
        room.settings.penaltyDetected = 0
    }
    room.settings.penaltyKickers = 0
    room.settings.penaltyTimer = 0
    room.settings.disabledPenaltys = true
    room.settings.playerBumpedBlueGoalie = 0
    room.settings.playerBumpedRedGoalie = 0
}

room.onGameStart = function () {
    room.settings.penaltyTimer = 0
    room.settings.penaltyKickers = 0
    kickoff()
    room.pause()
    room.send({message: "Cada time tem direito a um GO.... digite !go para ser o goleiro", color: Colors.Gold, style: "bold"})
    room.send({ message: "Ou joga sem goleiro e fdc eu não ligo...", color: Colors.Gray, style: "italic" })
    setTimeout(() => {
        room.unpause();
    },2000)
}

room.onPositionsReset = function () {
    kickoff()
}
