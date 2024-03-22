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

export enum GameModes {
  Game = 1,
  PenaltyRed = 2,
  PenaltyBlue = 3,
}

class Game extends Module {
  public gameCommands: GameCommands;
  public customAvatarManager: CustomAvatarManager;

  public mode: GameModes;

  public scoreRed = 0;
  public scoreBlue = 0;

  public teamPlayersHistory: Global.TeamPlayersHistory = [];

  public overtime = false;
  public gameStopped = false;
  public lastPlayMessageSent = false;

  public timeLimit = 5;
  public scoreLimit = 3;

  public stadium = this.getDefaultMap();

  public gameTime: number;
  public gameTimeSecondsToSendRec = 1 * 60;
  public endGameTime: number;

  public tickCount = 0;

  public playerBumpedRedGoalie = 0;
  public playerBumpedBlueGoalie = 0;
  public goalieBumpTimeout: NodeJS.Timeout = null;

  public disabledPenalties = false;
  public penaltyDetected = 0;

  public penaltyTimer = 0;
  public penaltyKickerReleased = false;
  public penaltyKickers = 0;
  public penaltyTakerTeam = 0;
  public penaltyTakerId = 0;

  public lastPlayerTouch = 0;
  public lastTeamTouch = 0;

  constructor(room: Room) {
    super();

    this.run(room);
  }

