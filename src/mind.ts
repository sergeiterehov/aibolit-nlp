function text1(text: string) {
    return text
        .trim()
        .toLowerCase()
        .replace(/^[\w\d]/gm, "");
}

export function predictText(list: string[], input: string) {
    const ratings = list.map((text) => {
        const target = text.split(" ").map(text1).filter(Boolean);
        const value = input.split(" ").map(text1).filter(Boolean);

        const ordList = target.map((text) => value.indexOf(text));
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

        const min = ordListDiff.reduce((acc, val) => Math.min(acc, val), +Infinity);
        const max = ordListDiff.reduce((acc, val) => Math.max(acc, val), -Infinity);
        const range = max - min;

        const rating = !ordListDiff.length
            ? +Infinity
            : (range === 0 ? max : range) / (ordListDiff.length + 1);

        return rating;
    });

    const bestRating = ratings.reduce((acc, val) => Math.min(acc, val), +Infinity);

    const bestIndex = Number.isFinite(bestRating) ? ratings.indexOf(bestRating) : -1;

    return list[bestIndex];
}
