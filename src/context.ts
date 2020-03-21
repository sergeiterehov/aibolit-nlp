import { IQuestion, IResult, ICase } from "./types";
import { predictText } from "./mind";

const unknownMessages = [
    "Простите, но я вас не понял.",
    "Объясните проще.",
    "Попробуйте перефразировать.",
    "Что вы имеете в виду?",
];

const breakMessages = [
    "Ладно.",
    "Вернемся к предыдущей теме.\n$lastQuestion",
    "Ок.",
];

const killMessages = [
    "Пока",
    "Обращайтесь!",
    "Рад помочь.",
    "Не болейте!",
    "Вы знаете, где меня найти."
];

const sameWayMessages = [
    "Мы об этом и говорим.\n\n$lastQuestion",
    "Да. Давайте продолжим.\n$lastQuestion",
    "Я помню. Об этом и речь.",
    "Да-да!\n$lastQuestion"
];

function arrayRandom<T>(array: T[]) {
    return array[Math.round(Math.random() * (array.length - 1))];
}

export interface IState {
    done?: boolean;

    isBreak?: boolean;
    isKill?: boolean;
    isPrecessPrevChild?: boolean;

    question?: IQuestion;
    cases: ICase[];
    actionsQueue: string[];
    variables: Record<string, string>;
}

export class Context {
    questions: IQuestion[] = [];
    results: IResult[] = [];
    cases: ICase[] = [];
    state: IState = {
        cases: [],
        variables: {},
        actionsQueue: [],
    };

    parent?: Context;
    child?: Context;

    get rootQuestion() {
        const question = this.questions.find((item) => item.text === "main");

        if (!question) {
            throw new Error("Root question not found");
        }

        return question;
    }

    process(input: string): string | void {
        const response = this.processRaw(input);

        if (!response) {
            return;
        }

        return response.replace(/\$([a-zA-Z_]+)/gm, (string, name) => {
            switch (name) {
                case "$lastQuestion": {
                    const {question} = this.state;

                    if (question) {
                        return question.text;
                    }
                }
            }

            const varValue = this.state.variables[name];

            if (varValue !== undefined) {
                return varValue;
            }

            return "";
        });
    }

    processRaw(input: string): string | void {
        const prevChild = this.child;

        if (this.child) {
            if (this.child.state.done) {
                this.child = undefined;
            } else {
                return this.child.process(input);
            }
        }

        const myResponse = this.fiber(input);

        if (myResponse) {
            return myResponse;
        }

        const { question } = this.state;

        if (!question) {
            return;
        }

        const unknownList = question.unknown.length ? question.unknown : unknownMessages;

        if (!this.state.cases.length) {
            if (this.parent) {
                return;
            }

            return arrayRandom(unknownList);
        }

        if (this.state.done) {
            this.state.cases = [];
            this.state.variables = {};
            this.state.question = undefined;

            return;
        }

        const child = new Context();

        child.parent = this;
        child.questions = this.questions;
        child.results = this.results;
        child.cases = this.cases;

        const childResponse = this.state.cases.length ? child.process(input) : undefined;

        if (child.state.isKill) {
            this.state.isKill = true;
            this.state.done = true;

            return arrayRandom(killMessages);
        }

        if (child.state.isBreak) {
            if (this.child || prevChild) {
                this.child = undefined;
            } else {
                this.state.done = true;
            }

            return arrayRandom(breakMessages);
        }

        if (child.state.isPrecessPrevChild) {
            if (prevChild) {
                this.child = prevChild;

                return prevChild.compileResults();
            } else {
                // This about current thread
                return question.text;
            }
        }

        const myRootCase = this.state.cases.find((item) => item.question === this.rootQuestion.name);
        const hasSameRootWay = myRootCase && child.state.cases.includes(myRootCase);

        if (hasSameRootWay) {
            return arrayRandom(sameWayMessages);
        }
        
        if (!childResponse) {
            // Save prev anyway
            this.child = prevChild;

            return arrayRandom(unknownList);
        }

        this.child = child;

        return childResponse;
    }