  private run(room: Room) {
    room.lockTeams();
    room.setScoreLimit(this.scoreLimit);
    room.setTimeLimit(this.timeLimit);
    room.setStadium(this.stadium);
    room.setTeamColors(1, { angle: 60, textColor: toColor("FFFFFF"), colors: [toColor("FF0505"), toColor("770000"), toColor("330000")] });
    room.setTeamColors(2, { angle: 60, textColor: toColor("FFFFFF"), colors: [toColor("0080FF"), toColor("004077"), toColor("002033")] });

    this.gameCommands = room.module(GameCommands, this) as GameCommands;
    this.customAvatarManager = new CustomAvatarManager(room);

    room.on("stadiumChange", (stadium, byPlayer) => {
      if (byPlayer) {
        room.setStadium(HockeyMap);
      }
    });

    room.on("teamGoal", (team) => {
      if (this.penaltyDetected) {
        room.send({ message: `Gol! Segue o jogo!`, color: team == 1 ? Global.Color.Crimson : Global.Color.CornflowerBlue, style: "bold" });
        this.penaltyDetected = 0;
      }
      this.penaltyKickers = 0;
      this.penaltyTimer = 0;
      this.disabledPenalties = true;
      this.playerBumpedBlueGoalie = 0;
      this.playerBumpedRedGoalie = 0;
    });

    room.on("playerJoin", (player: Player) => {
      player.reply({ message: "digite !help para mais informações....", color: Global.Color.Chartreuse, sound: 2 });
      player.reply({ message: "Entre no nosso discord - discord.gg/VeMMMtx2zc", color: Global.Color.Azure, style: "bold" });
    });

    room.on("playerLeave", (player: Player) => {
      const playerHist = this.teamPlayersHistory.find((p) => p.id === player.id && p.timeLeft == null);

      if (playerHist) {
        playerHist.timeLeft = room.getScores().time;
      }

      if (player.getTeam() !== Team.Spectators) room.pause();

      if (this.mode === GameModes.PenaltyRed && (player.settings.goalie || player.settings.penaltyGoalie)) {
        room.send({ message: "Goleiro saiu no meio da cobrança", color: Global.Color.Crimson, style: "bold", sound: 2 });
        this.setPenalty(room, "red");
      } else if (this.mode === GameModes.PenaltyBlue && (player.settings.goalie || player.settings.penaltyGoalie)) {
        room.send({ message: "Goleiro saiu no meio da cobrança", color: Global.Color.CornflowerBlue, style: "bold", sound: 2 });
        this.setPenalty(room, "blue");
      }
    });

    room.on("playerChat", (player, message) => {
      if (message.startsWith("!")) {
        return false;
      }
    });

    room.on("playerTeamChanged", (changedPlayer, byPlayer) => {
      console.log(changedPlayer.settings);
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
      this.mode = null;

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

      this.teamPlayersHistory = [];

      this.gameTime = null;
      this.scoreBlue = 0;
      this.scoreRed = 0;

      this.tickCount = 0;

      this.overtime = false;
      this.gameStopped = false;
      this.lastPlayMessageSent = false;
    });

    room.on("gameStart", (byPlayer: Player) => {
      this.endGameTime = room.getScores().timeLimit;
      // room.startRecording();

      this.overtime = false;

      this.teamPlayersHistory = [
        ...room
          .getPlayers()
          .teams()
          .map((p) => {
            return { id: p.id, name: p.name, timeJoin: 0, auth: p.auth, registered: p.roles.includes(Global.loggedRole), team: p.getTeam() };
          }),
      ];

      this.penaltyTimer = 0;
      this.penaltyKickers = 0;
      this.kickoff(room);
      room.pause();
      room.send({ message: "Cada time tem direito a um GO.... digite !go para ser o goleiro", color: Global.Color.Gold, style: "bold" });
      room.send({ message: "Ou joga sem goleiro e fdc eu não ligo...", color: Global.Color.Gray, style: "italic" });

      setTimeout(() => {
        room.unpause();
      }, 2000);
    });

    room.on("positionsReset", () => {
      this.kickoff(room);
    });

    room.on("gameTick", () => {
      if (this.gameStopped) return;

      this.customAvatarManager.run();

      this.gameTime = room.getScores().time;

      if (this.mode === GameModes.PenaltyRed) {
        this.penaltyTimer++;
        this.checkForMissedPenalty(room, "penred");
      } else if (this.mode === GameModes.PenaltyBlue) {
        this.penaltyTimer++;
        this.checkForMissedPenalty(room, "penblue");
      }

      for (const redPlayer of room.getPlayers().red()) {
        this.goalieIllegalTouch(room, redPlayer);
        this.illegalTouchInGoalieBox(room, redPlayer, "red");
        this.touchedDisc(room, redPlayer);
        this.goalieBump(room, redPlayer, "blue");
      }

      for (const bluePlayer of room.getPlayers().blue()) {
        this.goalieIllegalTouch(room, bluePlayer);
        this.illegalTouchInGoalieBox(room, bluePlayer, "blue");
        this.touchedDisc(room, bluePlayer);
        this.goalieBump(room, bluePlayer, "red");
      }
    });

    room.on("playerBallKick", (player) => {
      if (player.getTeam() == 1) {
        if (!player.settings.goalie && !player.settings.penaltyGoalie) {
          if (this.insideGoalieBox(player.getX(), player.getY(), "red") && !this.disabledPenalties) {
            this.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", 1);
          }
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
          if (this.goalieOutsideBox(player)) {
            const previousTeamTouchOnDisc = this.lastTeamTouch;
            if (previousTeamTouchOnDisc === 2 && !this.disabledPenalties) {
              this.detectPenalty(room, player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 1);
            }
          }
        }
      } else if (player.getTeam() == 2) {
        if (!player.settings.goalie && !player.settings.penaltyGoalie) {
          if (this.insideGoalieBox(player.getX(), player.getY(), "blue") && !this.disabledPenalties) {
            this.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", 2);
          }
        } else if (player.settings.goalie || player.settings.penaltyGoalie) {
          if (this.goalieOutsideBox(player)) {
            const previousTeamTouchOnDisc = this.lastTeamTouch;
            if (previousTeamTouchOnDisc === 1 && !this.disabledPenalties) {
              this.detectPenalty(room, player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 2);
            }
          }
        }
      }
      if (this.mode !== GameModes.Game) {
        const previousPlayerTouchOnDisc = this.lastPlayerTouch;
        this.detectLastPlayerTouch(room, player, true);
        if (this.penaltyKickerReleased && !this.disabledPenalties) {
          if (this.mode === GameModes.PenaltyRed && player.getTeam() == 1) {
            this.kickoffAfterMissedPenalty(room, 500, "O jogador soltou o disco");
          } else if (this.mode === GameModes.PenaltyBlue && player.getTeam() == 2) {
            this.kickoffAfterMissedPenalty(room, -500, "O jogador soltou o disco");
          }
        } else if (player.id !== previousPlayerTouchOnDisc) {
          this.penaltyKickers++;
          if (this.penaltyKickers > 1 && !this.disabledPenalties) {
            if (this.mode === GameModes.PenaltyRed && player.getTeam() == 1) {
              this.kickoffAfterMissedPenalty(room, 500, "Só pode um jogador bater o penal");
            } else if (this.mode === GameModes.PenaltyBlue && player.getTeam() == 2) {
              this.kickoffAfterMissedPenalty(room, -500, "Só pode um jogador bater o penal");
            }
            this.penaltyKickers = 0;
          }
        }
      }
      this.detectLastPlayerTouch(room, player);
    });
  }

