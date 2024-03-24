import '@abraham/reflection';

import EventEmitter from "events";
import { CommandOptions, getCommandArgumentsFromString, getCommandNameFromString } from "./Command";
import Disc from "./Disc";
import Segments from "./Segments";
import { Team, TeamColors, MessageObject } from './Global';
import Module from './Module';
import Player from "./Player";
import PlayerList from "./PlayerList";
import {CustomTeam} from "../modules/CustomTeams"

export enum EventNames {
    onPlayerJoin = "playerJoin",
    onPlayerLeave = "playerLeave",
    onTeamVictory = "teamVictory",
    onPlayerChat = "playerChat",
    onPlayerBallKick = "playerBallKick",
    onTeamGoal = "teamGoal",
    onGameStart = "gameStart",
    onGameStop = "gameStop",
    onPlayerAdminChange = "playerAdminChange",
    onPlayerTeamChange = "playerTeamChanged",
    onPlayerKicked = "playerKicked",
    onGameTick = "gameTick",
    onGamePause = "gamePause",
    onGameUnpause = "gameUnpause",
    onPositionsReset = "positionsReset",
    onPlayerActivity = "playerActivity",
    onStadiumChange = "stadiumChange",
    onRoomLink = "roomLink",
    onKickRateLimitSet = "kickRateLimitSet",
    onBeforeEstablishConnection = "onBeforeEstablishConnection"
}

interface IModule {
    new (room: Room, ...params: any): Module;
}

declare interface Room {
    on(event: `${EventNames.onPlayerJoin}`, listener: (player: Player) => void): this;
    on(event: `${EventNames.onPlayerLeave}`, listener: (player: Player) => void): this;
    on(event: `${EventNames.onTeamVictory}`, listener: (scores: ScoresObject) => void): this;
    on(event: `${EventNames.onPlayerChat}`, listener: (player: Player, message: string, isCommand: boolean) => boolean): this;
    on(event: `${EventNames.onPlayerBallKick}`, listener: (player: Player) => void): this;
    on(event: `${EventNames.onTeamGoal}`, listener: (team: TeamID) => void): this;
    on(event: `${EventNames.onGameStart}`, listener: (byPlayer: Player) => void): this;
    on(event: `${EventNames.onGameStop}`, listener: (byPlayer: Player) => void): this;
    on(event: `${EventNames.onPlayerAdminChange}`, listener: (changedPlayer: Player, byPlayer: Player) => void): this;
    on(event: `${EventNames.onPlayerTeamChange}`, listener: (changedPlayer: Player, byPlayer: Player) => void): this;
    on(event: `${EventNames.onPlayerKicked}`, listener: (kickedPlayer: Player, reason: string, ban: boolean, byPlayer: Player) => void): this;
    on(event: `${EventNames.onGameTick}`, listener: () => void): this;
    on(event: `${EventNames.onGamePause}`, listener: (byPlayer: Player) => void): this;
    on(event: `${EventNames.onGameUnpause}`, listener: (byPlayer: Player) => void): this;
    on(event: `${EventNames.onPositionsReset}`, listener: () => void): this;
    on(event: `${EventNames.onPlayerActivity}`, listener: (player: Player) => void): this;
    on(event: `${EventNames.onStadiumChange}`, listener: (newStadiumName: string, byPlayer: Player) => void): this;
    on(event: `${EventNames.onRoomLink}`, listener: (url: string) => void): this;
    on(event: `${EventNames.onKickRateLimitSet}`, listener: (min: number, rate: number, burst: number, byPlayer: Player) => void): this;
    on(event: `${EventNames.onBeforeEstablishConnection}`, listener: (ip: string) => boolean): this;
    on(event: "newPlayerTouchBall", listener: (player: Player, before?: Player) => void): this;
    on(event: "gameStartTicking", listener: (player: Player, before?: Player) => void): this;
    on(event: "uniformChanged", listener: (redColor: CustomTeam, blueColor: CustomTeam) => void): this;

    on(event: string, listener: Function): this;
}

class Room extends EventEmitter {
    private _room: RoomObject;

    private _password?: string;
    private _paused: boolean = false;
    private _running: boolean = false;

    private _players: PlayerList = new PlayerList();
    private _deletedPlayers: PlayerList = new PlayerList();
    private _discs: Disc[] = [];
    private _segments: Segments[] = [];
    private _commands: CommandOptions[] = [];

    private _ballCollisions: { player: Player, time: Date }[] = [];
    
    private _playerChat = true;

    public prefix: string = "!";
    public readonly CollisionFlags;

    constructor(HBInit: Function, config: RoomConfigObject) {
        super();

        if (config.noPlayer == null) config.noPlayer = true;

        this._room = HBInit(config);

        this.CollisionFlags = this._room.CollisionFlags;

        this.load();

        this.setMaxListeners(0);
    }

