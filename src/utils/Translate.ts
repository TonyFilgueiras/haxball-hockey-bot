import langPack from "../langpacks/pt-BR.json";

export default function translate(str: string, ...args: (string | number)[]) {
    let newStr = langPack[str];

    if (!newStr) {
        return `⚠️ Erro: "${newStr}" não encontrado`
    }

    let times = (newStr.match(/\%s/g) || []).length;

    for (let i = 0; i < times; i++) {
        const arg = args[i];

        newStr = newStr.replace("%s", arg ?? "");
    }

    return newStr;
}