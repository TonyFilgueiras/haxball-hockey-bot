import { Room } from "haxball-extended-room"
import insideBlueBox from "./insideBlueBox"
import kickoffAfterMissedPenalty from "./kickoffAfterMissedPenalty"
import insideRedBox from "./insideRedBox"
import touchedDisc from "./touchedDisc"
import { redTeam } from "../players/redTeam"
import { blueTeam } from "../players/blueTeam"
import { room } from "../bot"

const previousPlayerTouchOnDisc = room?.settings.lastPlayerTouch
const previousTeamTouchOnDisc = room?.settings.lastTeamTouch
export default function missedPenalty(mode: "penred" | "penblue") {
    switch (mode) {
        case "penred":
            if (room.discs[0].x >= 760) {
                if (room.discs[0].y > 97 || room.discs[0].y < -97) {
                    if (!room.settings.penalty && !room.settings.disabledPenaltys && room.settings.penaltyTimer > 100) {
                        kickoffAfterMissedPenalty(500)
                    }
                }
            } else if (room.discs[0].y > 210 || room.discs[0].y < -210) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys && room.settings.penaltyTimer > 100) {
                    kickoffAfterMissedPenalty(500)
                }
            } else if (room.discs[0].xspeed < -0.5 && room.discs[0].x < 760 && !insideBlueBox(room.discs[0].x,room.discs[0].y) && room.settings.penaltyTimer > 100 ) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(500)
                }
            } else if (room.settings.penaltyTimer > 600) {
                kickoffAfterMissedPenalty(500)
            }
            redTeam.forEach((p) => {
                if (touchedDisc(p)) {
                    if (room.settings.lastPlayerTouch !== previousPlayerTouchOnDisc && room.settings.lastTeamTouch === previousTeamTouchOnDisc) {
                        kickoffAfterMissedPenalty(500)
                    }
                }

            })
            break
        case "penblue":
            if (room.discs[0].x <= -760) {
                if (room.discs[0].y > 97 || room.discs[0].y < -97) {
                    if (!room.settings.penalty && !room.settings.disabledPenaltys && room.settings.penaltyTimer > 100) {
                        kickoffAfterMissedPenalty(-500)
                    }
                }
            } else if (room.discs[0].y > 210 || room.discs[0].y < -210) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys && room.settings.penaltyTimer > 100) {
                    kickoffAfterMissedPenalty(-500)
                }
            } else if (room.discs[0].xspeed > 0.5 && room.discs[0].x > -760 && !insideRedBox(room.discs[0].x,room.discs[0].y) && room.settings.penaltyTimer > 100) {
                if (!room.settings.penalty && !room.settings.disabledPenaltys) {
                    kickoffAfterMissedPenalty(-500)
                }
            } else if (room.settings.penaltyTimer > 600) {
                kickoffAfterMissedPenalty(-500)
            }
            blueTeam.forEach((p) => {
                if (touchedDisc(p)) {
                    if (room.settings.lastPlayerTouch !== previousPlayerTouchOnDisc && room.settings.lastTeamTouch === previousTeamTouchOnDisc) {
                        kickoffAfterMissedPenalty(500)
                    }
                }
            })
            break
    }
}