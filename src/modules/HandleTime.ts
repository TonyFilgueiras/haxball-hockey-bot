import { Team } from "../core/Global";
import Module from "../core/Module";
import Room from "../core/Room";
import * as Global from "../Global";
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
  public overtimeDuration = 60 * 8;

  public inOvertime = false;

  constructor(room: Room, game: Game) {
    super();

    room.on("gameTick", () => {
      if (this.clockRunning) {
        this.countSeconds();

        this.alertClockTime(room, false, this.inOvertime);
      }

      if (this.clockSeconds >= this.overtimeDuration && this.inOvertime) {
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

      if (this.clockSeconds >= this.gameDuration && !this.inOvertime && this.clockSeconds < this.overtimeDuration) {
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
    const gameDuration = inOvertime ? this.overtimeDuration : this.gameDuration;
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
    const remainingSeconds = Math.max(0, this.overtimeDuration - elapsedSeconds); // Remaining time in seconds

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
}
