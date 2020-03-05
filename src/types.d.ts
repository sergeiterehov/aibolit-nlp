export interface IQuestion {
    name: string;
    next?: string;
    text: string;
    unknown: string[];
}

export interface ICase {
    name: string;
    question: string;
    next?: string;
    positive: string[];
}

export interface IResult {
    cases: string[];
    text: string;
}
