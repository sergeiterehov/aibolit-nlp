export const synonyms = {
    list: {},
};

export function arrayRandom<T>(array: T[]) {
    return array[Math.round(Math.random() * (array.length - 1))];
}

function cmp(a: string, b: string) {
    if (!a.length && !b.length) return 1;
    if (!a.length || !b.length) return 0;
    if (a === b) return 1;
    if (a.length === 1 && b.length === 1) return 0;
    if (a.length < 2 || b.length < 2) return 0;

    let firstBigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
        const bigram = a.substring(i, i + 2);
        const count = firstBigrams.has(bigram)
            ? firstBigrams.get(bigram) + 1
            : 1;

        firstBigrams.set(bigram, count);
    };

    let intersectionSize = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bigram = b.substring(i, i + 2);
        const count = firstBigrams.has(bigram)
            ? firstBigrams.get(bigram)
            : 0;

        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    return (2.0 * intersectionSize) / (a.length + b.length - 2) > 0.8;
};

function text1(text: string) {
    return text
        .trim()
        .toLowerCase()
        .replace(/^[\w\d]/gm, "")
        .replace("ё", "е");
}

const text2 = (a: string) => {
    const list = [
        a,
        ...(synonyms.list[a] || []),
    ];

    return (b: string) => {
        return list.some((aItem) => cmp(aItem, b));
    };
}

function checkDiffNotContext(a: string[], b: string[]) {
    const aNot = a.includes("не") || a.includes("нет");
    const bNot = b.includes("не") || b.includes("нет");

    return aNot && !bNot || !aNot && bNot;
}

function distance2(input: string) {
    return function (text: string) {
        const target = text.split(" ").map(text1).filter(Boolean);
        const value = input.split(" ").map(text1).filter(Boolean);

        const ordList = target.map((text) => value.findIndex(text2(text)));

        const ordListClear = ordList.filter((val) => val !== -1);

        const foundNumber = ordListClear.length;

        if (!foundNumber) {
            return Infinity;
        }

        const wordsNumber = ordList.length;
        const notFoundNumber = wordsNumber - foundNumber;

        // Если слишком много промахов, то ошибку не стоит даже считать.
        if (notFoundNumber / wordsNumber > 0.5) {
            return Infinity;
        }

        const inputNumber = value.length;
        const noiseNumber = Math.max(inputNumber - foundNumber, 0);

        // Слишком много лишних слов.
        if (noiseNumber / inputNumber > 0.7) {
            return Infinity;
        }

        const shiftedList = ordListClear.map((val, i, list) => {
            // Отрицательные значения (обратный порядок), станут еще меньше!
            return i === 0 ? val : (val - list[i - 1]) - 1;
        });

        const accOffsetsError = Math.sqrt(shiftedList.reduce((acc, offset) => {
            // Если порядок правильный, и отставание не сильное, то можно пропустить.
            if (offset > 0 && offset < 3) {
                return acc;
            }

            // Если слово сильно отстает, то нужно это учесть.
            return acc + Math.pow(Math.abs(offset), 2);
        }, 0)) / foundNumber;

        const notContextError = checkDiffNotContext(target, value) ? 2 : 1;

        const fullError = (Math.pow(notFoundNumber, 2) + accOffsetsError) / wordsNumber * notContextError;

        return fullError;
    };
}

export function predictText(list: string[], input: string) {
    const errors = list.map(distance2(input));

    if (process.env.DEBUG) {
        console.log("[ERRORS]", Object.fromEntries(list.map((item, i) => [item, errors[i]]).filter(([,e]) => e < Infinity)));
    }

    const minError = errors.reduce((acc, val) => Math.min(acc, val), +Infinity);

    if (!Number.isFinite(minError)) {
        return;
    }

    const bestIndexes = errors.reduce((list: number[], e, i) => {
        // Принимаем варианты с незначительным отклонением от ошибки
        return Math.abs(e - minError) <= 0.1 * minError ? [...list, i] : list;
    }, []);

    return list[arrayRandom(bestIndexes)];
}
