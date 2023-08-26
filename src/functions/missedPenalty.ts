import { Room } from "haxball-extended-room"
import insideBlueBox from "./insideBlueBox"
import kickoffAfterMissedPenalty from "./kickoffAfterMissedPenalty"
import insideRedBox from "./insideRedBox"

export default function missedPenalty(room: Room, mode: "penred" | "penblue") {
    switch (mode) {
        case "penred":
            if (room.discs[0].x >= 760) {
                if (room.discs[0].y > 97 || room.discs[0].y < -97) {
                    if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                        kickoffAfterMissedPenalty(500, room)
                    }
                }
            } else if (room.discs[0].y > 210 || room.discs[0].y < -210) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(500, room)
                }
            } else if (room.discs[0].xspeed < -0.5 && room.discs[0].x < 760 && !insideBlueBox(room.discs[0].x,room.discs[0].y) && room.settings.penaltyTimer > 60 ) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(500, room)
                }
            } else if (room.settings.penaltyTimer > 600) {
                kickoffAfterMissedPenalty(500, room)
            }
            break
        case "penblue":
            if (room.discs[0].x <= -760) {
                if (room.discs[0].y > 97 || room.discs[0].y < -97) {
                    if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                        kickoffAfterMissedPenalty(-500, room)
                    }
                }
            } else if (room.discs[0].y > 210 || room.discs[0].y < -210) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(-500, room)
                }
            } else if (room.discs[0].xspeed > 0.5 && room.discs[0].x > -760 && !insideRedBox(room.discs[0].x,room.discs[0].y) && room.settings.penaltyTimer > 60 ) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(-500, room)
                }
            } else if (room.settings.penaltyTimer > 600) {
                kickoffAfterMissedPenalty(-500, room)
            }
            break
    }
}