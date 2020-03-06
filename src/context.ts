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

export interface IState {
    done?: boolean;
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

    process(input: string): string | void {
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

            if (!currentCases.length) {
                // Just redirect

                this.state.question = this.questions.find((item) => item.name === question.next);
            } else {
                const activeCase = this.predictCase(question, currentCases, input);

                if (!activeCase) {
                    // Unknown anser
                    const unknownList = question.unknown.length ? question.unknown : unknownMessages;

                    return unknownList[Math.round(Math.random() * (unknownList.length - 1))];
                }

                this.state.cases.push(activeCase);

                // Go to the next question

                this.state.question = this.questions.find((item) => item.name === (activeCase.next || question.next));
            }
        }

        // Ask the next question
        const nextQuestion = this.state.question;

        if (!nextQuestion) {
            // It is final, send results
            this.state.done = true;

            return this.compileResults();
        }

        // sending next question

        return nextQuestion.text;
    }

    predictCase(question: IQuestion, cases: ICase[], input: string): ICase | void {
        const fullList = cases.flatMap((item) => item.positive);
        const result = predictText(fullList, input);

        if (!result) {
            return;
        }

        return cases.find((item) => item.positive.includes(result));
    }

    compileResults(): string | void {
        const results = this.results.filter((result) => (
            testExpression(result.expression, this.state.cases)
        ));

        if (!results.length) {
            return;
        }

        return results.map((item) => item.text)
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
