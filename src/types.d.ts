import { ActionType } from "./ActionType";

export interface IQuestion {
    name: string;
    next?: string;
    text: string;
    unknown: string[];
    actions: IAction[];
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

export interface IAction {
    on: "in" | "out";
    type: ActionType;
    args: string[];
}
