import { IQuestion, IResult, ICase } from "./types";
import { predictText } from "./mind";

const unknownMessages = [
    "Я не понимаю",
    "Объясни проще",
    "Не понятно...",
    "Прости, но я так не понимаю.",
    "Не понял",
    "Эм.. Что?",
    "как то это трудновато. говори понятней :-)",
    "Я умен, но не настолько. :D Что ты имеешь в виду?",
];

const breakMessages = [
    "Ладно",
    "Вернемся к предыдущей теме...",
    "Ок",
];

const killMessages = [
    "Пока",
    "Обращайся!",
    "Увидимся, когда увидимся...",
    "Не кашляй"
];

const sameWayMessages = [
    "Мы об этом и говорим\n\n$lastQuestion",
    "да. продолжим",
    "Я помню. об этом и речь",
    "Да-да!\n$lastQuestion"
];

function arrayRandom<T>(array: T[]) {
    return array[Math.round(Math.random() * (array.length - 1))];
}

export interface IState {
    done?: boolean;

    isBreak?: boolean;
    isKill?: boolean;

    question?: IQuestion;
    cases: ICase[];
}

export class Context {
    questions: IQuestion[] = [];
    results: IResult[] = [];
    cases: ICase[] = [];
    state: IState = {
        cases: [],
    };

    child?: Context;

    process(input: string): string | void {
        const response = this.processRaw(input);

        if (!response) {
            return;
        }

        return response.replace(/\$\w+/gm, (name) => {
            switch (name) {
                case "$lastQuestion": {
                    const {question} = this.state;

                    if (question) {
                        return question.text;
                    }
                }
            }

            return "";
        });
    }

    processRaw(input: string): string | void {
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

        if (this.state.done) {
            return;
        }

        const child = new Context();

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
            this.state.done = true;

            return arrayRandom(breakMessages);
        }

        const hasSameRootWay = child.state.cases.find((item) => item.question === "0") === this.state.cases.find((item) => item.question === "0");

        if (!childResponse || hasSameRootWay) {
            const { question } = this.state;

            if (!question) {
                return;
            }

            if (hasSameRootWay) {
                return arrayRandom(sameWayMessages);
            }

            const unknownList = question.unknown.length ? question.unknown : unknownMessages;

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
            const initQuestion = this.questions[0];

            if (!initQuestion) {
                return;
            }

            this.state.question = initQuestion;
        }

        // Active dialog
        const { question, cases } = this.state;

        if (!question) {
            // Some problems
            this.state.done = true;

            return;
        }

        const currentQuestionCase = cases.find((item) => item.question === question.name);

        if (!currentQuestionCase) {
            // Current question has not answer, now answer is processing
            const currentCases = this.cases.filter((item) => item.question === question.name);

            if (currentCases.length) {
                const activeCase = this.predictCase(question, currentCases, input);

                if (!activeCase) {
                    // Unknown anser
                    return;
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
                }

                // Go to the next question

                this.state.question = this.questions.find((item) => item.name === (activeCase.next || question.next));
            }
        }

        const response: string[] = [];

        while (
            this.state.question
            && !this.cases.some(
                (item) => this.state.question && item.question === this.state.question.name
            )
        ) {
            // Ask the next question
            response.push(this.state.question.text);
            
            // Just redirect
            this.state.question = this.questions.find((item) => item.name === question.next);
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

    protected compileResults(): string | void {
        const results = this.results.filter((result) => (
            testExpression(result.expression, this.state.cases)
        ));

        if (!results.length) {
            return;
        }

        return results.map((item) => arrayRandom(item.texts))
            .filter((value, index, self) => self.indexOf(value) === index)
            .join("\n");
    }
}

function testExpression(expression: any, cases: ICase[]) {
    const {t} = expression;

    switch (t) {
        case "var": {
            const {name} = expression;

            return Boolean(cases.find((item) => (
                `${item.question}.${item.name}` === name
            )));
        }
        case "not": {
            const {a} = expression;

            return !testExpression(a, cases);
        }
        case "and": {
            const {a,b} = expression;

            return testExpression(a, cases) && testExpression(b, cases);
        }
        case "or": {
            const {a,b} = expression;

            return testExpression(a, cases) || testExpression(b, cases);
        }
    }
}
