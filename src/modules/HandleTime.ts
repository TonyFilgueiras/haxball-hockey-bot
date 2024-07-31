import Command, { CommandInfo } from "../core/Command";
import { Team } from "../core/Global";
import Module from "../core/Module";
import Room from "../core/Room";
import capitalizeFirstLetter from "../functions/capitalizeFirstLetter";
import * as Global from "../Global";
import translate from "../utils/Translate";
import Game, { GameModes } from "./Game";

export default class HandleTime extends Module {
  public clockRunning = false;

  public clockTick = 0;
  public clockSeconds = 0;

  private lastAlertedMinute = 0;
  private lastAlertedSecond = 0;
  private gameWinnerAnnounced = false;
  private lastShotAnnounced = false;

  public gameDuration = 60 * 5;
  public overtimeDuration = 60 * 3;

  public inOvertime = false;

  constructor(room: Room, game: Game) {
    super();

    room.on("gameTick", () => {
      if (this.clockRunning) {
        this.countSeconds();

        this.alertClockTime(room, false, this.inOvertime);
      }

      if (this.clockSeconds >= this.overtimeDuration + this.gameDuration && this.inOvertime) {
        if (game.penalty.penaltyDetected || game.mode == GameModes.Penalty) {
          this.waitForPenaltyShot(room);
        } else {
          if (game.scoreRed === game.scoreBlue) {
            game.shootout.setShootout(room);

            this.inOvertime = false;
          }
        }
      }

      if (this.inOvertime) {
        if (game.scoreBlue !== game.scoreRed) {
          this.alertGameWinner(room, game);
          room.stop();
        }
      }

      if (this.clockSeconds >= this.gameDuration && !this.inOvertime && this.clockSeconds < this.overtimeDuration + this.gameDuration) {
        if (game.penalty.penaltyDetected || game.mode == GameModes.Penalty) {
          this.waitForPenaltyShot(room);
        } else {
          if (game.scoreRed === game.scoreBlue) {
            this.setOvertime(room);
          } else {
            this.alertGameWinner(room, game);

            room.stop();
          }
        }
      }
    });

    room.on("gameStart", () => {
      this.gameWinnerAnnounced = false;
      this.lastShotAnnounced = false;
      this.lastAlertedMinute = 0;
      this.inOvertime = false;
      this.clockTick = 0;
      this.clockSeconds = 0;
    });

    room.on("gameStop", () => {
      this.gameWinnerAnnounced = false;
      this.lastShotAnnounced = false;
      this.lastAlertedMinute = 0;
      this.inOvertime = false;
      this.clockTick = 0;
      this.clockSeconds = 0;
    });
  }

  countSeconds() {
    this.clockTick++;

    this.clockSeconds = Math.floor(this.clockTick / 60);
  }

