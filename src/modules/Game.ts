import Module from "../core/Module";
import { MessageObject, Team } from "../core/Global";

import * as Global from "../Global";

import type Room from "../core/Room";
import type Player from "../core/Player";

import HockeyMap from "../maps/hockey.json";

import GameCommands from "./GameCommands";
import translate from "../utils/Translate";
import { CustomAvatarManager } from "./CustomAvatarManager";

import toColor from "../functions/toColor";
import Disc from "../core/Disc";
import distanceBetweenDots from "../functions/math/distanceBetweenDots";
import calculateTotalSpeed from "../functions/math/calculateTotalSpeed";
import headingTowardsGoal from "../functions/headingTowardsGoal";
import Penalty, { PenaltyTeams } from "./modes/Penalty";
import playerInterferedGoalie from "../functions/playerInterferedGoalie";
import CustomTeams from "./CustomTeams";
import capitalizeFirstLetter from "../functions/capitalizeFirstLetter";
import HandleTime from "./HandleTime";
import Shootout from "./modes/Shootout";
import getClosestPlayer from "../functions/getClosestPlayer";

export enum GameModes {
  Game = 1,
  Penalty = 2,
  Shootout = 3,
}

class Game extends Module {
  public handleTime: HandleTime;
  public gameCommands: GameCommands;
  public customTeams: CustomTeams;
  public customAvatarManager: CustomAvatarManager;
  public penalty: Penalty;
  public shootout: Shootout;

  public mode: GameModes;

  public scoreRed = 0;
  public scoreBlue = 0;

  public teamPlayersHistory: Global.TeamPlayersHistory = [];

  public gameStopped = false;
  public lastPlayMessageSent = false;

  public scoreLimit = 3;

  public stadium = this.getDefaultMap();

  public gameTime: number;
  public gameTimeSecondsToSendRec = 1 * 60;

  public redBallColor: number;
  public blueBallColor: number;
  public redTextColor: number;
  public blueTextColor: number;
  public redTeamName: string;
  public blueTeamName: string;

  public redPlayerBumpedGoalieY: number;
  public bluePlayerBumpedGoalieY: number;
  public redGoalieGotBumpedY: number;
  public blueGoalieGotBumpedY: number;
  public playerBumpedRedGoalie = 0;
  public playerBumpedBlueGoalie = 0;
  public goalieBumpTimeout: NodeJS.Timeout = null;

  public lastPlayerTouch = 0;
  public lastTeamTouch = 0;

  public penaltyTaker: Player;

  constructor(room: Room) {
    super();

    this.run(room);
  }

