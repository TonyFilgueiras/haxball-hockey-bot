import Room from "./Room";
import Settings from "./Settings";

export default abstract class AbstractDisc {
    abstract settings: Settings;

    constructor(protected _room: Room) { }

    protected abstract getDiscObject(): DiscPropertiesObject;
    protected abstract setDiscObject(properties: DiscPropertiesObject): void;

    public distanceTo(disc: AbstractDisc | { x: number, y: number, radius: number }): number | null {
        const discA = this.getDiscObject();

        if (!disc || !discA) return null;

        let discB: Partial<{ x: number, y: number, radius: number }> = {};

        if (disc instanceof AbstractDisc) {
            const discProps = disc.getDiscObject();
            discB.x = discProps.x;
            discB.y = discProps.y;
            discB.radius = discProps.radius;
        } else {
            discB = disc;
        }

        const dx = discA.x - discB.x;
        const dy = discA.y - discB.y;

        const c = Math.sqrt(dx * dx + dy * dy);

        const res = Math.max(0, c - discA.radius - discB.radius);
        
        return res;
    }

    public isCollidingWith(disc: AbstractDisc): boolean {
        const distance = this.distanceTo(disc);
        return distance ? distance <= 0 : false;
    }

    public getPosition(): { x: number, y: number } {
        return { x: this.getDiscObject()?.x, y: this.getDiscObject()?.y };
    }

    public setPosition(pos: { x: number, y: number }) {
        this.setDiscObject(pos);
    }

    public getX(): number | null | undefined {
        return this.getDiscObject()?.x;
    }

    public setX(value: number | null | undefined) {
        this.setDiscObject({ x: value });
    }

    public getY(): number | null | undefined {
        return this.getDiscObject()?.y;
    }

    public setY(value: number | null | undefined) {
        this.setDiscObject({ y: value });
    }

    public getVelocity() {
        return Math.sqrt(this.getVelocityX() * this.getVelocityX() + this.getVelocityY() * this.getVelocityY());
    }

    public getVelocityX(): number | null | undefined {
        return this.getDiscObject()?.xspeed;
    }

    public setVelocityX(value: number | null | undefined) {
        this.setDiscObject({ xspeed: value });
    }

    public getVelocityY(): number | null | undefined {
        return this.getDiscObject()?.yspeed;
    }

    public setVelocityY(value: number | null | undefined) {
        this.setDiscObject({ yspeed: value });
    }

    public getGravityX(): number | null | undefined {
        return this.getDiscObject()?.xgravity;
    }

    public setGravityX(value: number | null | undefined) {
        this.setDiscObject({ xgravity: value });
    }

    public getGravityY(): number | null | undefined {
        return this.getDiscObject()?.ygravity;
    }

    public setGravityY(value: number | null | undefined) {
        this.setDiscObject({ ygravity: value });
    }

    public getRadius(): number | null | undefined {
        return this.getDiscObject()?.radius;
    }

    public setRadius(value: number | null | undefined) {
        this.setDiscObject({ radius: value });
    }

    public getbCoeff(): number | null | undefined {
        return this.getDiscObject()?.bCoeff;
    }

    public setbCoeff(value: number | null | undefined) {
        this.setDiscObject({ bCoeff: value });
    }
    
    public getInvMass(): number | null | undefined {
        return this.getDiscObject()?.invMass;
    }
    
    public setInvMass(value: number | null | undefined) {
        this.setDiscObject({ invMass: value });
    }

    public getDamping(): number | null | undefined {
        return this.getDiscObject()?.damping;
    }

    public setDamping(value: number | null | undefined) {
        this.setDiscObject({ damping: value });
    }

    public getcMask(): number | null | undefined {
        return this.getDiscObject()?.cMask;
    }

    public setcMask(value: number | null | undefined) {
        this.setDiscObject({ cMask: value });
    }

    public getcGroup(): number | null | undefined {
        return this.getDiscObject()?.cGroup;
    }

    public setcGroup(value: number | null | undefined) {
        this.setDiscObject({ cGroup: value });
    }
}