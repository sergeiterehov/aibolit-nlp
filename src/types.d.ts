export interface IQuestion {
    name: string;
    next?: string;
    text: string;
    unknown: string[];
    actions: string[];
    userInput?: string;
}

export interface ICase {
    name: string;
    sourceName: string;
    question: string;
    next?: string;
    positive: string[];
    action?: string;
    expression?: object;
}

export interface IResult {
    expression: object;
    texts: string[];
}
