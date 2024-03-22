import AbstractDisc from "./AbstractDisc";
import Room from "./Room";
import Settings from "./Settings";

export default class Disc extends AbstractDisc {
    public index: number;
    
    public settings = new Settings();

    constructor(room: Room, discIndex: number) {
        super(room);

        this.index = discIndex;
    }

    protected getDiscObject(): DiscPropertiesObject {
		return this._room.getNative().getDiscProperties(this.index);
	}

    protected setDiscObject(properties: DiscPropertiesObject) {
		this._room.getNative().setDiscProperties(this.index, properties);
	}

    public getColor(): number | null | undefined {
        return this.getDiscObject().color;
    }

    public setColor(value: number | null | undefined) {
        this.setDiscObject({ color: value });
    }
}