  kickoff(room: Room) {
    let redPlayerSorted = 0;
    let bluePlayerSorted = 0;

    let redTeam = room.getPlayers().red();
    let blueTeam = room.getPlayers().blue();

    this.mode = GameModes.Game;
    this.disabledPenalties = false;
    this.lastTeamTouch = 0;
    this.penaltyKickerReleased = false;
    this.penaltyKickers = 0;
    this.penaltyTimer = 0;
    this.penaltyDetected = 0;
    this.playerBumpedBlueGoalie = 0;
    this.playerBumpedRedGoalie = 0;

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
      let redPlayerSorted = 0;
      let bluePlayerSorted = 0;

      this.lastTeamTouch = 0;
      this.disabledPenalties = false;
      this.penaltyKickers = 0;
      this.penaltyTimer = 0;
      this.penaltyKickerReleased = false;
      this.penaltyDetected = 0;
      this.playerBumpedBlueGoalie = 0;
      this.playerBumpedRedGoalie = 0;

      this.mode = GameModes.Game;

      room.pause();

      if (afterPenalty) {
        room.send({ message: "Penalty perdido!", color: xAxis > 0 ? Global.Color.Crimson : Global.Color.CornflowerBlue, sound: 2, style: "bold" });
        room.send({
          message: `${reasonMissedPenalty}`,
          color: xAxis > 0 ? Global.Color.Crimson : Global.Color.CornflowerBlue,
          sound: 2,
          style: "bold",
        });
      }
      room.unpause();

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

    if (!this.penaltyDetected && !this.disabledPenalties) {
      room.send({
        message: `Penalty do ${player.name}!`,
        color: team == 1 ? Global.Color.Crimson : Global.Color.CornflowerBlue,
        style: "bold",
        sound: 2,
      });
      room.send({ message: `${penalty}`, color: team == 1 ? Global.Color.Crimson : Global.Color.CornflowerBlue, style: "bold" });
    }
    this.penaltyDetected = team;
    if (this.mode === GameModes.PenaltyBlue && this.penaltyDetected === 1) {
      room.send({ message: `Gol automático!!`, color: team == 2 ? Global.Color.Crimson : Global.Color.CornflowerBlue, style: "bold", sound: 2 });
      this.setDiscPosition(puck, -755, 0, -1, 0);
    }
    if (this.mode === GameModes.PenaltyRed && this.penaltyDetected === 2) {
      room.send({ message: `Gol automático!`, color: team == 1 ? Global.Color.Crimson : Global.Color.CornflowerBlue, style: "bold", sound: 2 });
      this.setDiscPosition(puck, 755, 0, 1, 0);
    }

    if (!this.disabledPenalties) {
      setTimeout(() => {
        if (this.penaltyDetected === 2) {
          room.pause();
          room.unpause();
          this.setPenalty(room, "red");
        } else if (this.penaltyDetected === 1) {
          room.pause();
          room.unpause();
          this.setPenalty(room, "blue");
        }

        this.penaltyDetected = 0;
      }, 2000);
    }
  }
  setPenalty(room: Room, forTeam: "red" | "blue") {
    try {
      const puck = room.getBall();
      puck.setColor(0);

      this.penaltyKickers = 0;
      this.lastPlayerTouch = 0;
      this.lastTeamTouch = 0;
      this.penaltyTimer = 0;
      this.disabledPenalties = false;

      switch (forTeam) {
        case "red":
          this.mode = GameModes.PenaltyRed;

          this.penaltyTakerTeam = 1;
          this.penaltyTakerId = 0;

          break;

        case "blue":
          this.mode = GameModes.PenaltyBlue;

          this.penaltyTakerTeam = 2;
          this.penaltyTakerId = 0;

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

    switch (forTeam) {
      case "red":
        this.setDiscPosition(puck, 230, 0);

        for (let i = 0; i < redTeam.length; i++) {
          this.setDiscPosition(redTeam[i], -70, (i - 2) * 50);
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

        for (let i = 0; i < blueTeam.length; i++) {
          this.setDiscPosition(blueTeam[i], 70, (i - 2) * 50);
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

  checkForMissedPenalty(room: Room, mode: "penred" | "penblue") {
    const puck = room.getBall();
    const redTeam = room.getPlayers().red();
    const blueTeam = room.getPlayers().blue();

    const penaltyMissedEnabled = !this.penaltyDetected && !this.disabledPenalties && this.penaltyTimer > 100;

    setTimeout(() => {
      this.penaltyKickerReleased = false;
    }, 100);

    const missedGoal =
      mode == "penred"
        ? puck.getX() >= 760 && (puck.getY() > 97 || puck.getY() < -97)
        : puck.getX() <= -760 && (puck.getY() > 97 || puck.getY() < -97);

    const discWentWentTooWide = puck.getY() > 210 || puck.getY() < -210;
    const discWentBackwards =
      mode == "penred"
        ? puck.getVelocityX() < -0.5 && !this.insideGoalieBox(puck.getX(), puck.getY(), "blue")
        : puck.getVelocityX() > 0.5 && puck.getX() > -760 && !this.insideGoalieBox(puck.getX(), puck.getY(), "red");
    const penaltyTimerExpired = this.penaltyTimer > 600;
    switch (mode) {
      case "penred":
        if (penaltyMissedEnabled) {
          if (missedGoal) {
            this.kickoffAfterMissedPenalty(room, 500, "O jogador errou o gol");
          } else if (discWentWentTooWide) {
            this.kickoffAfterMissedPenalty(room, 500, "O disco foi pra lateral");
          } else if (discWentBackwards) {
            this.kickoffAfterMissedPenalty(room, 500, "O disco foi pra trás");
          } else if (penaltyTimerExpired) {
            this.kickoffAfterMissedPenalty(room, 500, "Tempo expirou (10seg)");
          }
          redTeam.forEach((p) => {
            if (this.penaltyCarrierChange(room, p)) {
              this.kickoffAfterMissedPenalty(room, 500, "Só pode um jogador bater o penal");
            } else if (this.penaltyTakerReleasedDisc(room, p)) {
              this.kickoffAfterMissedPenalty(room, 500, "O jogador soltou o disco");
            }
          });
        }
        break;
      case "penblue":
        if (penaltyMissedEnabled) {
          if (missedGoal) {
            this.kickoffAfterMissedPenalty(room, -500, "O jogador errou o gol");
          } else if (discWentWentTooWide) {
            this.kickoffAfterMissedPenalty(room, -500, "O disco foi pra lateral");
          } else if (discWentBackwards) {
            this.kickoffAfterMissedPenalty(room, -500, "O disco foi pra trás");
          } else if (penaltyTimerExpired) {
            this.kickoffAfterMissedPenalty(room, -500, "Tempo expirou (10seg)");
          }
          blueTeam.forEach((p) => {
            if (this.penaltyCarrierChange(room, p)) {
              this.kickoffAfterMissedPenalty(room, -500, "Só pode um jogador bater o penal");
            } else if (this.penaltyTakerReleasedDisc(room, p)) {
              this.kickoffAfterMissedPenalty(room, -500, "O jogador soltou o disco");
            }
          });
        }
        break;
    }
  }

  illegalTouchInsideGoalieBox(room: Room, player: Player, teamBox: "red" | "blue") {
    switch (teamBox) {
      case "red":
        if (this.insideGoalieBox(player.getX(), player.getY(), "red")) {
          if (!player.settings.goalie && player.settings.penaltyGoalie !== 1) {
            if (this.touchedDisc(room, player)) {
              this.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", 1);
            }
          }
        }
        break;
      case "blue":
        if (this.insideGoalieBox(player.getX(), player.getY(), "blue")) {
          if (!player.settings.goalie && player.settings.penaltyGoalie !== 2) {
            if (this.touchedDisc(room, player)) {
              this.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", 2);
            }
          }
        }
        break;
    }
  }

  goalieIllegalTouch(room: Room, player: Player) {
    const previousTouchOnDisc = this.lastTeamTouch;

    if (
      (player.settings.goalie || player.settings.penaltyGoalie) &&
      this.touchedDisc(room, player) &&
      this.goalieOutsideBox(player) &&
      previousTouchOnDisc !== 0
    ) {
      if (previousTouchOnDisc !== player.getTeam()) {
        const penaltyMessage = "O animal tocou no disco fora da área de goleiro após o toque do adversário";
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

    if (this.insideGoalieBox(player.getX(), player.getY(), teamBox)) {
      if (!player.settings.goalie && player.settings.penaltyGoalie !== teamGoalie) {
        if (this.touchedDisc(room, player)) {
          this.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", teamGoalie);
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

  setGoalie(room: Room, player: Player) {
    var goalieTeam: 0 | 1 | 2 = 0;
    var discPosition = 0;

    player.getTeam() === 1 ? (goalieTeam = 1) : (goalieTeam = 2);
    player.getTeam() === 1 ? (discPosition = -666) : (discPosition = 666);

    player.settings.goalie = goalieTeam;
    player.setAvatar("🧤");
    player.reply({
      message: "Para remover a posição de goalie digite !li",
      color: player.getTeam() === 1 ? Global.Color.HotPink : Global.Color.DodgerBlue,
    });
    player.reply({ message: "Voce só pode tocar na bola na:", color: player.getTeam() === 1 ? Global.Color.HotPink : Global.Color.DodgerBlue });
    player.reply({ message: "-       Zona ofensiva", color: player.getTeam() === 1 ? Global.Color.HotPink : Global.Color.DodgerBlue });
    player.reply({ message: "-       Zona atras do gol", color: player.getTeam() === 1 ? Global.Color.HotPink : Global.Color.DodgerBlue });
    player.reply({
      message: "-       Ou quando um companheiro de equipe tocar por ultimo",
      color: player.getTeam() === 1 ? Global.Color.HotPink : Global.Color.DodgerBlue,
    });
    room.send({
      message: player.getTeam() === 1 ? `${player.name} é o Goalie do Red` : `${player.name} é o Goalie do Blue`,
      color: player.getTeam() === 1 ? Global.Color.Crimson : Global.Color.CornflowerBlue,
    });
    if (room.getScores().time < 2) {
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
      this.penaltyTakerId = player.id;
      this.penaltyTakerTeam = player.getTeam();
    }
    player.getTeam() === 1 ? room.getBall().setColor(5570560) : room.getBall().setColor(85);
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

          const isHeadingTowardsGoal = headingTowardsGoal(puck.getX(), puck.getY(), puck.getVelocityX(), puck.getVelocityY(), 1);

          if (goalieBumped) {
            this.playerBumpedRedGoalie = player.id;
            if (this.goalieBumpTimeout) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
            }

            this.goalieBumpTimeout = setTimeout(() => {
              this.playerBumpedRedGoalie = 0;
              this.goalieBumpTimeout = null; // Reset the timer reference
            }, 500);
          }

          if (isHeadingTowardsGoal && player.id === this.playerBumpedRedGoalie) {
            if (!this.disabledPenalties) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
              this.playerBumpedRedGoalie = 0;
              this.disabledPenalties = true;
              room.pause();
              room.unpause();
              this.setPenalty(room, "red");
              room.send({
                message: `Penalty by ${player.name}!`,
                color: Global.Color.CornflowerBlue,
                style: "bold",
              });
              room.send({
                message: `O animal bateu no Goleiro adversário`,
                color: Global.Color.CornflowerBlue,
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

          const isHeadingTowardsGoal = headingTowardsGoal(puck.getX(), puck.getY(), puck.getVelocityX(), puck.getVelocityY(), 2);

          if (goalieBumped) {
            this.playerBumpedBlueGoalie = player.id;
            if (this.goalieBumpTimeout) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
            }

            this.goalieBumpTimeout = setTimeout(() => {
              this.playerBumpedBlueGoalie = 0;
              this.goalieBumpTimeout = null; // Reset the timer reference
            }, 500);
          }

          if (isHeadingTowardsGoal && player.id === this.playerBumpedBlueGoalie) {
            if (!this.disabledPenalties) {
              clearTimeout(this.goalieBumpTimeout); // Clear the existing timeout
              this.playerBumpedBlueGoalie = 0;
              this.disabledPenalties = true;
              room.pause();
              room.unpause();
              this.setPenalty(room, "blue");
              room.send({
                message: `Penalty by ${player.name}!`,
                color: Global.Color.Crimson,
                style: "bold",
              });
              room.send({
                message: `O animal bateu no Goleiro adversário`,
                color: Global.Color.Crimson,
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

  penaltyCarrierChange(room: Room, player: Player): boolean {
    const previousPlayerTouchOnDisc = this.penaltyTakerId;

    if (this.touchedDisc(room, player, true) && player.id !== previousPlayerTouchOnDisc) {
      this.penaltyKickers++;

      if (this.penaltyKickers > 1) {
        this.penaltyKickers = 0;
        return true;
      }
      return false;
    } else {
      return false;
    }
  }

  penaltyTakerReleasedDisc(room: Room, player: Player): boolean {
    if (this.touchedDisc(room, player)) {
      if (this.penaltyKickerReleased) {
        return true;
      }
    } else if (player.distanceTo(room.getBall()) > 2 && this.penaltyTakerId === player.id) {
      if (this.penaltyKickerReleased) return false;
      setTimeout(() => {
        this.penaltyKickerReleased = true;
      }, 100);
      return false;
    } else {
      return false;
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
