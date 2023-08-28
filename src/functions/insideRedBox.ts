import { ChatStyle, Colors, Player, Room } from "haxball-extended-room";
import distanceBetweenDots from "./math/distanceBetweenDots";

export default function insideRedBox(x: number, y: number): boolean {
    const radius = 124
    const xCenter = -757
    if (x < xCenter - 3) {
        return false
    } else {
        const distancia = distanceBetweenDots(x, y, xCenter, 0);
        return distancia <= radius;
    }
}