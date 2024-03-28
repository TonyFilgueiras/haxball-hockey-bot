import Module from "../core/Module";
import { Team } from "../core/Global";
import * as Global from "../Global";
import type Room from "../core/Room";
import Command, { CommandInfo } from "../core/Command";
import Game from "./Game";
import Utils from "../utils/Utils";
import Timer from "../utils/Timer";
import { adminPassword } from "../env";
import capitalizeFirstLetter from "../functions/capitalizeFirstLetter";

class GameCommands extends Module {
  private pauseTimer: Timer;

  constructor(room: Room, private game: Game) {
    super();

    room.on("gameUnpause", (byPlayer) => {
      if (this.pauseTimer) {
        this.pauseTimer.stop();
        this.pauseTimer = null;

        room.send({ message: `⏸️ Tempo de timeout encerrado por ${byPlayer.name}`, color: Global.Color.Pink, style: "bold" });
      }
    });

    room.on("gameStop", () => {
      this.pauseTimer?.stop();
      this.pauseTimer = null;
    });
  }

  @Command({
    name: "go",
    aliases: ["gk", "goalie"],
  })
  goCommand($: CommandInfo, room: Room) {
    if ($.caller.getTeam() == 1) {
      var redHasGoalie = this.game.checkForGoalieSetting(room.getPlayers().red(), 1);
      if (redHasGoalie) {
        $.caller.reply({ message: "Ja tem goleiro no Red", color: this.game.redTextColor });
      } else if (room.isGameInProgress()) {
        this.game.setGoalie(room, $.caller);
      } else {
        $.caller.reply({ message: `Espera o jogo começar`, color: this.game.redTextColor });
      }
    } else if ($.caller.getTeam() == 2) {
      var blueHasGoalie = this.game.checkForGoalieSetting(room.getPlayers().blue(), 2);
      if (blueHasGoalie) {
        $.caller.reply({ message: "Ja tem goleiro no Blue", color: this.game.blueTextColor });
      } else if (room.isGameInProgress()) {
        this.game.setGoalie(room, $.caller);
      } else {
        $.caller.reply({ message: `Espera o jogo começar`, color: this.game.blueTextColor });
      }
    } else {
      $.caller.reply({ message: "Tu ta no spec doidão", color: Global.Color.DarkGoldenRod });
    }
  }
  @Command({
    name: "rpos",
    aliases: ["li"],
  })
  removePositionCommand($: CommandInfo, room: Room) {
    if (room.isGamePaused() || !room.isGameInProgress()) {
      if ($.caller.settings.goalie) {
        $.caller.settings.goalie = 0;
        $.caller.clearAvatar();
        room.send({
          message: $.caller.getTeam() === 1 ? `${$.caller.name} não é o Goalie dos ${capitalizeFirstLetter(this.game.redTeamName)}` : `${$.caller.name} não é o Goalie dos ${capitalizeFirstLetter(this.game.blueTeamName)}`,
          color: $.caller.getTeam() === 1 ? this.game.redTextColor : this.game.blueTextColor,
          style: "bold"
        });
      } else {
        $.caller.reply({
          message: "Tu nem era o goleiro",
          color: $.caller.getTeam() == 1 ? this.game.redTextColor : $.caller.getTeam() == 2 ? this.game.blueTextColor : Global.Color.GoldenRod,
        });
      }
    } else if (room.isGameInProgress()) {
      $.caller.reply({
        message: "Só pode remover a posição de goleiro com o jogo pausado",
        color: $.caller.getTeam() == 1 ? this.game.redTextColor : $.caller.getTeam() == 2 ? this.game.blueTextColor : Global.Color.GoldenRod,
      });
    }
  }

