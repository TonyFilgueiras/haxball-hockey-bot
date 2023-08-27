import { Disc, Player } from "haxball-extended-room";

export default function setDiscPosition(disc: Player | Disc, x : number, y: number, xSpeed: number = 0, ySpeed: number = 0) {
    disc.x = x
    disc.y = y
    disc.xspeed = xSpeed
    disc.yspeed = ySpeed
}