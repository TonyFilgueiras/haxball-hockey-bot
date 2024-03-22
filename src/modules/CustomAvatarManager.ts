import Player from "../core/Player";
import Room from "../core/Room";

export class CustomAvatarManager {
    private room: Room;
    private list: Map<number, { time: number, avatar: string }> = new Map();

    constructor(room: Room) {
        this.room = room;
    }

    private setPlayerDefaultAvatar(player: Player) {
        //player.setAvatar(player.name.replace(/[^\w\s]/gi, '').slice(0, 2));
        player.clearAvatar();
    }
 
    clearAll() {
        this.list.forEach((_, id) => {
            this.clearPlayerAvatar(id);
        });
    }

    getPlayer(player: Player) {
        return this.list.get(player.id);
    }

    clearPlayerAvatar(playerId: number) {
        this.list.delete(playerId);

        const player = this.room.getPlayer(playerId);

        if (player) this.setPlayerDefaultAvatar(player);
    }

    setPlayerAvatar(player: Player, avatar: string, time?: number) {
        this.list.set(player.id, { time: time ? Date.now() + time : 0, avatar });

        player.setAvatar(avatar);
    }

    run() {
        this.list.forEach(({ time }, id) => {
            if (!time) return;

            if (time < Date.now()) {
                this.clearPlayerAvatar(id);
                this.list.delete(id);
            }
        });
    }
}