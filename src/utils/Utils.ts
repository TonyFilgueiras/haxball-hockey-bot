import { MessageObject, Team } from "../core/Global";
import Player from "../core/Player";
import Room from "../core/Room";

export default class Utils {
    static getFormattedSeconds(time: number) {
        if (time < 60) {
            return `${time} segundo${time > 1 || time < -1 ? "s" : ""}`;
        } else if (time >= 60 && time < 3600) {
            return `${~~(time / 60)} minuto${time >= 120 ? "s" : ""}`;
        } else if (time >= 3600) {
            return `${~~((time / 60) / 60)} hora${time >= 7200 ? "s" : ""}`;
        } else {
            return time + "";
        }
    }

    static fancyTimeFormat(duration: number) {   
        let hrs = ~~(duration / 3600);
        let mins = ~~((duration % 3600) / 60);
        let secs = ~~duration % 60;
    
        let ret = "";
    
        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }
    
        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;

        return ret;
    }

    static getPlayersNames(players: Player[] | { name: string }[]) {
        let playersNames = players.map(p => `${p.name}`);
    
        if (players.length > 1) {
            return `${playersNames.slice(0, -1).join(", ")} e ${playersNames.slice(-1)}`;
        } else {
            return playersNames[0];
        }
    }

    static sendSoundTeamMessage(room: Room, message: MessageObject) {
        room.getPlayers().forEach(p => {
            if (p.getTeam() !== Team.Spectators) {
                p.reply({ ...message, sound: 2 });
            } else {
                p.reply({ ...message });
            }
        });
    }

    static objectsToCSV(arr: any[], order: string[]): string {
        let csv: string[] = [];

        csv.push(order.join(","));

        for (const row of arr) {
            const r: string[] = [];

            for (const elemName of order) {
                r.push(row[elemName] ?? "");
            }

            csv.push(r.join(","));
        }

        return csv.join("\n");
    }
}