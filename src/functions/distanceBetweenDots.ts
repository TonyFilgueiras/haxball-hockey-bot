export default function distanceBetweenDots(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}