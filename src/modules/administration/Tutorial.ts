import Command, { CommandInfo } from "../../core/Command";
import Module from "../../core/Module";
import Room from "../../core/Room";
import { Color } from "../../Global";

class Tutorial extends Module {
    delay = 5 * 60 * 1000;

    constructor(room: Room) {
        super();

        setInterval(() => {
            room.send({ message: `🎥 Veja nosso tutorial: https://www.youtube.com/watch?v=1p0xwPt5UVo`, sound: 1, color: Color.LightGreen, style: "bold" });
        }, this.delay);
    }

    @Command({
        name: "tutorial"
    })
    tutorialCommand($: CommandInfo, room: Room) {
        $.caller.reply({ message: `🎥 Tutorial - Futebol Americano: https://www.youtube.com/watch?v=1p0xwPt5UVo`, sound: 2, color: Color.LightGreen, style: "bold" });
    }
}

export default Tutorial;