  private run(room: Room) {
    room.lockTeams();
    room.setScoreLimit(this.scoreLimit);
    room.setTimeLimit(0);
    room.setStadium(this.stadium);

    this.handleTime = room.module(HandleTime, this) as HandleTime;
    this.customTeams = room.module(CustomTeams, this) as CustomTeams;
    this.gameCommands = room.module(GameCommands, this) as GameCommands;
    this.penalty = room.module(Penalty, this) as Penalty;
    this.shootout = room.module(Shootout, this) as Shootout;
    this.customAvatarManager = new CustomAvatarManager(room);

    room.on("stadiumChange", (stadium, byPlayer) => {
      if (byPlayer) {
        room.setStadium(HockeyMap);
      }
    });

    room.on("playerJoin", (player: Player) => {
      player.reply({ message: "digite !help para mais informações....", color: Global.Color.Chartreuse, sound: 2 });
    });

    room.on("playerLeave", (player: Player) => {
      const playerHist = this.teamPlayersHistory.find((p) => p.id === player.id && p.timeLeft == null);

      if (playerHist) {
        playerHist.timeLeft = room.getScores().time;
      }
    });

    room.on("playerChat", (player, message) => {
      if (message.startsWith("!")) {
        return false;
      }
    });

    room.on("playerTeamChanged", (changedPlayer, byPlayer) => {
      try {
        changedPlayer.settings.goalie = 0;

        this.customAvatarManager.clearPlayerAvatar(changedPlayer.id);

        const playerHist = this.teamPlayersHistory.find((p) => p.id === changedPlayer.id && p.timeLeft == null);

        if (room.isGameInProgress()) {
          if (playerHist) {
            if (playerHist.team !== changedPlayer.getTeam()) {
              playerHist.timeLeft = room.getScores().time;

              if (changedPlayer.getTeam() !== Team.Spectators) {
                this.addPlayerToTeamHistory(changedPlayer, room);
              }
            }
          } else {
            this.addPlayerToTeamHistory(changedPlayer, room);
          }
        }
      } catch (e) {
        console.log(e);
      }
    });

    room.on("gameStop", (byPlayer: Player) => {
      this.customAvatarManager.clearAll();

      // const rec = room.stopRecording();

      // if (this.gameTime >= this.gameTimeSecondsToSendRec) {
      //   this.matchStats.sendToDiscord(
      //     rec,
      //     this,
      //     this.teamPlayersHistory.map((p) => {
      //       if (p.timeLeft == null) p.timeLeft = this.gameTime;

      //       return {
      //         ...p,
      //         points: this.matchStats.calculatePointsPlayer(p.id) ?? 0,
      //       };
      //     })
      //   );
      // }

      if (this.scoreRed !== this.scoreBlue) {
        const teamWon = this.scoreBlue > this.scoreRed ? Team.Blue : Team.Red;

        this.customTeams.setTeamToMaintainUniform(teamWon);
      }

      this.teamPlayersHistory = [];

      this.gameTime = null;
      this.scoreBlue = 0;
      this.scoreRed = 0;

      this.handleTime.inOvertime = false;
      this.gameStopped = false;
      this.lastPlayMessageSent = false;

      if (this.mode !== GameModes.Shootout) this.mode = null;
    });

    room.on("handleShootout", (shootoutBegun) => {
      if (shootoutBegun) {
        this.mode = GameModes.Shootout;
      } else {
        this.mode = null;
      }
    });

    room.on("uniformChanged", (redColor, blueColor) => {
      this.redBallColor = redColor.ballColor;
      this.blueBallColor = blueColor.ballColor;
      this.redTextColor = redColor.chatTextColor;
      this.blueTextColor = blueColor.chatTextColor;
      this.redTeamName = redColor.name;
      this.blueTeamName = blueColor.name;
    });

    room.on("gameStart", (byPlayer: Player) => {
      // room.startRecording();

      this.handleTime.inOvertime = false;

      if (this.mode == this.shootout.mode) return;

      this.teamPlayersHistory = [
        ...room
          .getPlayers()
          .teams()
          .map((p) => {
            return { id: p.id, name: p.name, timeJoin: 0, auth: p.auth, registered: p.roles.includes(Global.loggedRole), team: p.getTeam() };
          }),
      ];

      this.kickoff(room);
      room.send({ message: "Cada time tem direito a um GO.... digite !go para ser o goleiro", color: Global.Color.Gold, style: "bold" });
      room.send({ message: "Ou joga sem goleiro e fdc eu não ligo...", color: Global.Color.Gray, style: "italic" });
    });

    room.on("gameTick", () => {
      if (this.gameStopped) return;

      this.customAvatarManager.run();

      this.checkIfPuckClippedOnGoal(room);

      this.gameTime = room.getScores().time;

      this.penalty.checkingForPenaltiesOnTick(room);
    });

    room.on("playerBallKick", (player) => {
      this.penalty.checkingForPenaltiesOnKick(room, player);
    });

    room.on("positionsReset", () => {
      if (this.mode == GameModes.Shootout && this.penaltyTaker) {
        room.emit("shootoutTaken", this.penaltyTaker.getTeam(), this.penaltyTaker);
      } else {
        this.kickoff(room);
      }
    });
    room.on("teamGoal", (team) => {
      if (this.mode == GameModes.Shootout) {
        if (this.penaltyTaker) {
          team == 1 ? this.shootout.shootoutScoreRed++ : this.shootout.shootoutScoreBlue++;
          this.penaltyTaker.settings.scoredShootout.push(true);
        }
        return;
      }
      team == 1 ? this.scoreRed++ : this.scoreBlue++;

      this.handleTime.stopClock();
      this.handleTime.clockSeconds -= 2;
    });
  }

