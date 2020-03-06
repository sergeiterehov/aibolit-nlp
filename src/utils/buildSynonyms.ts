import fs from "fs";

// https://raw.githubusercontent.com/egorkaru/synonym_dictionary/master/dictionary.json

const data = JSON.parse(fs.readFileSync(0, "utf8"));
const list = data.wordlist;

const out = list.filter(({synonyms}) => {
    return synonyms && synonyms.length;
}).reduce((list: any, {name, synonyms}) => {
    list[name.toLowerCase()] = synonyms.filter((item) => item.indexOf(" ") === -1);

    return list;
}, {});

fs.writeFileSync(1, JSON.stringify(out), "utf8");
