import { Room } from "haxball-extended-room";

export default function headingTowardsGoal(
    xInitial: number,
    yInitial: number,
    xVelocity: number,
    yVelocity: number,
    team : 1 | 2
): boolean {
    var goalXAxis = 760
    team == 2? goalXAxis = 760: goalXAxis = -760
    // Calculate time of intersection
    const t = (goalXAxis - xInitial) / xVelocity;

    if (xInitial < -760 || xInitial > 760) {
        return false
    }
  
    // Calculate y-coordinate at time t using y-axis motion equation
    const yAtIntersection = yInitial + yVelocity * t;

    // Check if the y-coordinate falls within the y-range of the line segment
    return yAtIntersection > -97 && yAtIntersection < 97 && t < 80;
  }
  