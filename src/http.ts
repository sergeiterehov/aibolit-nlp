import util from "util";
import { argv } from "./argv";
import express from "express";
import bodyParser from "body-parser";
import { createContext } from "./provider";
import { IState } from "./context";

const port = typeof argv.port === "number" ? argv.port : 3501;

const context = createContext();

const app = express();

const userContexts = new Map<string, IState>();
const userContextTimeoutMap = new Map<string, number>();

app.use(bodyParser.json({limit: "10mb"}));

export const withErrorHandler = (methodHandler: express.RequestHandler): express.RequestHandler => {
    return async function methodWithErrorHandler(req, res, next) {
        try {
            await new Promise(async (resolve, reject) => {
                try {
                    await methodHandler(req, res, resolve);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            if (process.env.DEBUG) {
                console.error("[ERROR]", e);
            }

            if (e instanceof Error) {
                return res.status(500).send({error: e.message || "UNKNOWN_ERROR"});
            }

            return res.status(500).send({error: String(e || "UNKNOWN_ERROR")});
        }

        next();
    }
};

app.post("/process", withErrorHandler(async (req, res) => {
    const key = req.body.context ? String(req.body.context) : undefined;

    if (!key) {
        throw new Error("context is required");
    }

    const expiredAt = userContextTimeoutMap.get(key);

    if (expiredAt && Number(new Date()) > expiredAt) {
        userContextTimeoutMap.delete(key);
        userContexts.delete(key);
    }

    if (!userContexts.get(key)) {
        userContexts.set(key, {
            cases: [],
        });
    }

    userContextTimeoutMap.set(key, Number(new Date()) + 1000 * 3600 * 24 * 1);

    const userContext = userContexts.get(key);

    if (!userContext) {
        throw new Error("context not found");
    }
    
    context.state = userContext;

    const userInput: string = req.body.input;
    const systemOutput = context.process(userInput);

    if (context.state.done) {
        userContexts.delete(key);
    }

    if (process.env.DEBUG) {
        console.log("[STATE]", util.inspect(context.state, false, 100, true));
    }

    if (!systemOutput) {
        throw new Error("EMPTY_RESPONSE");
    }

    res.send({
        output: systemOutput
    })
}));

app.listen(port, () => {
    console.log("HTTP Client started on", port);
});