  kickoff(room: Room) {
    this.penalty.disabledPenalties = false;
    this.penalty.penaltyKickerReleased = false;
    this.penalty.penaltyKickers = 0;
    this.penalty.penaltyTimer = 0;
    this.penalty.penaltyDetected = 0;
    this.penalty.penaltyTakerTeam = 0;
    this.penalty.penaltyTakerId = 0;

    this.lastTeamTouch = 0;
    this.playerBumpedBlueGoalie = 0;
    this.playerBumpedRedGoalie = 0;

    if (this.mode == GameModes.Shootout) {
      return;
    }

    this.mode = GameModes.Game;
    this.penalty.teamTakingPenalty = PenaltyTeams.NoPenalty;

    this.penaltyTaker = null;

    this.handleTime.alertClockTime(room, true, this.handleTime.inOvertime);

    room.pause();
    setTimeout(() => {
      room.unpause();
      this.handleTime.startClock();
    }, 1000);

    let redPlayerSorted = 0;
    let bluePlayerSorted = 0;

    let redTeam = room.getPlayers().red();
    let blueTeam = room.getPlayers().blue();

    const puck = room.getBall();
    puck.setColor(0);

    this.setDiscPosition(puck, 0, 0);

    while (redTeam.length > 0) {
      const randomIndex = Math.floor(Math.random() * redTeam.length);
      const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player

      if (randomRedPlayer.settings.penaltyGoalie) {
        randomRedPlayer.clearAvatar();
        randomRedPlayer.settings.penaltyGoalie = 0;
      }

      if (!randomRedPlayer.settings.goalie) {
        if (redPlayerSorted == 0) {
          this.setDiscPosition(randomRedPlayer, -80, 1);
        } else if (redPlayerSorted == 1) {
          this.setDiscPosition(randomRedPlayer, -20, -150);
        } else if (redPlayerSorted == 2) {
          this.setDiscPosition(randomRedPlayer, -20, 150);
        } else if (redPlayerSorted == 3) {
          this.setDiscPosition(randomRedPlayer, -150, 0);
        } else if (redPlayerSorted == 4) {
          this.setDiscPosition(randomRedPlayer, -600, 0);
        }
        redPlayerSorted++;
      } else {
        this.setDiscPosition(randomRedPlayer, -666, 0);
      }
    }
    while (blueTeam.length > 0) {
      const randomIndex = Math.floor(Math.random() * blueTeam.length);
      const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player

      if (randomBluePlayer.settings.penaltyGoalie) {
        randomBluePlayer.clearAvatar();
        randomBluePlayer.settings.penaltyGoalie = 0;
      }

      if (!randomBluePlayer.settings.goalie) {
        if (bluePlayerSorted == 0) {
          this.setDiscPosition(randomBluePlayer, 80, -1);
        } else if (bluePlayerSorted == 1) {
          this.setDiscPosition(randomBluePlayer, 20, 150);
        } else if (bluePlayerSorted == 2) {
          this.setDiscPosition(randomBluePlayer, 20, -150);
        } else if (bluePlayerSorted == 3) {
          this.setDiscPosition(randomBluePlayer, 150, 0);
        } else if (bluePlayerSorted == 4) {
          this.setDiscPosition(randomBluePlayer, 600, 0);
        }
        bluePlayerSorted++;
      } else {
        this.setDiscPosition(randomBluePlayer, 666, 0);
      }
    }
  }

