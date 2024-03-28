import { Team } from "../../core/Global";
import Module from "../../core/Module";
import Player from "../../core/Player";
import Room from "../../core/Room";
import shuffleArray from "../../functions/shuffleArray";
import Game from "../Game";
import HandleTime from "../HandleTime";
import * as Global from "../../Global";

export default class RoomQueue extends Module {
  public redPlayers: Player[] = [];
  public bluePlayers: Player[] = [];
  public specPlayers: Player[] = [];

  public teamMaximumSize = 4;

  public scoreRed = 0;
  public scoreBlue = 0;
  public scoreRedShootout = 0;
  public scoreBlueShootout = 0;

  public shootoutMode = false;

  public roomIsEmpty: boolean;

  constructor(room: Room) {
    super();

    room.on("handleShootout", (shootoutBegun) => {
      if (shootoutBegun) {
        this.shootoutMode = shootoutBegun;
        this.scoreRedShootout = 0;
        this.scoreBlueShootout = 0;
      } else {
        this.shootoutMode = shootoutBegun;
      }
    });

    room.on("gameStart", () => {
      this.redPlayers.map((player) => {
        player.settings.enteredMidGame = false;
        player.settings.leftMidGame = false;
      });
      this.bluePlayers.map((player) => {
        player.settings.enteredMidGame = false;
        player.settings.leftMidGame = false;
      });
      this.specPlayers.map((player) => {
        player.settings.enteredMidGame = false;
        player.settings.leftMidGame = false;
      });
    });

    room.on("afk", (player) => {
      this.setAFK(room, player);
      try {
        if (this.shootoutMode) return;

        const avaiableSpecs = this.specPlayers.filter((player) => {
          !player.settings.afk
        })

        if (avaiableSpecs.length > 0) {
          if (this.redPlayers.length < this.teamMaximumSize) {
            this.movePlayer(room, avaiableSpecs[0], 1, avaiableSpecs[0].getTeam());
          }
          if (this.bluePlayers.length < this.teamMaximumSize) {
            this.movePlayer(room, avaiableSpecs[0], 2, avaiableSpecs[0].getTeam());
          }
        } else {
          if (this.redPlayers.length > this.bluePlayers.length + 1) {
            const filteredRedTeam = this.redPlayers.filter((p) => p !== player);
            if (filteredRedTeam.length > 0) {
              this.movePlayer(room, filteredRedTeam[filteredRedTeam.length - 1], 2, filteredRedTeam[filteredRedTeam.length - 1].getTeam());
            }
          }
          if (this.bluePlayers.length > this.redPlayers.length + 1) {
            const filteredBlueTeam = this.bluePlayers.filter((p) => p !== player);
            if (filteredBlueTeam.length > 0) {
              this.movePlayer(room, filteredBlueTeam[filteredBlueTeam.length - 1], 1, filteredBlueTeam[filteredBlueTeam.length - 1].getTeam());
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    });

    room.on("unafk", (player) => {
      if (room.isGameInProgress()) player.settings.lastActivity = room.getScores().time;

      if (!this.shootoutMode) {
        if (this.redPlayers.length < this.teamMaximumSize && this.redPlayers.length <= this.bluePlayers.length) {
          this.movePlayer(room, player, 1, 0);
        } else if (this.bluePlayers.length < this.teamMaximumSize) {
          this.movePlayer(room, player, 2, 0);
        } 
        if (!room.isGameInProgress()) room.start();
      }
    });

    room.on("gameStop", () => {
      let teamLost = 0;

      if (this.shootoutMode) {
        teamLost = this.scoreRedShootout > this.scoreBlueShootout ? Team.Blue : this.scoreBlueShootout > this.scoreRedShootout ? Team.Red : 0;
      } else {
        teamLost = this.scoreRed > this.scoreBlue ? Team.Blue : this.scoreBlue > this.scoreRed ? Team.Red : 0;
      }

      if (this.specPlayers.length > 0 && teamLost !== 0) {
        this.benchLosingTeam(room, teamLost);
      } else {
        if (!this.shootoutMode) {
          this.randomizeTeamsPlayers(room);
        }
      }
      if (!this.roomIsEmpty) this.restartGame(room);
      this.scoreRed = 0;
      this.scoreBlue = 0;
      this.scoreRedShootout = 0;
      this.scoreBlueShootout = 0;
    });

    room.on("teamGoal", (team) => {
      if (this.shootoutMode) {
        team == 1 ? this.scoreRedShootout++ : this.scoreBlueShootout++;
      } else {
        team == 1 ? this.scoreRed++ : this.scoreBlue++;
      }
    });

    room.on("playerJoin", (player) => {
      this.roomIsEmpty = false;
      if (room.isGameInProgress()) player.settings.lastActivity = room.getScores().time;

      if (!this.shootoutMode) {
        if (this.redPlayers.length < this.teamMaximumSize && this.redPlayers.length <= this.bluePlayers.length) {
          this.movePlayer(room, player, 1, 0);
        } else if (this.bluePlayers.length < this.teamMaximumSize) {
          this.movePlayer(room, player, 2, 0);
        } else {
          this.specPlayers.push(player);
        }
        if (!room.isGameInProgress()) room.start();
      } else {
        this.specPlayers.push(player);
      }
    });

    room.on("playerLeave", (player) => {
      try {
        this.updateQueueAndTeams(player, player.getTeam());
        if (this.shootoutMode) return;

        const avaiableSpecs = this.specPlayers.filter((player) => {
          !player.settings.afk
        })

        if (avaiableSpecs.length > 0) {
          if (this.redPlayers.length < this.teamMaximumSize) {
            this.movePlayer(room, avaiableSpecs[0], 1, avaiableSpecs[0].getTeam());
          }
          if (this.bluePlayers.length < this.teamMaximumSize) {
            this.movePlayer(room, avaiableSpecs[0], 2, avaiableSpecs[0].getTeam());
          }
        } else {
          if (this.redPlayers.length > this.bluePlayers.length + 1) {
            const filteredRedTeam = this.redPlayers.filter((p) => p !== player);
            if (filteredRedTeam.length > 0) {
              this.movePlayer(room, filteredRedTeam[filteredRedTeam.length - 1], 2, filteredRedTeam[filteredRedTeam.length - 1].getTeam());
            }
          }
          if (this.bluePlayers.length > this.redPlayers.length + 1) {
            const filteredBlueTeam = this.bluePlayers.filter((p) => p !== player);
            if (filteredBlueTeam.length > 0) {
              this.movePlayer(room, filteredBlueTeam[filteredBlueTeam.length - 1], 1, filteredBlueTeam[filteredBlueTeam.length - 1].getTeam());
            }
          }
        }
        if (room.getPlayers().size == 0) {
          this.roomIsEmpty = true;
          room.stop();
        }
      } catch (e) {
        console.log(e);
      }
    });

    room.on("gameTick", () => {
      try {
        const nonSpectators = room.getPlayers().filter((player) => player.getTeam() !== Team.Spectators);

        nonSpectators.forEach((player) => {
          this.handleAFK(room, player);
        });
      } catch (e) {
        console.log(e);
      }
    });

    room.on("playerTeamChanged", (changedPlayer, byPlayer) => {
      changedPlayer.settings.almostAfk = false;
      if (byPlayer) {
        this.redPlayers = this.redPlayers.filter((player) => {
          player.id !== changedPlayer.id;
        });
        this.bluePlayers = this.bluePlayers.filter((player) => {
          player.id !== changedPlayer.id;
        });
        this.specPlayers = this.specPlayers.filter((player) => {
          player.id !== changedPlayer.id;
        });
        this.updateQueueAndTeams(changedPlayer, 0, changedPlayer.getTeam());
      }
    });

    room.on("playerActivity", (player) => {
      try {
        if (player.getTeam() !== 0 && room.getScores() && !room.isGamePaused()) {
          this.updatePlayerLastActivity(room, player);
        } else if (player.getTeam() == 0 && player.settings.afk == true) {
          this.updatePlayerLastActivity(room, player);
          if (this.shootoutMode) return;

          player.settings.almostAfk = false;
          player.settings.afk = false;
          if (this.redPlayers.length < this.teamMaximumSize && this.redPlayers.length <= this.bluePlayers.length) {
            this.movePlayer(room, player, 1, 0);
          } else if (this.bluePlayers.length < this.teamMaximumSize) {
            this.movePlayer(room, player, 2, 0);
          }
          if (!room.isGameInProgress()) room.start();
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  benchLosingTeam(room: Room, teamBeingBenched: Team) {
    try {
      if (teamBeingBenched == Team.Red) {
        this.redPlayers.map((player) => {
          if (!player.settings.enteredMidGame) {
            this.movePlayer(room, player, 0, 1);
          }
        });
      } else if (teamBeingBenched == Team.Blue) {
        this.bluePlayers.map((player) => {
          if (!player.settings.enteredMidGame) {
            this.movePlayer(room, player, 0, 2);
          }
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  randomizeTeamsPlayers(room: Room) {
    this.benchLosingTeam(room, 1);
    this.benchLosingTeam(room, 2);

    shuffleArray(this.specPlayers);

    this.specPlayers.forEach((player) => {
      if (this.redPlayers.length < this.teamMaximumSize && this.redPlayers.length <= this.bluePlayers.length) {
        if (!player.settings.afk) {
          
          this.movePlayer(room, player, 1, 0); // Move to red team
        }
      } else if (this.bluePlayers.length < this.teamMaximumSize) {
        if (!player.settings.afk) {
          
          this.movePlayer(room, player, 2, 0); // Move to blue team
        }
      }
    });
  }

  restartGame(room: Room) {
    this.specPlayers.map((player) => {
      if (this.redPlayers.length < this.teamMaximumSize && this.redPlayers.length <= this.bluePlayers.length) {
        if (!player.settings.afk) {
          this.movePlayer(room, player, 1, 0);
        }
      } else if (this.bluePlayers.length < this.teamMaximumSize) {
        if (!player.settings.afk) {
          this.movePlayer(room, player, 2, 0);
        }
      }
    });

    setTimeout(() => {
      room.start();
    }, 2000);
  }

  movePlayer(room: Room, player: Player, toTeam: TeamID, fromTeam: TeamID) {
    try {
      room.setTeam(player.id, toTeam);
      if (!player.settings.afk) {
        this.updateQueueAndTeams(player, fromTeam, toTeam);
      }
      if (room.isGameInProgress()) {
        if ((room.getScores().time > 20 || room.getScores().red !== room.getScores().blue) && !player.settings.leftMidGame) {
          room.send({ message: `${player.name} entrou no meio de jogo`, color: Global.Color.YellowGreen, style: "bold" });
          player.settings.enteredMidGame = true;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  setAFK(room: Room, player: Player) {
    if (!player.settings.afk && player.getTeam() !== 0) {
      room.send({ message: `${player.name} está AFK 😴😴`, color: Global.Color.SlateGray, style: "bold" });
      player.settings.almostAfk = false;
      player.settings.leftMidGame = true;
      player.settings.afk = true;

      try {
        room.setTeam(player.id, 0);
        this.updateQueueAndTeams(player, player.getTeam(), 0);
      } catch (e) {
        console.log(e);
      }
    }
  }

  handleAFK(room: Room, player: Player) {
    if (room.getScores()) {
      if (room.getScores().time - player.settings.lastActivity >= 10 && !player.settings.almostAfk) {
        player.settings.almostAfk = true;
        player.reply({ message: "Tu vai ficar afk", color: Global.Color.GreenYellow, style: "bold", sound: 2 });
      } else if (room.getScores().time - player.settings.lastActivity >= 15) {
        room.emit("afk", player);
      }
    }
  }

  updatePlayerLastActivity(room: Room, player: Player) {
    try {
      if (room.isGameInProgress()) {
        player.settings.lastActivity = room.getScores().time;
      }
    } catch (e) {
      console.log(e);
    }
  }

  updateQueueAndTeams(playerMoved: Player, fromTeamMoved: Team, toTeamMoved?: Team) {
    switch (fromTeamMoved) {
      case 0:
        this.specPlayers = this.specPlayers.filter((player) => player.id !== playerMoved.id);
        break;
      case 1:
        this.redPlayers = this.redPlayers.filter((player) => player.id !== playerMoved.id);
        break;
      case 2:
        this.bluePlayers = this.bluePlayers.filter((player) => player.id !== playerMoved.id);
        break;
      default:
        break;
    }

    switch (toTeamMoved) {
      case 0:
        this.specPlayers.push(playerMoved);
        break;
      case 1:
        this.redPlayers.push(playerMoved);
        break;
      case 2:
        this.bluePlayers.push(playerMoved);
        break;
      default:
        break;
    }

    console.log("-======-=-=-=-=-=-=----------=============-----------===========----------======-----=-=-=");
    this.specPlayers.forEach((player) => {
      console.log(`spec = ${player.name}`);
    });
    this.redPlayers.forEach((player) => {
      console.log(`red = ${player.name}`);
    });
    this.bluePlayers.forEach((player) => {
      console.log(`blue = ${player.name}`);
    });
  }
}
