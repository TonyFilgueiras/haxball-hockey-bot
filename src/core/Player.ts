import AbstractDisc from "./AbstractDisc";
import { MessageObject, Team } from "./Global";
import Room, { EventNames } from "./Room";
import Settings from "./Settings";

function arraysEqual(a: any[], b: any[]) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

export default class Player extends AbstractDisc {
	private readonly _kickLimitDistance = 4;

    private positionInList: number[] = [-1, -1];
    private playerLeaveObj: PlayerObject = null;
    private lastPos: Position = { x: null, y: null };

    readonly name: string;
    readonly id: number;
    readonly auth?: string;
    readonly conn: string;
    readonly ip: string;

    public settings = new Settings();

    public canReadChat = true;
    public canUseCommands = true;

    public roles: string[] = [];
    x: number;
    y: number;

    constructor(room: Room, playerObject: PlayerObject) {
        super(room);

        this.name = playerObject.name;
        this.id = playerObject.id;
        this.auth = playerObject.auth;
        this.conn = playerObject.conn;
        this.ip = this._decodeConn(this.conn);
    }

    protected getDiscObject(): DiscPropertiesObject {
		return this._room.getNative().getPlayerDiscProperties(this.id);
	}

    protected setDiscObject(properties: DiscPropertiesObject) {
		this._room.getNative().setPlayerDiscProperties(this.id, properties);
	}

    private _decodeConn(str: string): string {
        return decodeURIComponent(str.replace(/(..)/g,'%$1'));
    }

    public updatePlayerPositionInList() {
        const specs = this._room.getPlayers().filter(p => p.getTeam() === Team.Spectators);

        this.positionInList[1] = this.positionInList[0];
        this.positionInList[0] = specs.findIndex(p => p.id === this.id);
    }

    public getPositionInList() {
        return {
            now: this.positionInList[0],
            before: this.positionInList[1]
        };
    }

    public setAvatar(avatar: string): void {
		this._room.setAvatar(this.id, avatar);
	}

    public clearAvatar(): void {
		this._room.setAvatar(this.id, null);
	}

    public kick(reason?: string): void {
		this._room.kick(this.id, reason);
	}

	public ban(reason?: string): void {
		this._room.ban(this.id, reason);
	}

	public canKick(disc: AbstractDisc): boolean {
        const distance = disc.distanceTo(this);
        return distance ? distance < this._kickLimitDistance : false;
	}

    public getPlayerObject(): PlayerObject {
        return this.playerLeaveObj ?? this._room.getNative().getPlayer(this.id);
    }

    public getMention(): string {
		return `@${this.name.replace(/ /g, "_")}`
	}

    public reply(message: MessageObject): void {
		message.targetID = this.id ?? -1;
		
		this._room.send(message);
	}

    public getTeam(): TeamID {
        return this.getPlayerObject()?.team;
    }

	public setTeam(team: TeamID) {
		this._room.setTeam(this.id, team);
	}

    public isAdmin(): boolean {
        return this.getPlayerObject()?.admin;
    }

	public setAdmin(value: boolean) {
        this._room.setAdmin(this.id, value);
    }

    public getPosition(): Position {
		return this.getPlayerObject()?.position;
	}

    public setPosition(pos: Position) {
        this.setDiscObject({ x: pos.x, y: pos.y });
	}

    public getLastPosition() {
        return this.lastPos;
    }

    public updateLastPosition() {
        this.lastPos = this.getPosition();
    }

    public disable(playerObj: PlayerObject) {
        this.playerLeaveObj = playerObj;

        return this;
    }
}