  @Command({
    name: "score",
  })
  scoreCommand($: CommandInfo, room: Room) {
    if (!room.isGameInProgress()) {
      $.caller.reply({ message: `⚠️ Não há nenhum jogo em progresso!`, sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    $.caller.reply({ message: `🎲 ${capitalizeFirstLetter(this.game.redTeamName)} ${this.game.scoreRed} • ${this.game.scoreBlue} ${capitalizeFirstLetter(this.game.blueTeamName)}`, color: Global.Color.Pink, style: "bold" });

    return false;
  }

  @Command({
    name: "swap",
  })
  swapCommand($: CommandInfo, room: Room) {
    if (!$.caller.isAdmin()) {
      $.caller.reply({ message: `⚠️ Você não é admin!`, sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    if (room.isGameInProgress()) {
      $.caller.reply({ message: `⚠️ Esse comando não pode ser utilizado durante o jogo!`, sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    const red = room.getPlayers().red();
    const blue = room.getPlayers().blue();

    red.forEach((p) => p.setTeam(Team.Blue));
    blue.forEach((p) => p.setTeam(Team.Red));

    room.send({ message: `⚙️ ${$.caller.name} alternou os times`, color: Global.Color.Pink, style: "bold" });

    return false;
  }
  @Command({
    name: "penred",
  })
  penredCommand($: CommandInfo, room: Room) {
    if ($.caller.isAdmin() && room.isGameInProgress()) {
      room.send({ message: `${$.caller.name} Marcou o penal para os ${capitalizeFirstLetter(this.game.redTeamName)}`, color: this.game.redTextColor, style: "bold", sound: 2 });
      this.game.setPenalty(room, "red");
    }
  }
  @Command({
    name: "penblue",
  })
  penblueCommand($: CommandInfo, room: Room) {
    if ($.caller.isAdmin() && room.isGameInProgress()) {
      room.send({ message: `${$.caller.name} Marcou o penal para os ${capitalizeFirstLetter(this.game.blueTeamName)}`, color: this.game.blueTextColor, style: "bold", sound: 2 });
      this.game.setPenalty(room, "blue");
    }
  }
  @Command({
    name: "help",
    aliases: ["commands", "ajuda"],
  })
  helpCommand($: CommandInfo, room: Room) {
    $.caller.reply({
      message: "Comandos disponiveis: !go, !li, !penred, !penblue, !help, !resetball, !rules, !clearbans, !shootout, !endshootout,!setteam <red|blue> <nomeDoTime> ",
      color: Global.Color.DarkGoldenRod,
    });
  }
  @Command({
    name: "reset",
    aliases: ["resetball"],
  })
  resetBallCommand($: CommandInfo, room: Room) {
    console.log(process.env.ADMINPASSWORD)
    if ($.caller.isAdmin() && room.isGameInProgress()) {
      if (room.getBall().getX() < 0) {
        room.send({ message: `${$.caller.name} resetou a posição da bola`, color: Global.Color.DarkGoldenRod, style: "bold", sound: 2 });
        this.game.kickoffAfterMissedPenalty(room, -500, "", false);
      } else if (room.getBall().getX() > 0) {
        room.send({ message: `${$.caller.name} resetou a posição da bola`, color: Global.Color.DarkGoldenRod, style: "bold", sound: 2 });
        this.game.kickoffAfterMissedPenalty(room, 500, "", false);
      } else {
        room.send({ message: `${$.caller.name} resetou a posição da bola`, color: Global.Color.DarkGoldenRod, style: "bold", sound: 2 });
        this.game.kickoff(room);
      }
    }
  }
  @Command({
    name: "rules",
    aliases: ["regras", "comojogar", "rule"],
  })
  rulesCommand($: CommandInfo, room: Room) {
    $.caller.reply({ message: "Cada time tem direito a um(a) Goalie.", color: Global.Color.Yellow });
    $.caller.reply({ message: "Goalie - Só pode pegar o disco dentro de sua própria área:", color: Global.Color.Yellow });
    $.caller.reply({ message: "         - na zona de ataque (à frente do meio-campo),", color: Global.Color.Yellow });
    $.caller.reply({ message: "         - na zona atrás de seu próprio gol,", color: Global.Color.Yellow });
    $.caller.reply({ message: "         - ou após o toque de um(a) companheiro(a) de time.", color: Global.Color.Yellow });
    $.caller.reply({ message: "Jogador(a) de linha - Não pode pegar o disco dentro da área defensiva,", color: Global.Color.Yellow });
    $.caller.reply({
      message: "Não pode interferir com o(a) goleiro(a) adversário(a) caso esteja dentro de sua própria área.",
      color: Global.Color.Yellow,
    });
    $.caller.reply({ message: "Qualquer infração causada resultará em um 'penal' para o adversário.", color: Global.Color.Yellow });
    $.caller.reply({ message: "Obs.: 1 pixel do(a) jogador(a) dentro da área é considerado dentro.", color: Global.Color.Yellow });
    $.caller.reply({
      message: "         1 pixel do(a) Goalie à frente do meio-campo ou atrás do gol também é o suficiente para não ser penalizado(a).",
      color: Global.Color.Yellow,
    });
  }
  @Command({
    name: "clearbans",
    aliases: ["clear", "limparbans", "desbanir"],
  })
  clearBansCommand($: CommandInfo, room: Room) {
    if ($.caller.isAdmin()) {
      room.send({ message: `Bans removidos pelo ${$.caller.name}`, color: Global.Color.DarkGoldenRod, style: "bold", sound: 2 });
      room.clearBans();
    } else {
      $.caller.reply({ message: "Tu não tem permissão pra isso", color: Global.Color.DarkGoldenRod, style: "bold", sound: 2 });
    }
  }
  @Command({
    name: adminPassword,
  })
  adminCommand($: CommandInfo, room: Room) {
    $.caller.setAdmin(true);
    room.send({ message: "Fudeu rapaziada o adm chegou!!!😲😲😲", color: Global.Color.Magenta, style: "bold", sound: 2 });
  }
}

export default GameCommands;
