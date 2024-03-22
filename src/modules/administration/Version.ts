import Command, { CommandInfo } from "../../core/Command";
import Module from "../../core/Module";
import Room from "../../core/Room";
import { Color } from "../../Global";

import * as Global from "../../Global";

class Version extends Module {
    @Command({
        name: "versao"
    })
    versaoCommand($: CommandInfo, room: Room) {
        $.caller.reply({ message: `Versão: ${Global.version}`, sound: 2, color: Color.LightGreen, style: "bold" });
    }
}

export default Version;