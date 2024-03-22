import Disc from "../core/Disc";
import Player from "../core/Player";
import Room from "../core/Room";

export default class MathUtils {
  static getBallSpeed(ball: Disc) {
    return Math.sqrt(ball.getVelocityX() * ball.getVelocityX() + ball.getVelocityY() * ball.getVelocityY());
  }

  static getBallPathFromPosition(p1: { x: number; y: number }, p2: { x: number; y: number }, length: number) {
    let ang;

    let ang1 = Math.atan2(p2.y - p1.y, p2.x - p1.x) > 0 ? 1 : -1;
    let ang2 = Math.atan2(p2.x - p1.x, p2.y - p1.y) > 0 ? 1 : -1;

    if ((ang1 > 0 && ang2 > 0) || (ang1 < 0 && ang2 > 0)) ang = 1;
    else if ((ang1 > 0 && ang2 < 0) || (ang1 < 0 && ang2 < 0)) ang = -1;

    let m = (p2.y - p1.y) / (p2.x - p1.x);

    let e = Math.sqrt(1 + m * m);

    let c = {
      x: p2.x + (length / e) * ang,
      y: p2.y + m * (length / (e * ang)),
    };

    return [c, p2];
  }

  static getDistanceBetweenPoints(p1: Position, p2: Position) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  static getPointOfIntersection(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): false | Position {
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
      return false;
    }

    let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denominator === 0) {
      return false;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
      return false;
    }

    let x = x1 + ua * (x2 - x1);
    let y = y1 + ua * (y2 - y1);

    return { x, y };
  }

  static getPointsAlongLine(start: Position, end: Position, numberOfPoints: number, preventZeroY = true) {
    const maxY = 5;
    const minY = -5;

    numberOfPoints++;

    let stepX = (end.x - start.x) / numberOfPoints;
    let stepY = (end.y - start.y) / numberOfPoints;

    let arr = [];

    for (let i = 1; i < numberOfPoints; i++) {
      let x = start.x + stepX * i;
      let y = start.y + stepY * i;

      if (preventZeroY && y == 0) y = Math.random() * (maxY - minY) + minY;

      arr.push({ x, y });
    }

    return arr;
  }

  static pointCircleCollide(point: number[], circle: number[], r: number) {
    if (r === 0) return false;

    let dx = circle[0] - point[0];
    let dy = circle[1] - point[1];

    return dx * dx + dy * dy <= r * r;
  }

  static lineCircleCollide(a: number[], b: number[], circle: number[], radius: number, nearest?: number[]) {
    let tmp = [0, 0];

    if (this.pointCircleCollide(a, circle, radius)) {
      if (nearest) {
        nearest[0] = a[0];
        nearest[1] = a[1];
      }

      return true;
    }
    if (this.pointCircleCollide(b, circle, radius)) {
      if (nearest) {
        nearest[0] = b[0];
        nearest[1] = b[1];
      }

      return true;
    }

    let x1 = a[0],
      y1 = a[1],
      x2 = b[0],
      y2 = b[1],
      cx = circle[0],
      cy = circle[1];

    let dx = x2 - x1;
    let dy = y2 - y1;

    let lcx = cx - x1;
    let lcy = cy - y1;

    let dLen2 = dx * dx + dy * dy;
    let px = dx;
    let py = dy;

    if (dLen2 > 0) {
      let dp = (lcx * dx + lcy * dy) / dLen2;

      px *= dp;
      py *= dp;
    }

    if (!nearest) nearest = tmp;

    nearest[0] = x1 + px;
    nearest[1] = y1 + py;

    let pLen2 = px * px + py * py;

    return this.pointCircleCollide(nearest, circle, radius) && pLen2 <= dLen2 && px * dx + py * dy >= 0;
  }

  static getClosestPlayer(lineman: Disc, defensiveLine: Disc[], players: Player[]): Player | Disc {
    let closestPlayer: Player | Disc;
    let minDistance = Number.MAX_VALUE;

    defensiveLine.forEach((dl) => {
      const distance = this.getDistanceBetweenPoints(lineman.getPosition(), dl.getPosition());
      if (distance < minDistance) {
        minDistance = distance;
        closestPlayer = dl;
      }
    });

    players.forEach((player) => {
      const distance = this.getDistanceBetweenPoints(lineman.getPosition(), player.getPosition());
      if (distance < minDistance) {
        minDistance = distance;
        closestPlayer = player;
      }
    });

    return closestPlayer;
  }
}
