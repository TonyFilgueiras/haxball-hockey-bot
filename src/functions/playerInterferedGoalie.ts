export default function playerInterferedGoalie(playerY: number, goalieY: number, ballY: number, ballYIntersection: number): boolean {
  // Check if the player is between the goalie and the current ball position
  let interferedWithCurrentBall = (playerY > goalieY - 15 && playerY < ballY) || (playerY < goalieY + 15 && playerY > ballY);

  // Check if the player is between the goalie and the future ball intersection position
  let interferedWithBallIntersection =
    (playerY > goalieY - 15 && playerY < ballYIntersection) || (playerY < goalieY + 15 && playerY > ballYIntersection);

  // Return true if the player interfered in either case
  return interferedWithCurrentBall || interferedWithBallIntersection;
}
