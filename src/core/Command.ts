import '@abraham/reflection';

import Player from './Player';

export interface CommandOptions {
    readonly name: string;
    aliases?: string[];
    desc?: string;
    usage?: string;
    roles?: string[];
    func?: Function
}

export interface CommandInfo {
    caller: Player,
    message: string,
    time: Date,
    args: string[]
}

function desconstructMessage(message: string, prefix: string) {
    return message.slice(prefix.length).trim().split(/ +/);
}

export function getCommandNameFromString(str: string, prefix: string) {
    return desconstructMessage(str, prefix)[0].toLowerCase();
}

export function getCommandArgumentsFromString(str: string, prefix: string) {
    return desconstructMessage(str, prefix).slice(1);
}

export default function Command(options?: Omit<CommandOptions, "func">) {
    return (target: Object, key: string, descriptor: PropertyDescriptor) => {
        const commands: any = Reflect.getMetadata('module:commands', target);

        const command: CommandOptions = options;

        command.func = descriptor.value;

        if (commands) {
            commands.push(command);
        } else {
            Reflect.defineMetadata('module:commands', [command], target);
        }
    }
}