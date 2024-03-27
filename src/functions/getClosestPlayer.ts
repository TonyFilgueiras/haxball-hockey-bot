import Player from "../core/Player";
import distanceBetweenDots from "./math/distanceBetweenDots";

export default function getClosestPlayer(foulCommitter: Player, opposingPlayers: Player[]): Player | null {
  let closestPlayer: Player | null = null;
  let minDistance = Number.MAX_VALUE;

  opposingPlayers.forEach((opposingPlayer) => {
    const distance = distanceBetweenDots(
      foulCommitter.getX(),
      foulCommitter.getY(),
      opposingPlayer.getX(),
      opposingPlayer.getY()
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestPlayer = opposingPlayer;
    }
  });

  // Adding a sanity check to ensure closestPlayer is not the foul committer.
  // This check depends on the `id` field, ensure your Player type/interface has it.
  if (closestPlayer && closestPlayer.id === foulCommitter.id) {
    console.error('Closest player is the foul committer. This should not happen.');
    return null;
  }

  return closestPlayer;
}

