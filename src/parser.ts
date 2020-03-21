import fs from "fs";
import { argv } from "./argv";
import { parseFile } from "./parseFile";

const inputFile = typeof argv.in === "string" ? argv.in : 0;
const outputFile = typeof argv.out === "string"
    ? argv.out
    : typeof argv.out === "boolean"
        ? `${inputFile}.out.json`
        : 1;

const result = parseFile(inputFile);
const outputContent = JSON.stringify(result);

fs.writeFileSync(outputFile, outputContent, "utf-8");
