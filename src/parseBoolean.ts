import { createParser } from "./expressor";

export const createBooleanParser = (id: (name: string) => string) => createParser(({
    find,
    str,
    reg,
}) => {
    function _(input: string) {
        return reg(/\s*/)(input);
    }
    
    function V() {
        return find("V", [reg(/\d+/), str("."), reg(/\w+/)], (p) => ({t:"var", name:`${id(p[0])}.${id(p[2])}`}))
            || find("V", [reg(/\$[\w\d\._]+/)], (p) => ({t:"var", name:p[0]}));
    }
    
    function N() {
        return find("N.neg", [str("-"), _, E], (p) => ({t:"not", a:p[2]}))
            || V()
    }
    
    function E() {
        return find("E.()", [str("("), _, AS, _, str(")")], (p) => p[2])
            || N()
    }
    
    function MD() {
        return find("MD.and", [E, _, str("&"), _, MD], (p) => ({t:"and", a:p[0], b:p[4]}))
            || E()
    }
    
    function AS() {
        return find("AS.or", [MD, _, str("|"), _, AS], (p) => ({t:"or", a:p[0], b:p[4]}))
            || MD()
    }
    
    return find("main", [_, AS, _], (p) => p[1]);
});
