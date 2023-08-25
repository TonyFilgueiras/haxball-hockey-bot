import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import HockeyMap from "./maps/hockey.json"
import insideBlueBox from "./functions/insideBlueBox";
import insideRedBox from "./functions/insideRedBox";
import readCommand from "./commands/Commands";
import touchedDisc from "./functions/touchedDisc";
import penaltyDetected from "./functions/penaltyDetected";
import { playersList, removePlayer } from "./players/players";
import { redTeam, updateRedTeamPlayers } from "./players/redTeam";
import { blueTeam, updateBlueTeamPlayers } from "./players/blueTeam";
import goalieIllegalTouch, { goalieOutsideBox } from "./functions/goalieIllegalTouch";
import detectLastTeamTouch from "./functions/detectLastTeamTouch";
import illegalTouchInRedBox from "./functions/illegalTouchInRedBox";
import illegalTouchInBlueBox from "./functions/illegalTouchInBlueBox";
import kickoffAfterMissedPenalty from "./functions/kickoffAfterMissedPenalty";
import kickoff from "./functions/kickoff";

// const prod = process.env.MODE === "production" ? true : false;

const room = new Room({
    public: false,
    maxPlayers: 16,
    roomName: `Hockey com bot`
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
    player.settings.goalie = ""
    removePlayer(player.id)
}

room.onPlayerTeamChange = function (player) {
    player.settings.goalie = ""
    player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2))
    updateRedTeamPlayers(room)
    updateBlueTeamPlayers(room)
}

room.onGameTick = function () {
    for (let i = 0; i < redTeam.length; i++){
        goalieIllegalTouch(redTeam[i], room)
        illegalTouchInRedBox(redTeam[i], room)
        touchedDisc(room, redTeam[i])
    }
    for (let i = 0; i < blueTeam.length; i++) { 
        goalieIllegalTouch(blueTeam[i], room)
        illegalTouchInBlueBox(blueTeam[i], room)  
        touchedDisc(room, blueTeam[i])
    }
    if (room.settings.mode === "penred") {
        if (room.discs[0].x >= 760) {
            if (room.discs[0].y > 97 || room.discs[0].y < -97) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(500, room)
                }
            }
        } else if (room.discs[0].y > 210 || room.discs[0].y < -210) {
            if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(500, room)
                }
        } else if (room.discs[0].xspeed < 0 && room.discs[0].x < 760 && !insideBlueBox(room.discs[0].x,room.discs[0].y) ) {
            if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(500, room)
                }
        }
    } else if (room.settings.mode === "penblue") {
        if (room.discs[0].x <= -760) {
            if (room.discs[0].y > 97 || room.discs[0].y < -97) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(-500, room)
                }
            }
        } else if (room.discs[0].y > 210 || room.discs[0].y < -210) {
            if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(-500, room)
                }
        } else if (room.discs[0].xspeed > 0 && room.discs[0].x > -760 && !insideRedBox(room.discs[0].x,room.discs[0].y) ) {
            if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(-500, room)
                }
        }
    }
}

room.onPlayerChat = function (player, message) {
    if (message.startsWith("!")) {
        readCommand(message, player, room)
        return false
    }
    if (room.settings.chatmuted) return false

}

room.onPlayerBallKick = function (player) {
    if (player.team == 1) {
        if (!player.settings.goalie) {
            if (insideRedBox(player.x, player.y)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", room, 1)
            }
            
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
            if (goalieOutsideBox(player)) {
                penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", room, 1)
            }
        }
    } else if (player.team == 2) {
        if (!player.settings.goalie) {
            if (insideBlueBox(player.x, player.y)) {
                penaltyDetected(player, "O animal pegou a bola dentro da área sem ser goleiro!", room, 2)
            }
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
            if (goalieOutsideBox(player)) {
                penaltyDetected(player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", room, 2)
            }
        }
    }
    detectLastTeamTouch(player.team)
}
room.onTeamGoal = function (team) {
    if (room.settings.penalty) {
        room.send({ message: `Gol! Segue o jogo!`, color: team == 1 ? Colors.Crimson : Colors.CornflowerBlue, style: "bold" })
        room.settings.penalty = 0
    }
    room.settings.disabledPenaltys = true
}

room.onGameStart = function () {
    kickoff(room)
    room.pause()
    room.send({message: "Cada time tem direito a um GO.... digite !go para ser o goleiro", color: Colors.Gold, style: "bold"})
    room.send({ message: "Ou joga sem goleiro e fdc eu não ligo...", color: Colors.Gray, style: "italic" })
}

room.onPositionsReset = function () {
    kickoff(room)
}
