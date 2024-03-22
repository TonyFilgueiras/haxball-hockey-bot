export default class Settings {
  goalie: 0 | 1 | 2;
    penaltyGoalie: 0 | 1 | 2;
    afk: boolean

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
