import { Team } from "../core/Global";
import MapMeasures from "./MapMeasures";

import * as Global from "../Global";
import MathUtils from "./MathUtils";
import Disc from "../core/Disc";

export default class StadiumUtils {
    static addYardsToFieldPosition(pos: Global.FieldPosition, yards: number, teamAdvancing: Team, negativeYards = false) {
        const newPos = { ...pos };
    
        if (teamAdvancing === Team.Blue) {
            newPos.yards += newPos.team === Team.Red ? -yards : yards;
        } else {
            newPos.yards += newPos.team === Team.Red ? yards : -yards;
        }
    
        if (newPos.yards > 50) {
            newPos.team = newPos.team === Team.Red ? Team.Blue : Team.Red;
            newPos.yards = 50 - (newPos.yards - 50);
        }
    
        if (!negativeYards && newPos.yards < 1) newPos.yards = 1;
    
        return newPos;
    }

    static getCoordinateFromYards({ team, yards }: Global.FieldPosition): Position;
    static getCoordinateFromYards(team: Team, yards: number): Position;
    static getCoordinateFromYards(paramOne: Team | Global.FieldPosition, paramTwo?: number) {
        const { team, yards } = typeof paramOne === "object" ? paramOne : { team: paramOne, yards: paramTwo };

        if (team === Team.Red) {
            return { x: MapMeasures.RedEndZoneLineCenter.x + (yards * MapMeasures.Yard), y: 0 };
        }
    
        return { x: MapMeasures.BlueEndZoneLineCenter.x - (yards * MapMeasures.Yard), y: 0 };
    }

    static getYardDifferenceBetweenPositions(pos1: Position, pos2: Position, team: Team) {
        let diff = Math.abs(pos1.x - pos2.x);

        if (team === Team.Red && pos1.x > pos2.x) diff = -diff;
        if(team === Team.Blue && pos1.x < pos2.x) diff = -diff

        return Math.round(diff / MapMeasures.Yard);
    }

    static getDifferenceBetweenFieldPositions(pos1: Global.FieldPosition, pos2: Global.FieldPosition, teamAdvancing?: Team) {
        let yards1, yards2;
    
        yards1 = pos1.team === Team.Blue ? (50 - pos1.yards) + 50 : pos1.yards;
        yards2 = pos2.team === Team.Blue ? (50 - pos2.yards) + 50 : pos2.yards;
    
        const diff = Math.abs(yards1 - yards2);
    
        if (teamAdvancing) {
            if (teamAdvancing === Team.Red) {
                if (yards1 > yards2) return diff;
                else return -diff;
            } else {
                if (yards1 < yards2) return diff;
                else return -diff;
            }
        } else {
            return diff;
        }
    }

    static isOutOfMap(pos: { x: number, y: number }, tolerance: number) {
        return pos.y < -Math.abs(MapMeasures.OuterField[0].y) - tolerance ||
            pos.y > Math.abs(MapMeasures.OuterField[0].y) + tolerance ||
            pos.x < -Math.abs(MapMeasures.OuterField[0].x) - tolerance ||
            pos.x > Math.abs(MapMeasures.OuterField[0].x) + tolerance;
    }

    static isInRedZone(pos: Global.FieldPosition, team: Team) {
        const coords = this.getCoordinateFromYards(pos.team, pos.yards);
    
        let redZone;
        
        if (team === Team.Red) {
            redZone = MapMeasures.RedZoneRed;
    
            return coords.x >= redZone[0].x && coords.x <= redZone[1].x && coords.y >= redZone[0].y && coords.y <= redZone[1].y;
        } else {
            redZone = MapMeasures.RedZoneBlue;
    
            return coords.x <= redZone[0].x && coords.x >= redZone[1].x && coords.y <= redZone[0].y && coords.y >= redZone[1].y;
        }
    }

    static getYardsFromXCoord(x: number): Global.FieldPosition {
        const startX = MapMeasures.RedEndZoneLineCenter.x + MapMeasures.Yard;
        const yardCount = Math.floor((x - startX) / MapMeasures.Yard) + 1;

        if (yardCount <= 50) {
            return { team: Team.Red, yards: Math.max(yardCount, 1) };
        } else {
            return { team: Team.Blue, yards: Math.max(50 - (yardCount - 50), 1) };
        }
    }

    static ballWithinGoalLine(ball: Disc, ofTeam: Team) {
        let goalLine;

        if (ofTeam === Team.Red) {
            goalLine = MapMeasures.RedGoalLine;
        } else {
            goalLine = MapMeasures.BlueGoalLine;
        }

        const ballPos = ball.getPosition();

        return Math.abs(ballPos.x) > Math.abs(goalLine[0].x) &&
            ballPos.y > goalLine[0].y && ballPos.y < goalLine[1].y;
    }
}