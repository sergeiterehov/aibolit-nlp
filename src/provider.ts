import fs from "fs";
import util from "util";
import { argv } from "./argv";
import { Context } from "./context";
import { IQuestion, ICase, IResult } from "./types";
import { synonyms } from "./mind";

if (argv.debug) {
    process.env.DEBUG = "1";
}

if (argv.synonyms !== undefined) {
    synonyms.list = JSON.parse(
        fs.readFileSync(typeof argv.synonyms === "string" ? argv.synonyms : "synonyms.json", "utf-8"),
    );

    console.log("Synonyms loaded:", Object.keys(synonyms.list).length);
}

export function createContext() {
    const inputFile = typeof argv.config === "string" ? argv.config : "config.json";

    const config: {
        questions: IQuestion[];
        cases: ICase[];
        results: IResult[];
    } = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

    const context = new Context();

    context.questions.push(...config.questions);
    context.cases.push(...config.cases);
    context.results.push(...config.results);

    if (process.env.DEBUG) {
        console.log("[CONTEXT]", util.inspect(context, false, 100, true));
    }

    return context;
}