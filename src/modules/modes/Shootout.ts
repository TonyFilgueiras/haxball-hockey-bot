import Room from "../../core/Room";
import Game, { GameModes } from "../Game";
import { Mode } from "./Mode";
import * as Global from "../../Global";
import Player from "../../core/Player";
import { Team } from "../../core/Global";
import Command, { CommandInfo } from "../../core/Command";

export default class Shootout extends Mode {
  name = "shootout";
  mode = GameModes.Shootout;

  public shootoutBegun = false;

  public shootoutPlayers: Player[] = [];

  public shootoutScoreRed = 0;
  public shootoutScoreBlue = 0;

  private playerLeftMidPenalty: Player;

  public shotsPerTeam = 0;
  public shotsTaken = 0;

  constructor(room: Room, game: Game) {
    super(game);

    room.on("shootoutTaken", (byTeam, byPlayer) => {
      this.movePenaltyTakerToBack(byPlayer, byTeam);

      const playerThatTookPenalty = byPlayer ? byPlayer : this.playerLeftMidPenalty;

      if (++this.shotsTaken >= this.shotsPerTeam * 2) {
        if (this.shootoutScoreRed !== this.shootoutScoreBlue) {
          this.endShootout(room);
        } else {
          this.shootoutOvertime(room, playerThatTookPenalty);
          return;
        }
      } else {
        const nextTeam = byTeam === 1 ? 2 : 1;
        this.pickShootoutPenaltyTaker(nextTeam);
        const nextTeamColor = nextTeam === 1 ? "red" : "blue";
        this.game.setPenalty(room, nextTeamColor, true);

        this.updateShootoutTakers(room, playerThatTookPenalty);
      }
    });

    room.on("gameStart", () => {
      if (this.game.mode === this.mode) {
        this.pickShootoutPenaltyTaker(1);
        this.game.setPenalty(room, "red", true);
      }
    });

    room.on("gameTick", () => {
      if (this.game.mode !== this.mode) return;
      if (room.getScores().time >= 60 * 5) {
        room.send({ message: "Ninguem demora 5 minutos pra decidir em penalidades", color: Global.Color.LimeGreen, sound: 2, style: "bold" });
        room.stop();
        try {
          room
            .getPlayers()
            .red()
            .forEach((player) => {
              player.setTeam(0);
            });
          room
            .getPlayers()
            .blue()
            .forEach((player) => {
              player.setTeam(0);
            });
        } catch (e) {
          console.log(e);
        }
      }
    });

    room.on("playerLeave", (player) => {
      if (this.game.mode !== this.mode) return;
      this.shootoutPlayers = this.shootoutPlayers.filter((p) => p.id !== player.id);
      if (this.game.penaltyTaker == player) {
        this.playerLeftMidPenalty = player;
      }
    });
    
    room.on("playerTeamChanged", (changedPlayer, byPlayer) => {
      if (this.game.mode !== this.mode) return;
      
      console.log(changedPlayer.getTeam());
    });
  }

  shootoutOvertime(room: Room, player: Player) {
    room.send({ message: "!!! Mata Mata !!!", color: Global.Color.LightSalmon, style: "bold" });

    this.shotsTaken = -1;
    this.shotsPerTeam = 1;

    room.emit("shootoutTaken", 2, player);
  }

  endShootout(room: Room) {
    const shootoutWinnerTeamColor =
      this.shootoutScoreRed > this.shootoutScoreBlue
        ? this.game.redTextColor
        : this.shootoutScoreRed < this.shootoutScoreBlue
        ? this.game.blueTextColor
        : Global.Color.SlateGray;
    const shootoutWinnerTeamName =
      this.shootoutScoreRed > this.shootoutScoreBlue
        ? this.game.redTeamName
        : this.shootoutScoreRed < this.shootoutScoreBlue
        ? this.game.blueTeamName
        : "ninguem kkkkk";
    const winnerScore = this.shootoutScoreRed > this.shootoutScoreBlue ? this.shootoutScoreRed : this.shootoutScoreBlue;
    const loserScore = this.shootoutScoreRed > this.shootoutScoreBlue ? this.shootoutScoreBlue : this.shootoutScoreRed;

    room.send({ message: `!!! Fim de Shootout !!!`, color: shootoutWinnerTeamColor, style: "bold" });
    room.send({ message: `!!! Vitória dos ${shootoutWinnerTeamName} !!!`, color: shootoutWinnerTeamColor, style: "bold" });
    room.send({ message: `!!! Placar !!!`, color: shootoutWinnerTeamColor, style: "bold" });
    room.send({ message: `!!! ${winnerScore} x ${loserScore} !!!`, color: shootoutWinnerTeamColor, style: "bold" });
    this.game.mode = null;

    room.emit("handleShootout", false);

    this.shootoutPlayers.forEach((player) => {
      player.settings.scoredShootout = [];
    });

    room.stop();

    room.setScoreLimit(this.game.scoreLimit);
  }

