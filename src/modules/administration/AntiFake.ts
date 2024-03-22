import Module from "../../core/Module";
import Room from "../../core/Room";
import net from "net";

export default class AntiFake extends Module {
    private ipCache: { ip: string, org: string, city: string }[] = [];

    constructor(room: Room) {
        super();

        room.getNative()["onBeforeEstablishConnection"] = (ip: string) => {
            return new Promise<void>((resolve, reject) => {
                if (!net.isIPv4(ip)) resolve();
    
                const findAndCache = async (ip: string, ipCache: any) => {
                    const found = ipCache.find((i: any) => i.ip === ip);
                    if (found) return found;

                    const request = await fetch(`https://ipapi.co/${ip}/json/`);
                    const response = await request.json();
    
                    const loc = { ip: response.ip, org: response.org?.toUpperCase(), city: response.city?.toUpperCase() };
                    ipCache.push(loc);
    
                    return loc;
                };
    
                findAndCache(ip, this.ipCache).then(loc => {
                    resolve();
                });
            });
        };
    }
}