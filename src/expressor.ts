export interface IHelpers {
    find: (name: string, finders: ((text: string) => any)[], convert?: ((parts: string[]) => any) | undefined) => any,
    str: (text: string) => (input: string) => string | undefined,
    reg: (exp: RegExp) => (input: string) => string | undefined,
}

export function createParser(expr: (helpers: IHelpers) => () => any): (input: string) => any {
    return function (input: string) {
        let cur = 0;
        const locks: any[] = [];

        function unlock(key: string) {
            const index = locks.indexOf(key);

            if (index === -1) {
                return;
            }

            locks.splice(index, 1);
        }

        function find(name: string, finders: Array<(text: string) => any>, convert?: (parts: string[]) => any) {
            const prev = cur;

            const key = `${name}@${prev}`;

            if (locks.includes(key)) {
                return;
            }

            locks.push(key);

            const parts: string[] = [];

            for (let i = 0; i < finders.length; i++) {
                const finder = finders[i];

                const result = finder(input.substring(cur));

                if (result === undefined) {
                    cur = prev;

                    unlock(key);
                    return;
                }

                parts.push(result);
            }

            unlock(key);
            return convert ? convert(parts) : parts;
        }

        function move(text: string) {
            cur += text.length;;

            return text;
        }


        function str(text: string) {
            return function (input: string) {
                if (input.indexOf(text) !== 0) {
                    return;
                }

                return move(text);
            };
        }

        function reg(exp: RegExp) {
            return function (input: string) {
                const result = exp.exec(input);

                if (!result || result.index !== 0) {
                    return;
                }

                const [text] = result;

                return move(text);
            };
        }

        return expr({
            find,
            reg,
            str,
        });
    };
}
