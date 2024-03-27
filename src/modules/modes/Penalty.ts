import Room from "../../core/Room";
import Game, { GameModes } from "../Game";
import * as Global from "../../Global";
import Player from "../../core/Player";
import { Mode } from "./Mode";
import getClosestPlayer from "../../functions/getClosestPlayer";
import { Team } from "../../core/Global";

export enum PenaltyTeams {
  NoPenalty = 0,
  PenaltyRed = 1,
  PenaltyBlue = 2,
}

export default class Penalty extends Mode {
  name = "penalty";
  mode = GameModes.Penalty;

  public teamTakingPenalty: PenaltyTeams;

  public disabledPenalties = false;
  public penaltyDetected = 0;

  public penaltyTimer = 0;
  public penaltyKickerReleased = false;
  public penaltyKickers = 0;
  public penaltyTakerTeam = 0;
  public penaltyTakerId = 0;

  constructor(room: Room, game: Game) {
    super(game);

    room.on("teamGoal", (team) => {
      if (this.penaltyDetected) {
        room.send({ message: `Gol! Segue o jogo!`, color: team == 1 ? this.game.redTextColor : this.game.blueTextColor, style: "bold" });
        this.penaltyDetected = 0;
      }
      this.penaltyKickers = 0;
      this.penaltyTimer = 0;
      this.disabledPenalties = true;
      this.game.playerBumpedBlueGoalie = 0;
      this.game.playerBumpedRedGoalie = 0;
    });

    room.on("gameTick", () => {
      if (this.game.mode === GameModes.Game) return;

      this.checkingForPenaltiesOnTick(room);

      this.penaltyTimer++;
      if (this.teamTakingPenalty === PenaltyTeams.PenaltyRed) {
        this.checkForMissedPenalty(room, "penred");
      } else if (this.teamTakingPenalty === PenaltyTeams.PenaltyBlue) {
        this.checkForMissedPenalty(room, "penblue");
      }
    });

    room.on("playerLeave", (player: Player) => {
      if (this.game.mode !== this.mode) return;

      if (player.id == this.game.penaltyTaker.id) {
      }

      if (this.teamTakingPenalty === PenaltyTeams.PenaltyRed && (player.settings.goalie == 1 || player.settings.penaltyGoalie == 1)) {
        room.send({ message: "Goleiro saiu no meio da cobrança", color: this.game.redTextColor, style: "bold", sound: 2 });
        this.game.setPenalty(room, "red");
      } else if (this.teamTakingPenalty === PenaltyTeams.PenaltyBlue && (player.settings.goalie == 2 || player.settings.penaltyGoalie == 2)) {
        room.send({ message: "Goleiro saiu no meio da cobrança", color: this.game.blueTextColor, style: "bold", sound: 2 });
        this.game.setPenalty(room, "blue");
      }
    });

    // room.on("playerBallKick", (player: Player) => {
    //   if (this.game.mode === GameModes.Game) return;

    //   this.checkingForPenaltiesOnKick(room, player);

    //   if (this.mode !== GameModes.Game) {
    //     const previousPlayerTouchOnDisc = this.game.lastPlayerTouch;
    //     this.game.detectLastPlayerTouch(room, player, true);
    //     if (this.penaltyKickerReleased && !this.disabledPenalties) {
    //       if (this.teamTakingPenalty === PenaltyTeams.PenaltyRed && player.getTeam() == 1) {
    //         this.game.kickoffAfterMissedPenalty(room, 500, "O jogador soltou o disco");
    //       } else if (this.teamTakingPenalty === PenaltyTeams.PenaltyBlue && player.getTeam() == 2) {
    //         this.game.kickoffAfterMissedPenalty(room, -500, "O jogador soltou o disco");
    //       }
    //     } else if (player.id !== previousPlayerTouchOnDisc) {
    //       this.penaltyKickers++;
    //       if (this.penaltyKickers > 1 && !this.disabledPenalties) {
    //         if (this.teamTakingPenalty === PenaltyTeams.PenaltyRed && player.getTeam() == 1) {
    //           this.game.kickoffAfterMissedPenalty(room, 500, "Só pode um jogador bater o penal");
    //         } else if (this.teamTakingPenalty === PenaltyTeams.PenaltyBlue && player.getTeam() == 2) {
    //           this.game.kickoffAfterMissedPenalty(room, -500, "Só pode um jogador bater o penal");
    //         }
    //         this.penaltyKickers = 0;
    //       }
    //     }
    //   }
    // });
  }

  checkingForPenaltiesOnTick(room: Room) {
    for (const redPlayer of room.getPlayers().red()) {
      this.game.goalieIllegalTouch(room, redPlayer);
      this.game.illegalTouchInGoalieBox(room, redPlayer, "red");
      this.game.touchedDisc(room, redPlayer);
      this.game.goalieBump(room, redPlayer, "blue");
    }

    for (const bluePlayer of room.getPlayers().blue()) {
      this.game.goalieIllegalTouch(room, bluePlayer);
      this.game.illegalTouchInGoalieBox(room, bluePlayer, "blue");
      this.game.touchedDisc(room, bluePlayer);
      this.game.goalieBump(room, bluePlayer, "red");
    }
  }