  alertClockTime(room: Room, alertNow: boolean = false, inOvertime: boolean = false) {
    const gameDuration = inOvertime ? this.overtimeDuration + this.gameDuration : this.gameDuration;
    const messageLabel = inOvertime ? "⏰⏰ Tempo de prorrogação restante" : "⏰⏰ Tempo de jogo restante";

    const elapsedSeconds = this.clockSeconds;
    const remainingSeconds = Math.max(0, gameDuration - elapsedSeconds); // Remaining time in seconds

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const timeString = `${seconds >= 59 ? minutes + 1 : minutes}:${seconds >= 59 ? "00" : seconds < 10 ? `0${seconds}` : seconds}`;

    // Alert for each second during the last 10 seconds and when there are exactly 30 seconds left
    if (((remainingSeconds <= 3 && remainingSeconds > 0) || remainingSeconds === 30) && this.lastAlertedSecond !== seconds) {
      room.send({
        message: `${messageLabel}: ${timeString}! ⏰⏰`,
        style: "bold",
        color: remainingSeconds === 30 ? Global.Color.Yellow : Global.Color.Red,
      });
      this.lastAlertedSecond = seconds;
    } else if (minutes !== this.lastAlertedMinute || alertNow) {
      // Regular time update
      room.send({
        message: `${messageLabel}: ${timeString} ⏰⏰`,
        style: "bold",
        color: remainingSeconds < 30 ? Global.Color.Yellow : Global.Color.LimeGreen,
      });
      this.lastAlertedMinute = minutes; // Update the last alerted minute
    }
  }
  alertGameWinner(room: Room, game: Game) {
    const teamWonName = game.scoreBlue > game.scoreRed ? game.blueTeamName : game.redTeamName;
    const teamWonColor = game.scoreBlue > game.scoreRed ? game.blueTextColor : game.redTextColor;
    const teamLostName = game.scoreBlue > game.scoreRed ? game.redTeamName : game.blueTeamName;

    const winnerScore = game.scoreBlue > game.scoreRed ? game.scoreBlue : game.scoreRed;
    const loserScore = game.scoreBlue > game.scoreRed ? game.scoreRed : game.scoreBlue;

    if (!this.gameWinnerAnnounced) {
      room.send({ message: `!!! Fim de jogo !!!`, color: teamWonColor, style: "bold", sound: 2 });
      room.send({ message: `${teamWonName} venceu o jogo`, color: teamWonColor, style: "bold", sound: 2 });
      room.send({ message: `${teamWonName} ${winnerScore} x ${loserScore} ${teamLostName}`, color: teamWonColor, style: "bold", sound: 2 });
    }
    this.gameWinnerAnnounced = true;
  }

  waitForPenaltyShot(room: Room) {
    if (!this.lastShotAnnounced) {
      room.send({ message: "Ultimo lance!!", color: Global.Color.LightSalmon, style: "bold" });
    }

    this.lastShotAnnounced = true;
  }

  setOvertime(room: Room) {
    const elapsedSeconds = this.clockSeconds;
    const remainingSeconds = Math.max(0, this.overtimeDuration + this.gameDuration - elapsedSeconds); // Remaining time in seconds

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const timeString = `${seconds >= 59 ? minutes + 1 : minutes}:${seconds >= 59 ? "00" : seconds < 10 ? `0${seconds}` : seconds}`;
    room.send({ message: "!!! Prorrogação !!!", color: Global.Color.LightSalmon, style: "bold" });
    room.send({ message: "O próximo time a marcar o gol será o vencedor", color: Global.Color.LightSalmon, style: "bold" });
    room.send({
      message: `Caso nenhum time marque até os ${timeString}, a partida será decidida por shootout`,
      color: Global.Color.LightSalmon,
      style: "bold",
    });

    this.inOvertime = true;
  }

  startClock() {
    this.clockRunning = true;
  }

  stopClock() {
    this.clockRunning = false;
  }
  @Command({
    name: "settime",
    aliases: ["setime"],
  })
  setteamCommand($: CommandInfo, room: Room) {
    if (!$.caller.isAdmin()) {
      $.caller.reply({ message: translate("NOT_ADMIN"), sound: 2, color: Global.Color.Orange, style: "bold" });

      return false;
    }

    if (room.isGameInProgress()) {
      $.caller.reply({ message: "Não pode mudar o tempo com o jogo em progresso", sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    let timeStr = $.args[0];

    const normalizedTimeStr = timeStr.replace(",", ".");

    // Try to convert the normalizedTimeStr to a number
    const timeNum = parseFloat(normalizedTimeStr);

    if (isNaN(timeNum)) {
      // Handle the error if conversion fails
      $.caller.reply({ message: `Tempo invalido!`, sound: 2, color: Global.Color.Tomato, style: "bold" });
      return false;
    } else if (timeNum > 0) {
      // Handle the valid number
      this.gameDuration = timeNum * 60;
      if (timeNum > 10) {
        timeStr = "10";
        this.gameDuration = 10 * 60; // Cap the duration to 10 minutes
      }
    } else {
      // Handle cases where the number is not greater than 0
      $.caller.reply({ message: `Tempo invalido!`, sound: 2, color: Global.Color.Tomato, style: "bold" });
    }

    room.send({
      message: `${$.caller.name} Trocou o tempo de jogo para ${timeStr} minutos`,
      color: Global.Color.Pink,
      style: "bold",
    });
    return false;
  }
}