    private _specialEvents = {
        [EventNames.onGameStart]: (byPlayer: PlayerObject) => {
            this._discs = [];
            this._running = true;

            this.emit("gameStartTicking");

            for (let i = 0; i < this._room.getDiscCount() - this.getPlayers().teams().length; i++) {
                this._discs.push(new Disc(this, i)); 
            }
        },
        [EventNames.onGameStop]: (byPlayer: PlayerObject) => {
            this._paused = false;
            this._running = false;

            this._discs = [];
            this._ballCollisions = [];
        },
        [EventNames.onGamePause]: (byPlayer: PlayerObject) => {
            this._paused = true;
            this._running = false;
        },
        [EventNames.onGameUnpause]: (byPlayer: PlayerObject) => {
            this._paused = false;
        },
        [EventNames.onPlayerJoin]: (player: PlayerObject) => {
            const p = new Player(this, player);

            this._players.add(p);

            for (const player of this._players) {
                player.updatePlayerPositionInList();
            }
            
            return p;
        },
        [EventNames.onPlayerLeave]: (player: PlayerObject) => {
            const p = this._players.get(player.id);

            if (p) this._deletedPlayers.add(p);

            this._players.remove(player.id);

            for (const player of this._players) {
                player.updatePlayerPositionInList();
            }
        },
        [EventNames.onPlayerChat]: (playerObj: PlayerObject, message: string) => {
            const commandName = getCommandNameFromString(message, this.prefix);
            const player = this._players.get(playerObj.id);

            const command = this._commands.find(cmd => {
                if (cmd.name === commandName || cmd.aliases?.includes(commandName)) return true;

                return false;
            });

            if (message[0] === this.prefix && command && player.canUseCommands) {
                const roles = command.roles;

                if (roles == null || roles.length == 0 || roles.filter(r => (player.roles ?? []).includes(r)).length > 0) {
                    const args = getCommandArgumentsFromString(message, this.prefix);

                    const runCommand = () => {
                        return command.func({
                            caller: player,
                            time: new Date(Date.now()),
                            message: message,
                            args: args
                        }, this);
                    }

                    return runCommand;
                }
            }
        },
        [EventNames.onGameTick]: () => {
            if (!this._running) {
                this.emit("gameStartTicking");

                this._running = true;
            }

            const players = [];
        
            for (const player of this.getPlayers().teams()) {            
                if (player?.distanceTo(this.getBall()) < 2) players.push(player);
            }

            const now = new Date(Date.now());

            if (players.length === 0) return;
                        
            if (players.length > 1) {
                this._ballCollisions[1] = { player: players[1], time: now };
            } else if (this._ballCollisions[0]?.player && players[0].id !== this._ballCollisions[0].player.id) {
                this._ballCollisions[1] = { player: this._ballCollisions[0].player, time: this._ballCollisions[0].time }

                this.emit('newPlayerTouchBall', players[0], this._ballCollisions[1]);
            } else if (this._ballCollisions[0]?.player == null) {
                this.emit('newPlayerTouchBall', players[0]);
            }
        
            this._ballCollisions[0] = { player: players[0], time: now };

            for (const player of this.getPlayers().teams()) player.updateLastPosition();
        },
        [EventNames.onPlayerTeamChange]: (changedPlayer: PlayerObject, byPlayer?: PlayerObject) => {
            for (const player of this._players) {
                player.updatePlayerPositionInList();
            }
        }
    }

    private load() {
        for (const [key, val] of Object.entries(EventNames)) {
            this._room[key] = (...args: any) => {
                const specialEvent = this._specialEvents[val];

                let run;

                const players = this._players.clone();

                if (specialEvent) {
                    if (val === EventNames.onPlayerChat) {
                        run = specialEvent(...args);
                    } else {
                        specialEvent(...args);
                    }
                }

                args = args.map((a: any) => {
                    if (PlayerList.isPlayerObject(a)) {                        
                        if (val === EventNames.onPlayerLeave) {
                            return players.get(a.id)?.disable(a);
                        } else if (val === EventNames.onPlayerKicked) {
                            const p = players.get(a.id) ?? this._deletedPlayers.get(a.id) ?? a;

                            this._deletedPlayers.remove(a.id);

                            return p;
                        } else {
                            a = players.get(a.id);
                        }
                    }

                    return a;
                });

                if (run) {
                    const sendMessage = run();

                    if (sendMessage) {
                        this.emit(val, ...args, true);
                    } else {
                        return false;
                    }

                    if (!this._playerChat) return false;
                } else {
                    if (val === EventNames.onPlayerChat) {
                        this.emit(val, ...args, false);

                        if (!this._playerChat) return false;
                    } else {
                        this.emit(val, ...args);
                    }
                }
            }
        }
    }