  checkingForPenaltiesOnKick(room: Room, player: Player) {
    const previousPenaltyTaker = this.game.penaltyTaker
    if (player.getTeam() == 1) {
      const opposingTeam = room.getPlayers().blue();
      if (!player.settings.goalie && !player.settings.penaltyGoalie) {
        if (this.game.insideGoalieBox(player.getX(), player.getY(), "red") && !this.disabledPenalties) {
          this.game.penaltyTaker = getClosestPlayer(player, opposingTeam);
          
          this.game.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", 1);
        }
      } else if (player.settings.goalie || player.settings.penaltyGoalie) {
        if (this.game.goalieOutsideBox(player)) {
          const previousTeamTouchOnDisc = this.game.lastTeamTouch;

          if (previousTeamTouchOnDisc === 2 && !this.disabledPenalties) {
            this.game.penaltyTaker =
            this.game.mode === GameModes.Shootout ? previousPenaltyTaker : room.getPlayer(this.game.lastPlayerTouch);
            this.game.detectPenalty(room, player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 1);
          }
        }
      }
    } else if (player.getTeam() == 2) {
      const opposingTeam = room.getPlayers().red();
      if (!player.settings.goalie && !player.settings.penaltyGoalie) {
        if (this.game.insideGoalieBox(player.getX(), player.getY(), "blue") && !this.disabledPenalties) {
          this.game.penaltyTaker = getClosestPlayer(player, opposingTeam);

          this.game.detectPenalty(room, player, "O animal pegou a bola dentro da área sem ser goleiro!", 2);
        }
      } else if (player.settings.goalie || player.settings.penaltyGoalie) {
        if (this.game.goalieOutsideBox(player)) {
          const previousTeamTouchOnDisc = this.game.lastTeamTouch;

          if (previousTeamTouchOnDisc === 1 && !this.disabledPenalties) {
            this.game.penaltyTaker =
            this.game.mode === GameModes.Shootout ? previousPenaltyTaker : room.getPlayer(this.game.lastPlayerTouch);
            this.game.detectPenalty(room, player, "O animal tocou no disco fora da area de goleiro apos o toque do adversário", 2);
          }
        }
      }
    }
    this.game.detectLastPlayerTouch(room, player);
  }

  checkForMissedPenalty(room: Room, mode: "penred" | "penblue") {
    const puck = room.getBall();
    const redTeam = room.getPlayers().red();
    const blueTeam = room.getPlayers().blue();

    const penaltyMissedEnabled = !this.penaltyDetected && !this.disabledPenalties && this.penaltyTimer > 100;

    const missedGoal =
      mode == "penred"
        ? puck.getX() >= 760 && (puck.getY() > 97 || puck.getY() < -97)
        : puck.getX() <= -760 && (puck.getY() > 97 || puck.getY() < -97);

    const discWentWentTooWide = puck.getY() > 210 || puck.getY() < -210;
    const discWentBackwards =
      mode == "penred"
        ? puck.getVelocityX() < -0.5 && !this.game.insideGoalieBox(puck.getX(), puck.getY(), "blue")
        : puck.getVelocityX() > 0.5 && puck.getX() > -760 && !this.game.insideGoalieBox(puck.getX(), puck.getY(), "red");
    const penaltyTimerExpired = this.penaltyTimer > 600;
    switch (mode) {
      case "penred":
        if (penaltyMissedEnabled) {
          if (missedGoal) {
            this.game.kickoffAfterMissedPenalty(room, 500, "O jogador errou o gol");
          } else if (discWentWentTooWide) {
            this.game.kickoffAfterMissedPenalty(room, 500, "O disco foi pra lateral");
          } else if (discWentBackwards) {
            this.game.kickoffAfterMissedPenalty(room, 500, "O disco foi pra trás");
          } else if (penaltyTimerExpired) {
            this.game.kickoffAfterMissedPenalty(room, 500, "Tempo expirou (10seg)");
          }
          redTeam.forEach((p) => {
            if (this.penaltyCarrierChange(room, p)) {
              this.game.kickoffAfterMissedPenalty(room, 500, "Só pode um jogador bater o penal");
            } else if (this.penaltyTakerReleasedDisc(room, p)) {
              this.game.kickoffAfterMissedPenalty(room, 500, "O jogador soltou o disco");
            }
          });
        }
        break;
      case "penblue":
        if (penaltyMissedEnabled) {
          if (missedGoal) {
            this.game.kickoffAfterMissedPenalty(room, -500, "O jogador errou o gol");
          } else if (discWentWentTooWide) {
            this.game.kickoffAfterMissedPenalty(room, -500, "O disco foi pra lateral");
          } else if (discWentBackwards) {
            this.game.kickoffAfterMissedPenalty(room, -500, "O disco foi pra trás");
          } else if (penaltyTimerExpired) {
            this.game.kickoffAfterMissedPenalty(room, -500, "Tempo expirou (10seg)");
          }
          blueTeam.forEach((p) => {
            if (this.penaltyCarrierChange(room, p)) {
              this.game.kickoffAfterMissedPenalty(room, -500, "Só pode um jogador bater o penal");
            } else if (this.penaltyTakerReleasedDisc(room, p)) {
              this.game.kickoffAfterMissedPenalty(room, -500, "O jogador soltou o disco");
            }
          });
        }
        break;
    }
  }

  penaltyCarrierChange(room: Room, player: Player): boolean {
    const previousPlayerTouchOnDisc = this.penaltyTakerId;

    if (this.game.touchedDisc(room, player, true) && player.id !== previousPlayerTouchOnDisc) {
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
    if (this.game.touchedDisc(room, player)) {
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
}
