import readline from "readline";
import { readFileSync, writeFileSync } from "fs";

const db: Record<string, string[]> = JSON.parse(readFileSync("synonyms.json", "utf-8"));

console.log("Synonyms loaded:", Object.keys(db).length);

function saveFile() {
    writeFileSync("synonyms.json", JSON.stringify(db), "utf-8");
}

function add<T>(a: T[], item: T) {
    const index = a.indexOf(item);

    if (index !== -1) {
        return;
    }

    a.push(item);
}

function remove<T>(a: T[], item: T) {
    const index = a.indexOf(item);

    if (index === -1) {
        return;
    }

    a.splice(index, 1);
}

function addSynonym(word: string, synonym: string, buf: string[] = []) {
    if (buf.includes(word)) {
        return;
    }

    const synonyms = db[word] || (db[word] = []);

    if (word !== synonym) {
        add(synonyms, synonym);
    }

    buf.push(word);

    synonyms.forEach((other) => addSynonym(other, word, buf));
}

function removeSynonym(word: string, synonym: string, buf: string[] = []) {
    if (buf.includes(word)) {
        return;
    }

    const synonyms = db[word] || (db[word] = []);

    buf.push(word);

    synonyms.forEach((other) => removeSynonym(other, synonym, buf));

    remove(synonyms, synonym);
}
  
(async function () {
    console.log("+СЛОВО - для добавления к предыдущему.");
    console.log("-СЛОВО - для удаления у предыдущего.");
    console.log("save - сохранить файл.");
    console.log("");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let last: string = "";

    while (true) {
        let addMode = false;
        let removeMode = false;

        const input: string = await new Promise<string>((done) => rl.question('> ', done))
            .then((input) => input.trim())
            .then((input) => {
                if (input.indexOf("+") === 0) {
                    if (last) {
                        addMode = true;
                    }

                    return input.substr(1);
                }

                if (input.indexOf("-") === 0 && last) {
                    if (last) {
                        removeMode = true;
                    }

                    return input.substr(1);
                }

                if (input === "save") {
                    saveFile();

                    return "";
                }

                return input;
            })
            .then((input) => input.trim().toLowerCase().split(/\s+/gm)[0])
            .then((input) => {
                if (addMode && input !== last) {
                    addSynonym(last, input);
                }

                if (removeMode && input !== last) {
                    removeSynonym(last, input);
                }

                return input;
            })
            .then((input) => {
                return last = input;
            });

        const synonyms = db[input];

        console.log(synonyms ? [...synonyms].join(", ") : `Не найдено "${input}"!`);
    }
})().catch(console.error).finally(() => process.exit());