  kickoffAfterMissedPenalty(room: Room, xAxis: 500 | -500, reasonMissedPenalty?: string, afterPenalty: boolean = true) {
    try {
      this.penalty.disabledPenalties = false;
      this.penalty.penaltyKickerReleased = false;
      this.penalty.penaltyKickers = 0;
      this.penalty.penaltyTimer = 0;
      this.penalty.penaltyDetected = 0;
      this.penalty.penaltyTakerTeam = 0;
      this.penalty.penaltyTakerId = 0;

      this.playerBumpedBlueGoalie = 0;
      this.playerBumpedRedGoalie = 0;
      this.lastTeamTouch = 0;

      if (afterPenalty) {
        room.send({
          message: "Penalty perdido!",
          color: xAxis > 0 ? this.redTextColor : this.blueTextColor,
          sound: 2,
          style: "bold",
        });
        room.send({
          message: `${reasonMissedPenalty}`,
          color: xAxis > 0 ? this.redTextColor : this.blueTextColor,
          sound: 2,
          style: "bold",
        });
      }
      if (this.mode == GameModes.Shootout) {
        if (this.penaltyTaker) {
          this.penaltyTaker.settings.scoredShootout.push(false);
          room.emit("shootoutTaken", this.penaltyTaker.getTeam(), this.penaltyTaker);
        } else {
          console.log("dfasd");
          const teamToEmit = xAxis == 500 ? 1 : 2;
          room.emit("shootoutTaken", teamToEmit);
        }
        return;
      }
      this.mode = GameModes.Game;
      this.penalty.teamTakingPenalty = PenaltyTeams.NoPenalty;

      let redPlayerSorted = 0;
      let bluePlayerSorted = 0;

      this.penaltyTaker = null;

      this.handleTime.alertClockTime(room, true, this.handleTime.inOvertime);
      room.pause();

      setTimeout(() => {
        room.unpause();
        this.handleTime.startClock();
      }, 1000);

      function getRandom1OrMinus1(): 1 | -1 {
        return Math.random() >= 0.5 ? 1 : -1;
      }

      const topOrBottom = getRandom1OrMinus1();

      const puck = room.getBall();
      puck.setColor(0);
      const redTeam = room.getPlayers().red();
      const blueTeam = room.getPlayers().blue();

      switch (xAxis) {
        case 500:
          this.setDiscPosition(puck, 500, 210 * topOrBottom);

          while (redTeam.length > 0) {
            const randomIndex = Math.floor(Math.random() * redTeam.length);
            const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player

            if (!randomRedPlayer.settings.goalie) {
              if (redPlayerSorted == 0) {
                this.setDiscPosition(randomRedPlayer, 420, 211 * topOrBottom);
              } else if (redPlayerSorted == 1) {
                this.setDiscPosition(randomRedPlayer, 390, 100 * topOrBottom);
              } else if (redPlayerSorted == 2) {
                this.setDiscPosition(randomRedPlayer, 380, 310 * topOrBottom);
              } else if (redPlayerSorted == 3) {
                this.setDiscPosition(randomRedPlayer, 220, 210 * topOrBottom);
              } else if (redPlayerSorted == 4) {
                this.setDiscPosition(randomRedPlayer, 0, 130 * topOrBottom);
              }
              redPlayerSorted++;
            } else {
              this.setDiscPosition(randomRedPlayer, 0, 130 * topOrBottom);
            }
          }
          while (blueTeam.length > 0) {
            const randomIndex = Math.floor(Math.random() * blueTeam.length);
            const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player

            if (randomBluePlayer.settings.penaltyGoalie) {
              randomBluePlayer.clearAvatar();
              randomBluePlayer.settings.penaltyGoalie = 0;
            }

            if (!randomBluePlayer.settings.goalie) {
              if (bluePlayerSorted == 0) {
                this.setDiscPosition(randomBluePlayer, 580, 209 * topOrBottom);
              } else if (bluePlayerSorted == 1) {
                this.setDiscPosition(randomBluePlayer, 610, 100 * topOrBottom);
              } else if (bluePlayerSorted == 2) {
                this.setDiscPosition(randomBluePlayer, 620, 310 * topOrBottom);
              } else if (bluePlayerSorted == 3) {
                this.setDiscPosition(randomBluePlayer, 510, 50 * topOrBottom);
              } else if (bluePlayerSorted == 4) {
                this.setDiscPosition(randomBluePlayer, 640, 130 * topOrBottom);
              }
              bluePlayerSorted++;
            } else {
              this.setDiscPosition(randomBluePlayer, 670, 55 * topOrBottom);
            }
          }
          break;
        case -500:
          this.setDiscPosition(puck, -500, 210 * topOrBottom);

          while (blueTeam.length > 0) {
            const randomIndex = Math.floor(Math.random() * blueTeam.length);
            const randomBluePlayer = blueTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player

            if (!randomBluePlayer.settings.goalie) {
              if (bluePlayerSorted == 0) {
                this.setDiscPosition(randomBluePlayer, -420, 211 * topOrBottom);
              } else if (bluePlayerSorted == 1) {
                this.setDiscPosition(randomBluePlayer, -390, 100 * topOrBottom);
              } else if (bluePlayerSorted == 2) {
                this.setDiscPosition(randomBluePlayer, -380, 310 * topOrBottom);
              } else if (bluePlayerSorted == 3) {
                this.setDiscPosition(randomBluePlayer, -220, 210 * topOrBottom);
              } else if (bluePlayerSorted == 4) {
                this.setDiscPosition(randomBluePlayer, 0, 130 * topOrBottom);
              }
              bluePlayerSorted++;
            } else {
              this.setDiscPosition(randomBluePlayer, 0, 130 * topOrBottom);
            }
          }
          while (redTeam.length > 0) {
            const randomIndex = Math.floor(Math.random() * redTeam.length);
            const randomRedPlayer = redTeam.splice(randomIndex, 1)[0]; // Remove and retrieve the Player

            if (randomRedPlayer.settings.penaltyGoalie) {
              randomRedPlayer.settings.penaltyGoalie = 0;
              randomRedPlayer.clearAvatar();
            }

            if (!randomRedPlayer.settings.goalie) {
              if (redPlayerSorted == 0) {
                this.setDiscPosition(randomRedPlayer, -580, 209 * topOrBottom);
              } else if (redPlayerSorted == 1) {
                this.setDiscPosition(randomRedPlayer, -610, 100 * topOrBottom);
              } else if (redPlayerSorted == 2) {
                this.setDiscPosition(randomRedPlayer, -620, 310 * topOrBottom);
              } else if (redPlayerSorted == 3) {
                this.setDiscPosition(randomRedPlayer, -510, 50 * topOrBottom);
              } else if (redPlayerSorted == 4) {
                this.setDiscPosition(randomRedPlayer, -640, 130 * topOrBottom);
              }
              redPlayerSorted++;
            } else {
              this.setDiscPosition(randomRedPlayer, -670, 55 * topOrBottom);
            }
          }
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  detectPenalty(room: Room, player: Player, penalty: string, team: 0 | 1 | 2) {
    const puck = room.getBall();

    if (!this.penalty.penaltyDetected && !this.penalty.disabledPenalties) {
      room.send({
        message: `Penalty do ${player.name}!`,
        color: team == 1 ? this.redTextColor : this.blueTextColor,
        style: "bold",
        sound: 2,
      });
      room.send({
        message: `${penalty}`,
        color: team == 1 ? this.redTextColor : this.blueTextColor,
        style: "bold",
      });
    }
    this.penalty.penaltyDetected = team;
    if (this.penalty.teamTakingPenalty === PenaltyTeams.PenaltyBlue && this.penalty.penaltyDetected === 1) {
      room.send({
        message: `Gol automático!!`,
        color: team == 2 ? this.redTextColor : this.blueTextColor,
        style: "bold",
        sound: 2,
      });
      this.setDiscPosition(puck, -755, 0, -1, 0);
    }
    if (this.penalty.teamTakingPenalty === PenaltyTeams.PenaltyRed && this.penalty.penaltyDetected === 2) {
      room.send({
        message: `Gol automático!`,
        color: team == 1 ? this.redTextColor : this.blueTextColor,
        style: "bold",
        sound: 2,
      });
      this.setDiscPosition(puck, 755, 0, 1, 0);
    }

    if (!this.penalty.disabledPenalties) {
      setTimeout(() => {
        if (this.penalty.penaltyDetected === 2) {
          room.pause();
          room.unpause();
          this.setPenalty(room, "red");
        } else if (this.penalty.penaltyDetected === 1) {
          room.pause();
          room.unpause();
          this.setPenalty(room, "blue");
        }

        this.penalty.penaltyDetected = 0;
      }, 2000);
    }
  }

  setPenalty(room: Room, forTeam: "red" | "blue", isItShootout?: boolean) {
    try {
      const puck = room.getBall();

      this.handleTime.stopClock();

      if (this.mode === GameModes.Shootout) {
        room.pause();
        room.unpause();
      }
      if (this.mode !== GameModes.Shootout) this.handleTime.alertClockTime(room, true, this.handleTime.inOvertime);

      setTimeout(() => {
        this.lastPlayerTouch = 0;
      }, 100);
      puck.setColor(0);

      this.penalty.penaltyKickerReleased = false;
      this.penalty.penaltyKickers = 0;
      this.penalty.penaltyTimer = 0;
      this.penalty.disabledPenalties = false;

      this.lastTeamTouch = forTeam == "red" ? 1 : 2;

      this.mode = isItShootout ? GameModes.Shootout : GameModes.Penalty;

      switch (forTeam) {
        case "red":
          this.penalty.teamTakingPenalty = PenaltyTeams.PenaltyRed;

          this.penalty.penaltyTakerTeam = 1;
          this.penalty.penaltyTakerId = 0;

          break;

        case "blue":
          this.penalty.teamTakingPenalty = PenaltyTeams.PenaltyBlue;

          this.penalty.penaltyTakerTeam = 2;
          this.penalty.penaltyTakerId = 0;

          break;

        default:
          break;
      }
      this.setPenaltyPositions(room, puck, forTeam);
    } catch (error) {
      console.log(error);
    }
  }

  setPenaltyPositions(room: Room, puck: Disc, forTeam: "red" | "blue") {
    const redTeam = room.getPlayers().red();
    const blueTeam = room.getPlayers().blue();

    const randomSide = Math.random() < 0.5 ? -1 : 1;

    switch (forTeam) {
      case "red":
        this.setDiscPosition(puck, 230, 0);

        if (this.penaltyTaker) {
          this.setDiscPosition(this.penaltyTaker, -70, 50 * randomSide);

          redTeam.forEach((player) => {
            if (player.id !== this.penaltyTaker.id) {
              player.setY(-500);
            }
          });
        } else {
          for (let i = 0; i < redTeam.length; i++) {
            this.setDiscPosition(redTeam[i], -70, (i - 2) * 50);
          }
        }
        if (this.checkForGoalieSetting(blueTeam, 2)) {
          for (let i = 0; i < blueTeam.length; i++) {
            if (blueTeam[i].settings.goalie) {
              this.setDiscPosition(blueTeam[i], 666, 0);
            } else {
              blueTeam[i].setY(500);
            }
          }
        } else {
          for (let i = 0; i < blueTeam.length; i++) {
            blueTeam[i].setY(500);
          }
          const randomNumber = Math.floor(Math.random() * blueTeam.length);
          this.setDiscPosition(blueTeam[randomNumber], 666, 0);
          blueTeam[randomNumber].settings.penaltyGoalie = 2;
          blueTeam[randomNumber].setAvatar("🥊");
        }
        break;
      case "blue":
        this.setDiscPosition(puck, -230, 0);
        if (this.penaltyTaker) {
          this.setDiscPosition(this.penaltyTaker, 70, 50 * randomSide);

          blueTeam.forEach((player) => {
            if (player.id !== this.penaltyTaker.id) {
              player.setY(-500);
            }
          });
        } else {
          for (let i = 0; i < blueTeam.length; i++) {
            this.setDiscPosition(blueTeam[i], 70, (i - 2) * 50);
          }
        }
        if (this.checkForGoalieSetting(redTeam, 1)) {
          for (let i = 0; i < redTeam.length; i++) {
            if (redTeam[i].settings.goalie) {
              this.setDiscPosition(redTeam[i], -666, 0);
            } else {
              redTeam[i].setY(500);
            }
          }
        } else {
          for (let i = 0; i < redTeam.length; i++) {
            redTeam[i].setY(500);
          }
          const randomNumber = Math.floor(Math.random() * redTeam.length);
          this.setDiscPosition(redTeam[randomNumber], -666, 0);
          redTeam[randomNumber].settings.penaltyGoalie = 1;
          redTeam[randomNumber].setAvatar("🥊");
        }
        break;
    }
  }

  goalieIllegalTouch(room: Room, player: Player) {
    const previousTouchOnDisc = this.lastTeamTouch;
    const previousPlayerTouchOnDisc = room.getPlayer(this.lastPlayerTouch);

    const opposingTeam = player.getTeam() == 1 ? room.getPlayers().blue() : room.getPlayers().red();
    if (
      (player.settings.goalie || player.settings.penaltyGoalie) &&
      this.touchedDisc(room, player) &&
      this.goalieOutsideBox(player) &&
      previousTouchOnDisc !== 0
    ) {
      if (previousTouchOnDisc !== player.getTeam()) {
        const penaltyMessage = "O jogador tocou no disco fora da área de goleiro após o toque do adversário";
        this.penaltyTaker = this.mode === GameModes.Shootout ? getClosestPlayer(player, opposingTeam) : previousPlayerTouchOnDisc;

        this.detectPenalty(room, player, penaltyMessage, player.getTeam());
      }
    }
  }

  goalieOutsideBox(player: Player): boolean {
    switch (player.getTeam()) {
      case 1:
        if (!this.insideGoalieBox(player.getX(), player.getY(), "red")) {
          if (player.getX() < -15 && player.getX() >= -744) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      case 2:
        if (!this.insideGoalieBox(player.getX(), player.getY(), "blue")) {
          if (player.getX() > 15 && player.getX() <= 744) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      default:
        return false;
    }
  }

  illegalTouchInGoalieBox(room: Room, player: Player, teamBox: "red" | "blue") {
    const teamGoalie = teamBox == "red" ? 1 : 2;

    const opposingTeam = teamBox == "red" ? room.getPlayers().blue() : room.getPlayers().red();

    if (this.insideGoalieBox(player.getX(), player.getY(), teamBox)) {
      if (!player.settings.goalie && player.settings.penaltyGoalie !== teamGoalie) {
        if (this.touchedDisc(room, player)) {
          if (!this.penaltyTaker) {
            this.penaltyTaker = getClosestPlayer(player, opposingTeam);
          }

          this.detectPenalty(room, player, "O jogador pegou a bola dentro da área sem ser goleiro!", teamGoalie);
        }
      }
    }
  }

  insideGoalieBox(x: number, y: number, teamBox: "red" | "blue"): boolean {
    const leftOrRight = teamBox == "red" ? -1 : 1;

    const radius = 124;
    const xCenter = 757 * leftOrRight;

    if (this.insideGoal(x, y, teamBox)) {
      return true;
    } else if ((teamBox === "red" && x < xCenter - 6) || (teamBox === "blue" && x > xCenter + 6)) {
      return false;
    } else {
      const distancia = distanceBetweenDots(x, y, xCenter, 0);
      return distancia <= radius;
    }
  }

  insideGoal(x: number, y: number, teamGoal: "red" | "blue"): boolean {
    const leftOrRight = teamGoal == "red" ? -1 : 1;

    const radius = 124;
    const xCenter = 757 * leftOrRight;

    const distance = distanceBetweenDots(x, y, xCenter, 0);
    if (((leftOrRight === -1 && x > -800) || (leftOrRight === 1 && x < 800)) && y < 81 && y > -81 && distance <= radius) {
      return true;
    } else {
      return false;
    }
  }

  checkIfPuckClippedOnGoal(room: Room) {
    const puck = room.getBall();
    if (
      ((this.insideGoal(puck.getX(), puck.getY(), "red") && puck.getX() < -768) ||
        (this.insideGoal(puck.getX(), puck.getY(), "blue") && puck.getX() > 768)) &&
      !this.penalty.disabledPenalties
    ) {
      if (!room.isGamePaused()) {
        room.send({
          message: `O disco ta dentro do gol, caso tenha entrado por tras do gol, adm tem que usar !reset para resetar a bola`,
          color: Global.Color.GoldenRod,
          sound: 2,
        });
        room.send({
          message: `adm tem que usar !reset para resetar a bola`,
          color: Global.Color.GoldenRod,
          sound: 2,
          style: "bold"
          
        });
        puck.setVelocityX(0);
        room.pause();
      }
      return true;
    } else return false;
  }

  setGoalie(room: Room, player: Player) {
    var goalieTeam: 0 | 1 | 2 = 0;
    var discPosition = 0;

    player.getTeam() === 1 ? (goalieTeam = 1) : (goalieTeam = 2);
    player.getTeam() === 1 ? (discPosition = -666) : (discPosition = 666);

    player.settings.goalie = goalieTeam;
    player.setAvatar("🧤");
    player.reply({
      message: "Para remover a posição de goalie digite !li",
      color: Global.Color.LimeGreen,
      style: "bold",
    });
    player.reply({ message: "Voce só pode tocar na bola na:", color: Global.Color.LimeGreen, style: "bold" });
    player.reply({ message: "-       Zona ofensiva", color: Global.Color.LimeGreen, style: "bold" });
    player.reply({ message: "-       Zona atras do gol", color: Global.Color.LimeGreen, style: "bold" });
    player.reply({
      message: "-       Ou quando um companheiro de equipe tocar por ultimo",
      color: Global.Color.LimeGreen,
      style: "bold",
    });
    room.send({
      message:
        player.getTeam() === 1
          ? `${player.name} é o Goalie dos ${capitalizeFirstLetter(this.redTeamName)}`
          : `${player.name} é o Goalie dos ${capitalizeFirstLetter(this.blueTeamName)}`,
      color: player.getTeam() === 1 ? this.redTextColor : this.blueTextColor,
      style: "bold",
    });
    if (room.getScores().time < 2 && this.mode !== GameModes.Shootout) {
      this.setDiscPosition(player, discPosition, 0);
      if (
        player.x < 130 &&
        player.x > -130 &&
        player.y < 30 &&
        player.y > -30 &&
        (player.getTeam() === 1 ? room.getPlayers().red().length > 1 : room.getPlayers().blue().length > 1)
      ) {
        var randomPlayer = player.getTeam() === 1 ? this.pickRandomRedPlayer(room) : this.pickRandomBluePlayer(room);
        player.getTeam() === 1 ? this.setDiscPosition(randomPlayer, -40, 0) : this.setDiscPosition(randomPlayer, 40, 0);
      }
    }
  }
  pickRandomRedPlayer(room: Room): Player | null {
    const redPlayers = room
      .getPlayers()
      .red()
      .filter((p) => p.settings.goalie === 0);

    if (redPlayers.length === 0) {
      return null; // No red players found
    }

    const randomIndex = Math.floor(Math.random() * redPlayers.length);
    return redPlayers[randomIndex];
  }
  pickRandomBluePlayer(room: Room): Player | null {
    const bluePlayers = room
      .getPlayers()
      .blue()
      .filter((p) => p.settings.goalie === 0);

    if (bluePlayers.length === 0) {
      return null; // No blue players found
    }

    const randomIndex = Math.floor(Math.random() * bluePlayers.length);
    return bluePlayers[randomIndex];
  }

  checkForGoalieSetting(players: Player[], teamId: number): boolean {
    for (const playerId in players) {
      const player = players[playerId];
      if (player.settings && player.settings.goalie === teamId) {
        return true; // Found a player with goalie setting
      }
    }
    return false; // No player with goalie setting found
  }

  touchedDisc(room: Room, player: Player, penaltyMode: boolean = false): boolean {
    if (room.getBall().distanceTo(player) < 0.2) {
      this.detectLastPlayerTouch(room, player, penaltyMode);
      return true;
    } else {
      return false;
    }
  }

  detectLastPlayerTouch(room: Room, player: Player, penaltyMode: boolean = false) {
    this.lastTeamTouch = player.getTeam();
    this.lastPlayerTouch = player.id;
    if (penaltyMode) {
      this.penalty.penaltyTakerId = player.id;
      this.penalty.penaltyTakerTeam = player.getTeam();
    }
    player.getTeam() === 1
      ? room.getBall().setColor(this.customTeams.teamBallColor().red)
      : room.getBall().setColor(this.customTeams.teamBallColor().blue);
  }
  goalieBump(room: Room, player: Player, goalieTeam: "red" | "blue") {
    const puck = room.getBall();

    switch (goalieTeam) {
      case "red":
        const redGoalie = this.getGoalie(room, "red");
        if (redGoalie) {
          const goalieBumped =
            player.distanceTo(redGoalie) < 0.1 &&
            calculateTotalSpeed(player.getVelocityX(), player.getVelocityY()) >= 0.2 &&
            player.getTeam() === 2 &&
            this.insideGoalieBox(redGoalie.getX(), redGoalie.getY(), "red") &&
            player.id !== this.lastPlayerTouch &&
            redGoalie?.id !== this.lastPlayerTouch;

          const { isHeadingTowardsGoal, yAtIntersection } = headingTowardsGoal(puck.getX(), puck.getY(), puck.getVelocityX(), puck.getVelocityY(), 1);

          if (goalieBumped) {
            this.playerBumpedRedGoalie = player.id;
            this.bluePlayerBumpedGoalieY = player.getY();
            this.redGoalieGotBumpedY = redGoalie.getY();

            if (this.goalieBumpTimeout) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
            }

            this.goalieBumpTimeout = setTimeout(() => {
              this.playerBumpedRedGoalie = 0;
              this.bluePlayerBumpedGoalieY = null;
              this.redGoalieGotBumpedY = null;
              this.goalieBumpTimeout = null;
            }, 500);
          }

          const playerInterfered = playerInterferedGoalie(
            this.bluePlayerBumpedGoalieY,
            this.redGoalieGotBumpedY,
            room.getBall().getY(),
            yAtIntersection
          );

          if (isHeadingTowardsGoal && playerInterfered && player.id === this.playerBumpedRedGoalie) {
            if (!this.penalty.disabledPenalties) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
              this.playerBumpedRedGoalie = 0;
              this.penalty.disabledPenalties = true;
              room.pause();
              room.unpause();
              this.penaltyTaker = redGoalie;
              this.setPenalty(room, "red");
              room.send({
                message: `Penalty by ${player.name}!`,
                color: this.redTextColor,
                style: "bold",
              });
              room.send({
                message: `O jogador bateu no Goleiro adversário`,
                color: this.redTextColor,
                style: "bold",
              });
            }
          }
        }
        break;
      case "blue":
        const blueGoalie = this.getGoalie(room, "blue");
        if (blueGoalie) {
          const goalieBumped =
            player.distanceTo(blueGoalie) < 0.1 &&
            calculateTotalSpeed(player.getVelocityX(), player.getVelocityY()) >= 0.2 &&
            player.getTeam() === 1 &&
            this.insideGoalieBox(blueGoalie.getX(), blueGoalie.getY(), "blue") &&
            player.id !== this.lastPlayerTouch &&
            blueGoalie?.id !== this.lastPlayerTouch;

          const { isHeadingTowardsGoal, yAtIntersection } = headingTowardsGoal(puck.getX(), puck.getY(), puck.getVelocityX(), puck.getVelocityY(), 2);

          if (goalieBumped) {
            this.playerBumpedBlueGoalie = player.id;
            this.redPlayerBumpedGoalieY = player.getY();
            this.blueGoalieGotBumpedY = blueGoalie.getY();
            if (this.goalieBumpTimeout) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
            }

            this.goalieBumpTimeout = setTimeout(() => {
              this.playerBumpedBlueGoalie = 0;
              this.redPlayerBumpedGoalieY = null;
              this.blueGoalieGotBumpedY = null;
              this.goalieBumpTimeout = null; // Reset the timer reference
            }, 500);
          }

          const playerInterfered = playerInterferedGoalie(
            this.redPlayerBumpedGoalieY,
            this.blueGoalieGotBumpedY,
            room.getBall().getY(),
            yAtIntersection
          );

          if (isHeadingTowardsGoal && playerInterfered && player.id === this.playerBumpedBlueGoalie) {
            if (!this.penalty.disabledPenalties) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
              this.playerBumpedBlueGoalie = 0;
              this.penalty.disabledPenalties = true;
              room.pause();
              room.unpause();
              this.penaltyTaker = blueGoalie;
              this.setPenalty(room, "blue");
              room.send({
                message: `Penalty by ${player.name}!`,
                color: this.blueTextColor,
                style: "bold",
              });
              room.send({
                message: `O jogador bateu no Goleiro adversário`,
                color: this.blueTextColor,
                style: "bold",
              });
            }
          }
        }
        break;
    }
  }

  getGoalie(room: Room, team: "red" | "blue"): Player | undefined {
    switch (team) {
      case "red":
        for (const redPlayer of room.getPlayers().red()) {
          if (redPlayer.settings.goalie == 1 || redPlayer.settings.penaltyGoalie == 1) {
            return redPlayer;
          }
        }
      case "blue":
        for (const bluePlayer of room.getPlayers().blue()) {
          if (bluePlayer.settings.goalie == 2 || bluePlayer.settings.penaltyGoalie == 2) {
            return bluePlayer;
          }
        }
    }
  }

  setDiscPosition(disc: Player | Disc, x: number, y: number, xSpeed: number = 0, ySpeed: number = 0) {
    disc.setPosition({ x: x, y: y });
    disc.setVelocityX(xSpeed);
    disc.setVelocityY(ySpeed);
  }

  getTeamName(team: Team) {
    return team === Team.Red ? "Red" : "Blue";
  }

  getScoreMessage() {
    return `Red ${this.scoreRed} • ${this.scoreBlue} Blue`;
  }

  getDefaultMap() {
    return JSON.parse(JSON.stringify(HockeyMap));
  }

  addPlayerToTeamHistory(player: Player, room: Room) {
    this.teamPlayersHistory.push({
      id: player.id,
      name: player.name,
      timeJoin: room.getScores().time,
      team: player.getTeam(),
      auth: player.auth,
      registered: player.roles.includes(Global.loggedRole),
    });
  }

  invertTeam(team: Team) {
    return team === Team.Red ? Team.Blue : Team.Red;
  }
}

export default Game;
