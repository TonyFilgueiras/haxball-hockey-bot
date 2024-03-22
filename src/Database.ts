import * as Global from "./Global";
import Player from "./core/Player";

export enum ResponseType {
    Success = "success",
    Error = "error",
    InternalError = "internal_error"
}

type Response = { type: ResponseType, message?: any };

export default class Database {
	private url = `http://localhost:${process.env.DATABASE_PORT ?? Global.DEFAULT_PORTS.DATABASE}/db`;

    private static RoomName = "bfl";
    private static DefaultMatchType = "pub";

	static ResponseType = {
		Success: "success",
		Error: "error",
        InternalError: "internal_error"
	}

	private send(method: string, params: any[]): Promise<Response> {
        return new Promise((resolve, reject) => {
            fetch(this.url, {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                    Origin: 'http://www.haxball.com',
                    Host: this.url,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    method: method,
                    params: params
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(responseObject) {
                if (responseObject) resolve(responseObject);

                resolve({ type: ResponseType.InternalError });
            })
            .catch((err) => {
                console.error(err);

                resolve({ type: ResponseType.InternalError });
            });
        });
	}

	public async registerPlayer(name: string, discord: string, password: string): Promise<Response> {
		return await this.send("registerPlayer", [name, discord, password]);
	}

	public async getPlayer(query: string): Promise<Response> {
		return await this.send("getPlayer", [query]);
	}

    public async updateAuth(name: string, auth: string): Promise<Response> {
		return await this.send("updatePlayerAuth", [name, auth]);
	}

    public async ping(): Promise<Response> {
		return await this.send("ping", []);
	}

    public async addMatch(id: string, info: any): Promise<Response> {
        return await this.send("addMatch", [id, Database.RoomName, Database.DefaultMatchType, info]);
    }

    public async addLogin(player: Player, discord?: string): Promise<Response> {
        return await this.send("addLogin", [player.ip, player.name, player.auth, Database.RoomName, discord]);
    }
}