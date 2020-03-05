function text1(text: string) {
    return text
        .trim()
        .toLowerCase()
        .replace(/^[\w\d]/, "");
}

function text2(a: string, b: string) {
    return text1(a) === text1(b);
}

export function predictText(list: string[], input: string) {
    return list.find((text) => text2(text, input));
}
