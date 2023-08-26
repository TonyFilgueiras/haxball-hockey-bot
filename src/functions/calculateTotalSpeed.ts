export default function calculateTotalSpeed(xSpeed: number, ySpeed: number): number {
    return Math.sqrt(xSpeed ** 2 + ySpeed ** 2);
}