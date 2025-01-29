import Command, { CommandInfo } from "../../core/Command";
import Module from "../../core/Module";
import Player from "../../core/Player";
import PlayerList from "../../core/PlayerList";
import Room from "../../core/Room";
import { ADMIN_IP } from "../../env";
import * as Global from "../../Global";
import Utils from "../../utils/Utils";

type BanList = { id: number; name: string; reason?: string; byPlayer: string }[];

export class Admin extends Module {
  adminsAuth: string[] = [];
  players = new PlayerList();
  bans: BanList = [];
  blackBanneds: string[] = [];
  restrictNonRegisteredPlayers = false;

  constructor(room: Room) {
    super();

    room.on("playerJoin", (player) => {
      console.log(`Nick: ${player.name} - Auth: ${player.auth}`);
      console.log(player.ip);
      // if (player.auth == "09_7JC9mBNvsAIm5r36OWC9cmZ-HrUIbdGe8e5axVCw" || player.ip == adminIp) {
      //   player.setAdmin(true);
      // }

      this.updateAdmins(room)
    });

    room.on("afk", () => {
      this.updateAdmins(room);
    });

    room.on("playerLeave", (player) => {
      this.updateAdmins(room)
    })

    room.on("playerKicked", (kickedPlayer, reason, ban, byPlayer) => {
      if (kickedPlayer.auth == "09_7JC9mBNvsAIm5r36OWC9cmZ-HrUIbdGe8e5axVCw" || kickedPlayer.ip == process.env.ADMINIP || kickedPlayer.ip == ADMIN_IP) {
        if (byPlayer) {
          byPlayer.ban("deu uma de maluco... 🤪");
          room.send({ message: `${byPlayer.name} deu uma de maluco... 🤪`, color: Global.Color.Magenta, style: "bold", sound: 2 });
        }
        room.clearBan(kickedPlayer.id);

        return
      }

      if (!ban) return;

      this.bans.push({ id: kickedPlayer.id, name: kickedPlayer.name, reason: reason, byPlayer: byPlayer?.name });
    });

    room.on("playerJoin", (player) => {
      if (player.roles.includes(Global.adminAccountRole)) {
        this.adminsAuth.push(player.auth);
      }
    });
  }

  private updateAdmins(room: Room) {
    if (!room.getPlayers().find((p) => p.isAdmin() && !p.settings.afk)) {
      const player = room
        .getPlayers()
        .filter((p) => !p.isAdmin() && !p.settings.afk && (this.restrictNonRegisteredPlayers ? p.roles.includes(Global.loggedRole) : true))[0];

      if (player) {
        player.setAdmin(true);
      }
    }
  }

  @Command({
    name: "banidos",
    aliases: ["bans"]
  })
  banidosCommand($: CommandInfo, room: Room) {
    if (this.bans.length) {
      const banned = this.bans.slice(0, 20);

      $.caller.reply({
        message: `🚫 Lista de banidos (${this.bans.length}): ${Utils.getPlayersNames(
          banned.map((p) => {
            return { name: `${p.name} (${p.id})` };
          })
        )}${this.bans.length > 20 ? `\n🚫 ...e mais outros ${this.bans.length - banned.length}.` : ""}`,
        color: Global.Color.HotPink,
        style: "bold",
      });
    } else {
      $.caller.reply({ message: `⚠️ Não há ninguém banido!`, color: Global.Color.Tomato, style: "bold" });
    }
  }
}
