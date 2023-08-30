import { Room } from "haxball-extended-room";
import insideBlueBox from "../insideBlueBox";
import kickoffAfterMissedPenalty from "../kickoffAfterMissedPenalty";
import insideRedBox from "../insideRedBox";
import touchedDisc from "../touchedDisc";
import { redTeam } from "../../players/redTeam";
import { blueTeam } from "../../players/blueTeam";
import { room } from "../../bot";
import penaltyCarrierChange from "./penaltyCarrierChange";
import penaltyTakerReleasedDisc from "./penaltyTakerReleasedDisc";

export default function missedPenalty(mode: "penred" | "penblue") {
  const penaltyMissedEnabled =
    !room.settings.penaltyDetected &&
    !room.settings.disabledPenaltys &&
    room.settings.penaltyTimer > 100;

  const missedGoal =
    mode == "penred"
      ? room.discs[0].x >= 760 &&
        (room.discs[0].y > 97 || room.discs[0].y < -97)
      : room.discs[0].x <= -760 &&
        (room.discs[0].y > 97 || room.discs[0].y < -97);
  const discWentWentTooWide = room.discs[0].y > 210 || room.discs[0].y < -210;
  const discWentBackwards =
    mode == "penred"
      ? room.discs[0].xspeed < -0.5 &&
        !insideBlueBox(room.discs[0].x, room.discs[0].y)
      : room.discs[0].xspeed > 0.5 &&
        room.discs[0].x > -760 &&
        !insideRedBox(room.discs[0].x, room.discs[0].y);
  const penaltyTimerExpired = room.settings.penaltyTimer > 600;
  switch (mode) {
    case "penred":
      if (penaltyMissedEnabled) {
        if (missedGoal) {
          kickoffAfterMissedPenalty(500, "O jogador errou o gol");
        } else if (discWentWentTooWide) {
          kickoffAfterMissedPenalty(500, "O disco foi pra lateral");
        } else if (discWentBackwards) {
          kickoffAfterMissedPenalty(500, "O disco foi pra trás");
        } else if (penaltyTimerExpired) {
          kickoffAfterMissedPenalty(500, "Tempo expirou (10seg)");
        }
        redTeam.forEach((p) => {
          if (penaltyCarrierChange(p)) {
            kickoffAfterMissedPenalty(500, "Só pode um jogador bater o penal");
          } else if (penaltyTakerReleasedDisc(p)) {
            kickoffAfterMissedPenalty(500, "O jogador soltou o disco");
          }
        });
      }
      break;
    case "penblue":
      if (penaltyMissedEnabled) {
        if (missedGoal) {
          kickoffAfterMissedPenalty(-500, "O jogador errou o gol");
        } else if (discWentWentTooWide) {
          kickoffAfterMissedPenalty(-500, "O disco foi pra lateral");
        } else if (discWentBackwards) {
          kickoffAfterMissedPenalty(-500, "O disco foi pra trás");
        } else if (penaltyTimerExpired) {
          kickoffAfterMissedPenalty(-500, "Tempo expirou (10seg)");
        }
        blueTeam.forEach((p) => {
          if (penaltyCarrierChange(p)) {
            kickoffAfterMissedPenalty(-500, "Só pode um jogador bater o penal");
          } else if (penaltyTakerReleasedDisc(p)) {
            kickoffAfterMissedPenalty(-500, "O jogador soltou o disco");
          }
        });
      }
      break;
  }
}
