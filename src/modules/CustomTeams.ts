import Command, { CommandInfo } from "../core/Command";
import { Team } from "../core/Global";
import Module from "../core/Module";

import type Room from "../core/Room";

import teams from "../teams.json";
import * as Global from "../Global";
import translate from "../utils/Translate";
import capitalizeFirstLetter from "../functions/capitalizeFirstLetter";

export type CustomTeam = {
  name: string;
  category: string;
  angle: number;
  textColor: number;
  colors: number[];
  ballColor: number;
};

class CustomTeams extends Module {
  private teamList: CustomTeam[];
  private teams: { red: CustomTeam; blue: CustomTeam };
  private maintainTeam: Team;

  constructor(room: Room) {
    super();

    this.teamList = Object.entries(teams).map(([name, uniform]) => {
      const uniformColor = uniform.color.replace("/colors red ", "").split(" ");

      const toColor = (str: string) => Number("0x" + str);

      return {
        name,
        category: uniform.category,
        angle: Number(uniformColor[0]),
        textColor: toColor(uniformColor[1]),
        colors: [uniformColor[2], uniformColor[3], uniformColor[4]].map((c) => toColor(c)),
        ballColor: toColor(uniform.ballColor),
      };
    });

    this.setNextGameTeams(room);

    room.on("gameStart", () => {
      try {
        this.setNextGameTeams(room);
        this.setUniforms(room);
        room.send({
          message: `​🏑​ ${capitalizeFirstLetter(this.teams.red.name)} x ${capitalizeFirstLetter(this.teams.blue.name)}`,
          color: Global.Color.LimeGreen,
          style: "bold",
        });
      } catch (e) {
        console.log(e);
      }
    });
  }

  private setNextGameTeams(room: Room) {
    const maintainTeam = this.maintainTeam ? (this.maintainTeam === Team.Red ? this.teams.red : this.teams.blue) : null;
    const randomRedTeam = this.getRandomRedTeam(maintainTeam?.category);
    const randomBlueTeam = this.getRandomBlueTeam(maintainTeam ? maintainTeam.category : randomRedTeam.category);

    this.teams = {
      red: this.maintainTeam === Team.Red ? maintainTeam : randomRedTeam,
      blue: this.maintainTeam === Team.Blue ? maintainTeam : randomBlueTeam,
    };

    this.maintainTeam = null;
  }

  private getRandomRedTeam(categoryFilter?: string) {
    const filteredTeams = this.teamList.filter((t) => t.category !== "BLUE" && t.category !== categoryFilter);

    const randomIndex = Math.floor(Math.random() * filteredTeams.length);
    return filteredTeams[randomIndex];
  }

  private getRandomBlueTeam(categoryFilter?: string) {
    // Filter the team list based on the category.
    const filteredTeams = this.teamList.filter((t) => t.category !== "RED" && t.category !== categoryFilter);

    const randomIndex = Math.floor(Math.random() * filteredTeams.length);
    return filteredTeams[randomIndex];
  }

  private setUniforms(room: Room) {
    room.setTeamColors(Team.Red, this.teams.red);
    room.setTeamColors(Team.Blue, this.teams.blue);
    room.emit("uniformChanged", this.teams.red, this.teams.blue);
  }

  public swapTeams(room: Room) {
    const red = JSON.parse(JSON.stringify(this.teams.red));
    const blue = JSON.parse(JSON.stringify(this.teams.blue));

    this.teams.red = blue;
    this.teams.blue = red;

    if (this.maintainTeam) this.maintainTeam = this.maintainTeam === Team.Red ? Team.Blue : Team.Red;

    this.setUniforms(room);
  }

  public getTeams() {
    return this.teams;
  }

  public teamBallColor() {
    return { red: this.teams.red.ballColor, blue: this.teams.blue.ballColor };
  }

  public setTeam(teamID: Team, customTeam: CustomTeam) {
    if (teamID === Team.Red) {
      this.teams.red = customTeam;
    } else if (teamID === Team.Blue) {
      this.teams.blue = customTeam;
    }
  }

  public setTeamToMaintainUniform(team: Team) {
    this.maintainTeam = team;
  }

  @Command({
    name: "setteam",
  })
  setteamCommand($: CommandInfo, room: Room) {
    if (!$.caller.isAdmin()) {
      $.caller.reply({ message: translate("NOT_ADMIN"), sound: 2, color: Global.Color.Orange, style: "bold" });

      return false;
    }

    if (!room.isGameInProgress()) {
      $.caller.reply({ message: translate("GAME_NOT_IN_PROGRESS"), sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    const teamStr = $.args[0];
    const customTeamStr = $.args[1];

    let team;
    let customTeam = this.teamList.find(
      (team) =>
        team.name
          .toLowerCase()
          .replace(/[^\S ]+/, "")
          .toLowerCase()
          .replace(/[^\S ]+/, "") === customTeamStr?.toLowerCase()?.replace(/[^\S ]+/, "")
    );

    if (teamStr === "red") {
      team = Team.Red;
    } else if (teamStr === "blue") {
      team = Team.Blue;
    } else {
      $.caller.reply({ message: translate("INVALID_TEAM", room.prefix), sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    if (!customTeam) {
      $.caller.reply({ message: translate("TEAM_NOT_FOUND", room.prefix), sound: 2, color: Global.Color.Tomato, style: "bold" });

      return false;
    }

    room.send({
      message: translate("CHANGED_TEAM_COLORS", $.caller.name, team === Team.Red ? "Red" : "Blue", customTeam.name),
      color: Global.Color.Pink,
      style: "bold",
    });

    this.setTeam(team, customTeam);
    this.setUniforms(room);

    return false;
  }

  @Command({
    name: "teamlist",
  })
  teamlistCommand($: CommandInfo, room: Room) {
    $.caller.reply({
      message: translate("TEAM_LIST", this.teamList.length, this.teamList.map((p) => p.name).join(", ")),
      color: Global.Color.Tomato,
      style: "bold",
    });

    return false;
  }
}

export default CustomTeams;
