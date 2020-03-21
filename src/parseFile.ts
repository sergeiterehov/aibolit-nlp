import fs from "fs";
import { IQuestion, ICase, IResult } from "./types";
import { createBooleanParser } from "./parseBoolean";

let globalUid = 0;

export function parseFile(inputFile) {
    globalUid += 1;

    const uid = globalUid;

    const content = fs.readFileSync(inputFile, "utf-8")
        .replace(/\r\n/gm, "\n")
        .replace(/\s*\\\\s*\n/gm, "<br>")
        .split("\n")
        .map((line) => line.replace(/<br>/gm, "\n"));

    let cur = 0;

    function id(name: string): string {
        if (!name) {
            return name;
        }

        if (name === "0") {
            return name;
        }

        return `${uid}_${name}`;
    }

    const parseExpression = createBooleanParser(id);

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

    const parseInclude = parser<string>(() => {
        const testLine = /^@include\s+(?<file>.+)/gms;
        
        const line = content[cur++];

        const res = testLine.exec(line);

        if (!res || !res.groups) {
            return;
        }

        const props = res.groups;

        return props.file;
    });

    const parseQuestion = parser<IQuestion>(() => {
        const line = content[cur++];

        const testMain = /^(?<name>\d+)\.(\s*\$(?<userInput>[a-zA-Z_]+)\s*=)?\s*(?<questionText>.+)/gms;
        
        const main = testMain.exec(line);

        if (!main || !main.groups) {
            return;
        }

        const { questionText, name, userInput } = main.groups;

        const testWithLink = /^\s*(?<text>.+)\s+->\s*(?<next>\d+)/gms;
        const testNoLink = /^\s*(?<text>.+)/gms;

        const withLink = testWithLink.exec(questionText) || testNoLink.exec(questionText);

        if (!withLink || !withLink.groups) {
            return;
        }

        const { text, next } = withLink.groups;

        return {
            name: id(name),
            text: text,
            next: id(next),
            unknown: [],
            actions: [],
            userInput,
        }
    });

    const parseCase = parser<ICase, { question: string }>(({ question }) => {
        const line = content[cur++];

        const testMain = /\s+(?<name>[a-zA-Z_]+)\.(\s*(?<expression>.+)\s+\?)?\s*(?<caseText>.+)/gms;
        
        const main = testMain.exec(line);

        if (!main || !main.groups) {
            return;
        }

        const { caseText, name, expression: expressionString } = main.groups;

        const testWithLink = /^\s*(?<text>.+)\s+->\s*(?<next>\d+)/gms;
        const testWithAction = /^\s*(?<text>.+)\s+::\s*(?<action>.+)/gms;
        const testNoLink = /^\s*(?<text>.+)/gms;

        const withLink = testWithLink.exec(caseText) || testWithAction.exec(caseText) || testNoLink.exec(caseText);

        if (!withLink || !withLink.groups) {
            return;
        }

        const { text, next, action } = withLink.groups;

        const positive = text.split("|").map((item) => item.trim());

        return {
            question,
            name: id(name),
            sourceName: name,
            positive,
            next: id(next),
            action,
            expression: expressionString ? parseExpression(expressionString) : undefined,
        }
    });

    const parseUnknown = parser<string>(() => {
        const testLine = /^\s+--\s+(?<text>.+)/gms;
        
        const line = content[cur++];

        const res = testLine.exec(line);

        if (!res || !res.groups) {
            return;
        }

        const props = res.groups;

        return props.text;
    });

    const parseUserInput = parser<string>(() => {
        const testLine = /^\s+\*\s+\$(?<varName>[a-zA-Z_]+)/gms;
        
        const line = content[cur++];

        const res = testLine.exec(line);

        if (!res || !res.groups) {
            return;
        }

        const { varName } = res.groups;

        return varName;
    });

    const parseAction = parser<string>(() => {
        const testLine = /^\s+::\s+(?<actionName>[a-zA-Z_]+)/gms;
        
        const line = content[cur++];

        const res = testLine.exec(line);

        if (!res || !res.groups) {
            return;
        }

        const { actionName } = res.groups;

        return actionName;
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

            if (answer) {
                cases.push(answer);

                continue;
            }

            const unknown = parseUnknown();

            if (unknown) {
                question.unknown.push(unknown);

                continue;
            }

            const userInput = parseUserInput();

            if (userInput) {
                question.userInput = userInput;

                continue;
            }

            const action = parseAction();

            if (action) {
                question.actions.push(action);

                continue;
            }

            break;
        }

        return {
            question,
            cases,
        }
    });

    const parseResultBlock = parser<IResult>(() => {
        const testResult = /^-\s+(?<text>.+):\s+(?<expression>.+)/gms;

        const line = content[cur++];

        const result = testResult.exec(line);

        if (!result || !result.groups) {
            return;
        }

        const props = result.groups;

        return {
            texts: props.text.split("|").map((item) => item.trim()),
            expression: parseExpression(props.expression),
        };
    });

    const currentFileParser = parser<{
        questions: IQuestion[];
        cases: ICase[];
        results: IResult[];
    }>(() => {
        const questions: IQuestion[] = [];
        const cases: ICase[] = [];
        const results: IResult[] = [];

        while (true) {
            const depFileName = parseInclude();

            if (depFileName) {
                const dep = parseFile(depFileName);

                if (dep) {
                    questions.push(...dep.questions.filter((item) => item.name !== "0"));
                    cases.push(...dep.cases);
                    results.push(...dep.results);
                }

                continue;
            }

            const questionBlock = parseQuestionBlock();

            if (questionBlock) {
                questions.push(questionBlock.question);
                cases.push(...questionBlock.cases);

                continue;
            }

            const resultBlock = parseResultBlock();

            if (resultBlock) {
                results.push(resultBlock);

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

    return currentFileParser();
}