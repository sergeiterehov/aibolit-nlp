import readline from "readline";
import util from "util";
import { createContext } from "./provider";

const context = createContext();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const cliContext: {
    question?: string;
    cases: string[];
} = {
    question: undefined,
    cases: [],
};

context.state = {
    question: context.questions.find((item) => item.name === cliContext.question),
    cases: context.cases.filter((item) => cliContext.cases.includes(`${item.question}.${item.name}`)),
};

(async function () {
    while (!context.state.done) {
        const userInput: string = await new Promise((done) => rl.question('> ', done));
        const systemOutput = context.process(userInput);
    
        if (process.env.DEBUG) {
            console.log("[STATE]", util.inspect(context.state, false, 100, true));
        }

        console.log(systemOutput || "{EMPTY_RESPONSE}");
    }
})().finally(() => process.exit());
