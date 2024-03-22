import Command, { CommandInfo } from "../../core/Command";
import Module from "../../core/Module";
import Room from "../../core/Room";
import { Color } from "../../Global";

import * as Global from "../../Global";

class Discord extends Module {
    @Command({
        name: "discord"
    })
    discordCommand($: CommandInfo, room: Room) {
        $.caller.reply({ message: `👾 Discord: ${process.env.DISCORD_INVITE}`, sound: 2, color: Color.LightGreen, style: "bold" });
    }
}

export default Discord;