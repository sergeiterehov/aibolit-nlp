import { IQuestion, IResult, ICase } from "./types";

function text1(text: string) {
    return text
        .trim()
        .toLowerCase()
        .replace(/^[\w\d]/, "");
}

function text2(a: string, b: string) {
    return text1(a) === text1(b);
}

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
        } else {
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
                const activeCase = this.predictCase(question, currentCases, input);

                if (!activeCase) {
                    // Unknown anser
                    return "I don't understand. :-("; // or return;
                }

                this.state.cases.push(activeCase);

                // Go to the next question

                this.state.question = this.questions.find((item) => item.name === (activeCase.next || question.next));
            }
        }

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
        return cases.find((item) => item.positive.find((text) => text2(text, input)))
    }

    compileResults(): string | void {
        const results = this.results.filter((result) => (
            result.cases.reduce((acc: boolean, fullName) => (
                acc && Boolean(this.state.cases.find((item) => (
                    `${item.question}.${item.name}` === fullName
                )))
            ), true)
        ));

        if (!results.length) {
            return;
        }

        return results.map((item) => item.text).join("\n");
    }
}
