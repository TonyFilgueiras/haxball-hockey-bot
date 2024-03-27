export default class Settings {
  goalie: 0 | 1 | 2;
  penaltyGoalie: 0 | 1 | 2;
  
  almostAfk: boolean
  afk: boolean;
  lastActivity = 0

  leftMidGame: boolean
  enteredMidGame: boolean

  scoredShootout : boolean[] = []; 

  [Symbol.iterator](): Iterator<any> {
    let i = 0;
    const arr = Object.values(this);

    return {
      next: () => ({
        value: arr[i++],
        done: i > arr.length,
      }),
    };
  }
}
