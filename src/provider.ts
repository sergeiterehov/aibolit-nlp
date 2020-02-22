import fs from "fs";
import util from "util";
import { argv } from "yargs";
import { Context } from "./context";
import { IQuestion, ICase, IResult } from "./types";

if (argv.debug) {
    process.env.DEBUG = "1";
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