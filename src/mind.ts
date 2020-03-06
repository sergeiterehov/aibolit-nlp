export const synonyms = {
    list: {},
};

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
        .replace(/^[\w\d]/gm, "");
}

const text2 = (a: string) => {
    return (b: string) => {
        return [
            b,
            ...(synonyms.list[b] || []),
        ].some((bItem) => cmp(a, bItem));
    };
}

export function predictText(list: string[], input: string) {
    const ratings = list.map((text) => {
        const target = text.split(" ").map(text1).filter(Boolean);
        const value = input.split(" ").map(text1).filter(Boolean);

        // Если слишком много слов, то скорей всего понять смысл не получится
        if (value.length / target.length > 5) {
            return +Infinity;
        }

        const ordList = target.map((text) => value.findIndex(text2(text)));
        // 1, -1, 4, 2, 7
        const ordListClear = ordList.filter((val) => val !== -1);
        // 1, 4, 2, 7
        const notFoundNumber = ordList.length - ordListClear.length;
        // notFound = 1
        const ordListDiff = ordListClear.reduce((list: number[], val, i, all) => [
            ...list,
            (val - (all[i - 1] || 0)) * (notFoundNumber + 1),
        ], []);
        // 1, 3, -2, 5

        if (!ordListDiff.length) {
            return +Infinity;
        }

        const min = ordListDiff.reduce((acc, val) => Math.min(acc, val), +Infinity);
        const max = ordListDiff.reduce((acc, val) => Math.max(acc, val), -Infinity);
        const range = max - min;

        const rating = (range === 0 ? max : range) / (ordListDiff.length + 1);

        return rating;
    });

    const bestRating = ratings.reduce((acc, val) => Math.min(acc, val), +Infinity);

    const bestIndex = Number.isFinite(bestRating) ? ratings.indexOf(bestRating) : -1;

    return list[bestIndex];
}