    /* Room */

    public getNative() {
        return this._room;
    }

    public removeCommand(commandName: string) {
        this._commands = this._commands.filter(command => Reflect.getMetadata('command:name', command) === commandName);
    }

    public module(Module: IModule, ...moduleOptions: any) {
        const module = new Module(this, ...moduleOptions);

        const commands = (Reflect.getMetadata('module:commands', module) as Array<CommandOptions> || []);

        commands.forEach(command => {
            command.func = command.func.bind(module);

            this._commands.push(command);
        });
        
        return module;
    }
 
    /* Game-related */

    public start(): void {
        this._room.startGame();
    }

    public stop(): void {
        this._room.stopGame();
    }

    public pause(): void {
        this._room.pauseGame(true);
    }

    public unpause(): void {
        this._room.pauseGame(false);
    }

    public isGamePaused() {
        return this._paused;
    }

    public isGameTicking() {
        return this._running;
    }

    public getScores() {
        return this._room.getScores();
    }

    public isGameInProgress(): boolean {
        return this.getScores() != null;
    }

    public setScoreLimit(limit: number) {
        this._room.setScoreLimit(limit);
    }

    public setTimeLimit(limit: number): void {
        this._room.setTimeLimit(limit);
    }

    public setKickRateLimit(min: number, rate: number, burst: number): void {
        this._room.setKickRateLimit(min, rate, burst);
    }

    public getDisc(index: number) {
        return this._discs.find(d => d.index === index);
    }

    public getDiscs() {
        return this._discs;
    }

    public getBall() {
        return this._discs[0];
    }

    public getDiscCount() {
        return this._room.getDiscCount();
    }

    /* Player-related */

    public getPlayers() {
        return this._players;
    }

    public getPlayer(id: number) {
        return this._players.get(id);
    }

    public setAvatar(id: number, avatar: string) {
        this._room.setPlayerAvatar(id, avatar);
    }

    public setAdmin(id: number, admin: boolean) {
        this._room.setPlayerAdmin(id, admin);
    }

    public setTeam(id: number, team: Team) {
        this._room.setPlayerTeam(id, team);
    }

    public kick(id: number, reason?: string) {
        this._room.kickPlayer(id, reason, false);
    }

    public ban(id: number, reason?: string) {
        this._room.kickPlayer(id, reason, true);
    }

    public setPlayerChat(enable: boolean) {
        this._playerChat = enable;
    }

    /* Admin-related and security */

    public clearBan(id: number) {
        this._room.clearBan(id);
    }

    public clearBans() {
        this._room.clearBans();
    }

    public setStadium(stadium: {} | DefaultStadiums): void {
        if (typeof stadium === "object") this._room.setCustomStadium(JSON.stringify(stadium));
        if (typeof stadium === "string") this._room.setDefaultStadium(stadium as DefaultStadiums);
    }

    public lockTeams(): void {
        this._room.setTeamsLock(true);
    }

    public unlockTeams(): void {
        this._room.setTeamsLock(false);
    }

    public getPassword() {
        return this._password;
    }

    public setPassword(password: string): void {
        this._password = password;
        this._room.setPassword(password);
    }

    public clearPassword(): void {
        this._password = undefined;
        this._room.setPassword(null);
    }

    public enableCaptcha(): void {
        this._room.setRequireRecaptcha(true);
    }

    public disableCaptcha(): void {
        this._room.setRequireRecaptcha(false);
    }

    public setTeamColors(team: TeamID | "all", teamColors: TeamColors): void {
        if (team === "all") {
            this._room.setTeamColors(Team.Red, teamColors.angle, teamColors.textColor, teamColors.colors);
            this._room.setTeamColors(Team.Blue, teamColors.angle, teamColors.textColor, teamColors.colors);
        } else {
            this._room.setTeamColors(team, teamColors.angle, teamColors.textColor, teamColors.colors);
        }
    }

    /* Chat */

    public send(options: MessageObject): void {
        if (options.targetID && this.getPlayer(options.targetID)?.canReadChat) {
            this._room.sendAnnouncement(options.message, options.targetID, options.color, options.style, options.sound);

            return;
        }
        
        for (const player of this.getPlayers()) {
            this._room.sendAnnouncement(options.message, player.id, options.color, options.style, options.sound);
        }
    }

    /* Misc */

    public startRecording(): void {
        this._room.startRecording();
    }

    public stopRecording(): Uint8Array {
        return this._room.stopRecording();
    }

    public reorderPlayers(ids: Array<number>, moveToTop: boolean): void {
        this._room.reorderPlayers(ids, moveToTop);
    }
}

export default Room;