  setShootout(room: Room) {
    room.send({ message: "!!! Shootout !!!", color: Global.Color.LightSalmon, style: "bold" });

    this.game.mode = this.mode;
    room.stop();

    room.emit("handleShootout", true);
    setTimeout(() => {
      this.beginShootout(room);
    }, 1000);
  }

  beginShootout(room: Room) {
    const redPlayers = room.getPlayers().red();
    const bluePlayers = room.getPlayers().blue();
    this.shotsPerTeam = Math.max(redPlayers.length, bluePlayers.length);

    this.shootoutPlayers = [];
    this.shootoutPlayers.push(...redPlayers, ...bluePlayers);

    this.shotsTaken = 0;
    this.shootoutScoreRed = 0;
    this.shootoutScoreBlue = 0;

    room.setScoreLimit(0);
    room.send({ message: `Cada time terá direito a ${this.shotsPerTeam} cobranças`, color: Global.Color.LightSalmon, style: "bold" });

    this.shootoutBegun = true;

    room.start();
  }
  pickShootoutPenaltyTaker(teamTakingPenalty: Team) {
    const playersForTeam = this.shootoutPlayers.filter((player) => player.getTeam() === teamTakingPenalty);

    const penaltyTaker = playersForTeam[0];

    if (penaltyTaker) {
      this.game.penaltyTaker = penaltyTaker;
    }
  }

  movePenaltyTakerToBack(penaltyTaker: Player, teamTakingPenalty: Team) {
    const playersForTeam = this.shootoutPlayers.filter((player) => player.getTeam() === teamTakingPenalty);

    const penaltyTakerIndex = playersForTeam.findIndex((player) => player.id === penaltyTaker.id);

    if (penaltyTakerIndex !== -1) {
      const newPlayersOrder = [...playersForTeam.slice(0, penaltyTakerIndex), ...playersForTeam.slice(penaltyTakerIndex + 1), penaltyTaker];

      this.shootoutPlayers = this.shootoutPlayers.map((player) => {
        if (player.getTeam() === teamTakingPenalty) {
          return newPlayersOrder.shift();
        }
        return player;
      });
    }
  }

  updateShootoutTakers(room: Room, player: Player) {
    if (player) {
      const playerIndex = this.shootoutPlayers.findIndex((p) => p.id === player.id);

      if (this.playerLeftMidPenalty) {
        this.playerLeftMidPenalty = null;
      } else {
        if (this.shootoutPlayers[playerIndex].name == player.name) {
          this.shootoutPlayers[playerIndex].settings = player.settings;
        }
      }

      this.updateShotsTaken(room);
    }
  }

  updateShotsTaken(room: Room) {
    this.shootoutPlayers.map((player) => {
      const shootoutResultMessage =
        player.settings.scoredShootout.length > 0 ? player.settings.scoredShootout.map((result) => (result ? "✅" : "❌")).join(", ") : "☐";

      if (player.getTeam() == 1) {
        room.send({
          message: `${player.name} - ${shootoutResultMessage}`,
          color: this.game.redTextColor,
          style: "bold",
        });
      }
    });
    this.shootoutPlayers.map((player) => {
      const shootoutResultMessage =
        player.settings.scoredShootout.length > 0 ? player.settings.scoredShootout.map((result) => (result ? "✅" : "❌")).join(", ") : "☐";
      if (player.getTeam() == 2) {
        room.send({
          message: `${player.name} - ${shootoutResultMessage}`,
          color: this.game.blueTextColor,
          style: "bold",
        });
      }
    });
  }
  @Command({
    name: "shootout",
    aliases: ["shootou", "penalidades"],
  })
  setShootoutCommand($: CommandInfo, room: Room) {
    if ($.caller.isAdmin()) {
      room.send({
        message: `Shotoout iniciado pelo ${$.caller.name} `,
        color: Global.Color.LightSalmon,
        style: "bold",
        sound: 2,
      });
      this.setShootout(room);
    }
  }
  @Command({
    name: "endshootout",
    aliases: ["endshootou", "pararpenalidades"],
  })
  endShootoutCommand($: CommandInfo, room: Room) {
    if ($.caller.isAdmin()) {
      room.send({
        message: `Shotoout encerrado pelo ${$.caller.name} `,
        color: Global.Color.LightSalmon,
        style: "bold",
        sound: 2,
      });
      this.endShootout(room);
    }
  }
}
