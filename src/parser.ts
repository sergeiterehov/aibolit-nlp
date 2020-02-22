import fs from "fs";
import { argv } from "yargs";
import { IQuestion, ICase, IResult } from "./types";

const inputFile = typeof argv.in === "string" ? argv.in : 0;
const outputFile = typeof argv.out === "string"
    ? argv.out
    : typeof argv.out === "boolean"
        ? `${inputFile}.out.json`
        : 1;

const content = fs.readFileSync(inputFile, "utf-8").split("\n");

let cur = 0;

function parser<T, C>(parser: (context: C) => T | void): (context: C) => T | void;
function parser<T>(parser: () => T | void): () => T | void;
function parser<T, C = undefined>(parser: (context?: C) => T | void): (context?: C) => T | void {
    return (...args) => {
        const prevCursorPosition = cur;

        while (content[cur] !== undefined && content[cur].trim() === "") {
            cur += 1;
        }

        if (content[cur] === undefined) {
            return;
        }

        const result = parser(...args);

        if (!result) {
            cur = prevCursorPosition;

            return;
        }

        return result;
    };
}

const parseQuestion = parser<IQuestion>(() => {
    const testWithLink = /^(?<name>\d+)\.\s*(?<text>.+)\s+->\s*(?<next>\d+)/gm;
    const testNoLink = /^(?<name>\d+)\.\s*(?<text>.+)/gm;

    const line = content[cur++];

    const withLink = testWithLink.exec(line) || testNoLink.exec(line);

    if (!withLink || !withLink.groups) {
        return;
    }

    const props = withLink.groups;

    return {
        name: props.name,
        text: props.text,
        next: props.next,
    }
});

const parseCase = parser<ICase, { question: string }>(({ question }) => {
    const testWithLink = /^\s+(?<name>\w+)\.\s*(?<text>.+)\s+->\s*(?<next>\d+)/gm;
    const testNoLink = /^\s+(?<name>\w+)\.\s*(?<text>.+)/gm;

    const line = content[cur++];

    const withLink = testWithLink.exec(line) || testNoLink.exec(line);

    if (!withLink || !withLink.groups) {
        return;
    }

    const props = withLink.groups;

    const positive = props.text.split("|").map((item) => item.trim());

    return {
        question,
        name: props.name,
        positive,
        next: props.next,
    }
});

const parseQuestionBlock = parser<{
    question: IQuestion;
    cases: ICase[];
}>(() => {
    const question = parseQuestion();

    if (!question) {
        return;
    }

    const cases: ICase[] = [];

    while (true) {
        const answer = parseCase({ question: question.name });

        if (!answer) {
            break;
        }

        cases.push(answer);
    }

    return {
        question,
        cases,
    }
});

const parseResultBlock = parser<IResult[]>(() => {
    const testResult = /^-\s+(?<text>.+):\s+(?<groups>.+)/gm;

    const line = content[cur++];

    const result = testResult.exec(line);


    if (!result || !result.groups) {
        return;
    }

    const props = result.groups;

    return props.groups.split("|")
        .map((item) => item.trim())
        .map((group): IResult => {
            return {
                text: props.text,
                cases: group.split(",").map((item) => item.trim()),
            };
        });
});

const parseFile = parser<{
    questions: IQuestion[];
    cases: ICase[];
    results: IResult[];
}>(() => {
    const questions: IQuestion[] = [];
    const cases: ICase[] = [];
    const results: IResult[] = [];

    while (true) {
        const questionBlock = parseQuestionBlock();

        if (questionBlock) {
            questions.push(questionBlock.question);
            cases.push(...questionBlock.cases);

            continue;
        }

        const resultBlock = parseResultBlock();

        if (resultBlock) {
            results.push(...resultBlock);

            continue;
        }

        break;
    }

    return {
        cases,
        questions,
        results,
    };
});

const result = parseFile();
const outputContent = JSON.stringify(result);

fs.writeFileSync(outputFile, outputContent, "utf-8");
