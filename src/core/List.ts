export default abstract class List<T, ID = void> {
    protected list: T[] = [];

    [Symbol.iterator] (): Iterator<T> {
        let i = 0;
        const arr = this.getList();

        return {
            next: () => ({ value: arr[i++], done: i > arr.length })
        }
    }

    get size() {
        return this.getList().length;
    }

    protected getList() {
        return this.list;
    }

    public abstract add(item: T): void;

    public abstract remove(itemOrID: T | ID): void;

    public abstract get(itemOrID: T | ID): T | null;
    
    public abstract clear(): void;

    public abstract clone(): List<T, ID>;

    public find(callback: (item: T) => boolean) {
        for (const item of this) {
            if (callback(item)) return item;
        }
    }

    public forEach(callback: (item: T) => void) {
        for (const item of this) {
            callback(item);
        }
    }

    public filter(callback: (item: T) => boolean) {
        const filteredArray = [];

        for (const item of this) {
            if (callback(item)) filteredArray.push(item);
        }

        return filteredArray;
    }

    public getValues() {
        return this.getList();
    }
}