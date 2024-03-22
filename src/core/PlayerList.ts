import { Team } from "./Global";
import List from "./List";
import Player from "./Player";

export default class PlayerList extends List<Player, number> {
    constructor(players?: Player[]) {
        super();

        if (players) this.list = players;
    }

    static isPlayerObject(playerObject: any) {
        if (playerObject == null) return false;
        if (playerObject["name"] == null) return false;
        if (playerObject["team"] == null) return false;
        if (playerObject["id"] == null) return false;
        if (playerObject["admin"] == null) return false;

        return true;
    }

    public first() {
        return this.list[0];
    }

    public teams() {
        return this.filter(p => p.getTeam() !== Team.Spectators);
    }

    public spectators() {
        return this.filter(p => p.getTeam() === Team.Spectators);
    }

    public red() {
        return this.filter(p => p.getTeam() === Team.Red);
    }

    public blue() {
        return this.filter(p => p.getTeam() === Team.Blue);
    }
    
    public get(id: number) {
        return this.list.find(obj => obj.id === id) ?? null;
    }

    public add(player: Player) {
        this.list.push(player);
    }

    public remove(id: number) {
        this.list = this.filter(obj => obj.id !== id);
    }

    public clear() {
        this.list = [];
    }

    public clone() {
        return new PlayerList(this.list);
    }
}