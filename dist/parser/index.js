module.exports=function(e,t){"use strict";var n={};function __webpack_require__(t){if(n[t]){return n[t].exports}var s=n[t]={i:t,l:false,exports:{}};e[t].call(s.exports,s,s.exports,__webpack_require__);s.l=true;return s.exports}__webpack_require__.ab=__dirname+"/";function startup(){return __webpack_require__(71)}return startup()}({71:function(e,t,n){"use strict";var s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:true});const r=s(n(747));const o=n(662);const u=n(273);const c=typeof o.argv.in==="string"?o.argv.in:0;const i=typeof o.argv.out==="string"?o.argv.out:typeof o.argv.out==="boolean"?`${c}.out.json`:1;const a=u.parseFile(c);const f=JSON.stringify(a);r.default.writeFileSync(i,f,"utf-8")},81:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:true});function createParser(e){return function(t){let n=0;const s=[];function unlock(e){const t=s.indexOf(e);if(t===-1){return}s.splice(t,1)}function find(e,r,o){const u=n;const c=`${e}@${u}`;if(s.includes(c)){return}s.push(c);const i=[];for(let e=0;e<r.length;e++){const s=r[e];const o=s(t.substring(n));if(o===undefined){n=u;unlock(c);return}i.push(o)}unlock(c);return o?o(i):i}function move(e){n+=e.length;return e}function str(e){return function(t){if(t.indexOf(e)!==0){return}return move(e)}}function reg(e){return function(t){const n=e.exec(t);if(!n||n.index!==0){return}const[s]=n;return move(s)}}return e({find:find,reg:reg,str:str})}}t.createParser=createParser},273:function(e,t,n){"use strict";var s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:true});const r=s(n(747));const o=n(878);let u=0;function parseFile(e){u+=1;const t=u;const n=r.default.readFileSync(e,"utf-8").replace(/\r\n/gm,"\n").replace(/\s*\\\\s*\n/gm,"<br>").split("\n").map(e=>e.replace(/<br>/gm,"\n"));let s=0;function id(e){if(!e){return e}if(e==="0"){return e}return`${t}_${e}`}const c=o.createBooleanParser(id);function parser(e){return(...t)=>{const r=s;while(n[s]!==undefined&&n[s].trim()===""){s+=1}if(n[s]===undefined){return}const o=e(...t);if(!o){s=r;return}return o}}const i=parser(()=>{const e=/^@include\s+(?<file>.+)/gms;const t=n[s++];const r=e.exec(t);if(!r||!r.groups){return}const o=r.groups;return o.file});const a=parser(()=>{const e=n[s++];const t=/^(?<name>\d+)\.(\s*\$(?<userInput>[a-zA-Z_]+)\s*=)?\s*(?<questionText>.+)/gms;const r=t.exec(e);if(!r||!r.groups){return}const{questionText:o,name:u,userInput:c}=r.groups;const i=/^\s*(?<text>.+)\s+->\s*(?<next>\d+)/gms;const a=/^\s*(?<text>.+)/gms;const f=i.exec(o)||a.exec(o);if(!f||!f.groups){return}const{text:p,next:l}=f.groups;return{name:id(u),text:p,next:id(l),unknown:[],actions:[],userInput:c}});const f=parser(({question:e})=>{const t=n[s++];const r=/\s+(?<name>[a-zA-Z_]+)\.(\s*(?<expression>.+)\s+\?)?\s*(?<caseText>.+)/gms;const o=r.exec(t);if(!o||!o.groups){return}const{caseText:u,name:i,expression:a}=o.groups;const f=/^\s*(?<text>.+)\s+->\s*(?<next>\d+)/gms;const p=/^\s*(?<text>.+)\s+::\s*(?<action>.+)/gms;const l=/^\s*(?<text>.+)/gms;const _=f.exec(u)||p.exec(u)||l.exec(u);if(!_||!_.groups){return}const{text:x,next:g,action:d}=_.groups;const m=x.split("|").map(e=>e.trim());return{question:e,name:id(i),sourceName:i,positive:m,next:id(g),action:d,expression:a?c(a):undefined}});const p=parser(()=>{const e=/^\s+--\s+(?<text>.+)/gms;const t=n[s++];const r=e.exec(t);if(!r||!r.groups){return}const o=r.groups;return o.text});const l=parser(()=>{const e=/^\s+\*\s+\$(?<varName>[a-zA-Z_]+)/gms;const t=n[s++];const r=e.exec(t);if(!r||!r.groups){return}const{varName:o}=r.groups;return o});const _=parser(()=>{const e=/^\s+::\s+(?<actionName>[a-zA-Z_]+)/gms;const t=n[s++];const r=e.exec(t);if(!r||!r.groups){return}const{actionName:o}=r.groups;return o});const x=parser(()=>{const e=a();if(!e){return}const t=[];while(true){const n=f({question:e.name});if(n){t.push(n);continue}const s=p();if(s){e.unknown.push(s);continue}const r=l();if(r){e.userInput=r;continue}const o=_();if(o){e.actions.push(o);continue}break}return{question:e,cases:t}});const g=parser(()=>{const e=/^-\s+(?<text>.+):\s+(?<expression>.+)/gms;const t=n[s++];const r=e.exec(t);if(!r||!r.groups){return}const o=r.groups;return{texts:o.text.split("|").map(e=>e.trim()),expression:c(o.expression)}});const d=parser(()=>{const e=[];const t=[];const n=[];while(true){const s=i();if(s){const r=parseFile(s);if(r){e.push(...r.questions.filter(e=>e.name!=="0"));t.push(...r.cases);n.push(...r.results)}continue}const r=x();if(r){e.push(r.question);t.push(...r.cases);continue}const o=g();if(o){n.push(o);continue}break}return{cases:t,questions:e,results:n}});return d()}t.parseFile=parseFile},492:function(e){"use strict";function Parse(e){e=e.slice(2);var t={};var n,s;e.forEach(function(e,r){e=e.split("=");n=e[0];if(n.indexOf("-")===0){n=n.slice(n.slice(0,2).lastIndexOf("-")+1)}s=e.length===2?parseFloat(e[1]).toString()===e[1]?+e[1]:e[1]:true;t[n]=s});return t}e.exports=Parse},662:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:true});t.argv=n(492)(process.argv)},747:function(e){e.exports=require("fs")},878:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:true});const s=n(81);t.createBooleanParser=(e=>s.createParser(({find:t,str:n,reg:s})=>{function _(e){return s(/\s*/)(e)}function V(){return t("V",[s(/\d+/),n("."),s(/\w+/)],t=>({t:"var",name:`${e(t[0])}.${e(t[2])}`}))||t("V",[n("$"),s(/[\w\d\._]+/)],e=>({t:"var",name:e[1]}))}function N(){return t("N.neg",[n("-"),_,E],e=>({t:"not",a:e[2]}))||V()}function E(){return t("E.()",[n("("),_,AS,_,n(")")],e=>e[2])||N()}function MD(){return t("MD.and",[E,_,n("&"),_,MD],e=>({t:"and",a:e[0],b:e[4]}))||E()}function AS(){return t("AS.or",[MD,_,n("|"),_,AS],e=>({t:"or",a:e[0],b:e[4]}))||MD()}return t("main",[_,AS,_],e=>e[1])}))}});