    protected fiber(input: string): string | void {
        if (this.state.done) {
            // Dialog has been complete
            return;
        }

        if (!this.state.question && !this.state.cases.length) {
            // Init dialog
            const initQuestion = this.rootQuestion;

            if (!initQuestion) {
                return;
            }

            this.redirect(initQuestion);
        }

        // Active dialog
        const { question, cases } = this.state;

        if (!question) {
            // Some problems
            this.state.done = true;

            return;
        }

        const exprTest = testExpression(this.state.cases, this.state.variables);

        const currentCases = this.cases
            .filter((item) => item.question === question.name)
            .filter((item) => !item.expression || exprTest(item.expression));

            // Current question has not answered, now answer is processing

        if (currentCases.length) {
            const activeCase = this.predictCase(question, currentCases, input);

            if (!activeCase) {
                return;
            }

            if (question.userInput) {
                // Save to variable

                this.state.variables[question.userInput] = activeCase.sourceName;
            }

            this.state.cases.push(activeCase);

            switch (activeCase.action) {
                case "break": {
                    this.state.isBreak = true;
                    this.state.done = true;

                    return;
                }
                case "kill": {
                    this.state.isKill = true;
                    this.state.done = true;

                    return;
                }
                case "processPrevChild": {
                    this.state.isPrecessPrevChild = true;
                    this.state.done = true;

                    return;
                }
            }

            // Go to the next question

            this.redirect(this.questions.find((item) => (
                item.name === (activeCase.next || question.next)
            )));
        } else if (question.userInput) {
            // User input
            
            this.state.variables[question.userInput] = input;

            // Go to the next question

            this.redirect(this.questions.find((item) => (
                item.name === question.next
            )));
        }

        const response: string[] = [];

        while (
            true
        ) {
            const question = this.state.question;

            if (!question) {
                break;
            }

            // Ask the next question
            response.push(question.text);

            const hasCases = question.userInput || this.cases.some(
                (item) => item.question === question.name
            );

            if (hasCases) {
                break;
            }

            // Just redirect
            this.redirect(this.questions.find((item) => item.name === question.next));
        }

        if (!response.length && this.state.question) {
            response.push(this.state.question.text);
        }

        if (!this.state.question) {
            // It is final, send results
            this.state.done = true;

            const resultsString = this.compileResults();

            if (resultsString) {
                response.push(resultsString);
            }
        }

        if (!response.length) {
            return;
        }

        // sending next question

        return response.join("\n");
    }

    protected predictCase(question: IQuestion, cases: ICase[], input: string): ICase | void {
        const fullList = cases.flatMap((item) => item.positive);
        const result = predictText(fullList, input);

        if (!result) {
            return;
        }

        return cases.find((item) => item.positive.includes(result));
    }

    protected redirect(question?: IQuestion) {
        if (this.state.question && this.state.question.actions.length) {
            this.processActions(this.state.question.actions);
        }

        this.state.question = question;
    }

    protected processActions(actions: string[]) {
        this.state.actionsQueue.push(...actions);
    }

    protected compileResults(): string | void {
        const results = this.results.filter((result) => (
            testExpression(this.state.cases, this.state.variables)(result.expression)
        ));

        if (!results.length) {
            return;
        }

        return results.map((item) => arrayRandom(item.texts))
            .filter((value, index, self) => self.indexOf(value) === index)
            .join("\n");
    }
}

function testExpression(cases: ICase[], variables: Record<string, string>) {
    return function test(expression: any) {
        const {t} = expression;

        switch (t) {
            case "var": {
                const {name} = expression;

                return Boolean(variables[name])
                    || Boolean(cases.find((item) => (
                        `${item.question}.${item.name}` === name
                    )));
            }
            case "not": {
                const {a} = expression;

                return !test(a);
            }
            case "and": {
                const {a,b} = expression;

                return test(a) && test(b);
            }
            case "or": {
                const {a,b} = expression;

                return test(a) || test(b);
            }
        }
    };
}
