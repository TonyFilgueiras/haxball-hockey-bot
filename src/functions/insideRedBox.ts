import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import distanceBetweenDots from "./math/distanceBetweenDots";

export default function insideRedBox(x: number, y: number): boolean {
    const radius = 124
    const xCenter = -757
    if (insideRedGoal(x, y)) {
        return true
    } else if (x < xCenter - 6) {
        return false
    } else {
        const distancia = distanceBetweenDots(x, y, xCenter, 0);
        return distancia <= radius;
    }
}

function insideRedGoal(x: number, y: number): boolean{
    const radius = 124
    const xCenter = -757
    const distance = distanceBetweenDots(x, y, xCenter, 0);
    if (x > -800 && y < 81 && y > -81 && distance <= radius) {
        return true
    } else {
        return false
    }
}