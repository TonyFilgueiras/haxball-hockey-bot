export default class Timer {
    private timerId: number;
    private start: number;
    private remaining: number;
    private finishTime: number;
    private args: any[];
    private paused = false;

    constructor(private callback: Function, delay: number, ...args: any[]) {
        this.remaining = delay;
        this.args = args;
        this.finishTime = delay;

        this.resume();
    }
    
    public resume() {
        this.paused = false;

        this.start = Date.now();
        this.finishTime = this.start + this.remaining;

        clearTimeout(this.timerId);

        this.timerId = setTimeout(this.callback, this.remaining, ...this.args);
    }

    public pause() {
        if (this.paused) return;

        this.paused = true;

        clearTimeout(this.timerId);

        this.remaining -= Date.now() - this.start;
    }

    public stop() {
        this.paused = false;

        clearTimeout(this.timerId);
    }

    public getRemainingTime() {        
        return Math.max(0, this.paused ? this.remaining : this.finishTime - Date.now());
    }
}