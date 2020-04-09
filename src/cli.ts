import readline from "readline";
import util from "util";
import { argv } from "./argv";
import { createContext } from "./provider";
import { readFileSync } from "fs";

const context = createContext();

if (typeof argv.vars === "string") {
    context.state.variables = {...JSON.parse(readFileSync(argv.vars, "utf8"))};
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async function () {
    while (!context.state.done) {
        const userInput: string = await new Promise((done) => rl.question('> ', done));
        const systemOutput = context.process(userInput);
    
        if (process.env.DEBUG) {
            console.log("[STATE]", util.inspect(context.state, false, 100, true));
        }

        console.log(systemOutput || "{EMPTY_RESPONSE}");

        if (context.state.callQueue.length) {
            console.log("[CALLS]", context.state.callQueue.splice(0).join(", "));
        }
    }
})().finally(() => process.exit());
