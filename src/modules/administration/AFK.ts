import Command, { CommandInfo } from "../../core/Command";
import { Team } from "../../core/Global";
import Module from "../../core/Module";
import Player from "../../core/Player";
import Room from "../../core/Room";

import * as Global from "../../Global";
import Utils from "../../utils/Utils";

export class AFK extends Module {
    constructor(room: Room) {
        super();

        room.on("playerTeamChanged", (changedPlayer: Player) => {
            if (changedPlayer.getTeam() !== Team.Spectators) {
                if (changedPlayer.settings.afk) {
                    changedPlayer.setTeam(Team.Spectators);
                    
                    room.send({ message: `⚠️ ${changedPlayer.name} está AFK e não pode ser movido!`, color: Global.Color.Tomato, style: "bold" });
                }
            }
        });
    }

    @Command({
        name: "afk"
    })
    afkCommand($: CommandInfo, room: Room) {
        if ($.caller.settings.afk) {
            $.caller.settings.afk = false;

            room.send({ message: `🥱 ${$.caller.name} não está mais AFK!`, color: Global.Color.SeaGreen, style: "bold" });

            room.emit("unafk", $.caller);
        } else {           

            room.emit("afk", $.caller);
            console.log("ali")
            // $.caller.setTeam(0)
        }

        return false;
    }

    @Command({
        name: "afks"
    })
    afksCommand($: CommandInfo, room: Room) {
        const afks = room.getPlayers().filter(p => p.settings.afk);

        if (afks.length > 0) {
            $.caller.reply({ message: `😴 Jogadores AFK (${afks.length}): ${Utils.getPlayersNames(afks)}`, color: Global.Color.MediumSeaGreen, style: "bold" });
        } else {
            $.caller.reply({ message: `⚠️ Não há nenhum jogador AFK!`, color: Global.Color.Tomato, style: "bold" });
        }

        return false;
    }
}