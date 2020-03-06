module.exports=function(t,e){"use strict";var s={};function __webpack_require__(e){if(s[e]){return s[e].exports}var n=s[e]={i:e,l:false,exports:{}};t[e].call(n.exports,n,n.exports,__webpack_require__);n.l=true;return n.exports}__webpack_require__.ab=__dirname+"/";function startup(){return __webpack_require__(750)}return startup()}({58:function(t){t.exports=require("readline")},82:function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:true});e.synonyms={list:{}};function cmp(t,e){if(!t.length&&!e.length)return 1;if(!t.length||!e.length)return 0;if(t===e)return 1;if(t.length===1&&e.length===1)return 0;if(t.length<2||e.length<2)return 0;let s=new Map;for(let e=0;e<t.length-1;e++){const n=t.substring(e,e+2);const r=s.has(n)?s.get(n)+1:1;s.set(n,r)}let n=0;for(let t=0;t<e.length-1;t++){const r=e.substring(t,t+2);const o=s.has(r)?s.get(r):0;if(o>0){s.set(r,o-1);n++}}return 2*n/(t.length+e.length-2)>.8}function text1(t){return t.trim().toLowerCase().replace(/^[\w\d]/gm,"")}const s=t=>{const s=[t,...e.synonyms.list[t]||[]];return t=>{return s.some(e=>cmp(e,t))}};function predictText(t,e){const n=t.map(t=>{const n=t.split(" ").map(text1).filter(Boolean);const r=e.split(" ").map(text1).filter(Boolean);if(r.length/n.length>5){return+Infinity}const o=n.map(t=>r.findIndex(s(t)));const i=o.filter(t=>t!==-1);const c=o.length-i.length;const u=i.reduce((t,e,s,n)=>[...t,(e-(n[s-1]||0))*(c+1)],[]);if(!u.length){return+Infinity}const a=u.reduce((t,e)=>Math.min(t,e),+Infinity);const l=u.reduce((t,e)=>Math.max(t,e),-Infinity);const f=l-a;const p=(f===0?l:f)/(u.length+1);return p});const r=n.reduce((t,e)=>Math.min(t,e),+Infinity);const o=Number.isFinite(r)?n.indexOf(r):-1;return t[o]}e.predictText=predictText},492:function(t){"use strict";function Parse(t){t=t.slice(2);var e={};var s,n;t.forEach(function(t,r){t=t.split("=");s=t[0];if(s.indexOf("-")===0){s=s.slice(s.slice(0,2).lastIndexOf("-")+1)}n=t.length===2?parseFloat(t[1]).toString()===t[1]?+t[1]:t[1]:true;e[s]=n});return e}t.exports=Parse},575:function(t,e,s){"use strict";Object.defineProperty(e,"__esModule",{value:true});const n=s(82);const r=["Я не понимаю","Объясни проще","Не понятно...","Прости, но я так не понимаю.","Не понял","Эм.. Что?","как то это трудновато. говори понятней :-)","Я умен, но не настолько. :D Что ты имеешь в виду?"];class Context{constructor(){this.questions=[];this.results=[];this.cases=[];this.state={cases:[]}}process(t){if(this.state.done){return}if(!this.state.question&&!this.state.cases.length){const t=this.questions[0];if(!t){return}this.state.question=t}const{question:e,cases:s}=this.state;if(!e){this.state.done=true;return}const n=s.find(t=>t.question===e.name);if(!n){const s=this.cases.filter(t=>t.question===e.name);if(!s.length){this.state.question=this.questions.find(t=>t.name===e.next)}else{const n=this.predictCase(e,s,t);if(!n){const t=e.unknown.length?e.unknown:r;return t[Math.round(Math.random()*(t.length-1))]}this.state.cases.push(n);this.state.question=this.questions.find(t=>t.name===(n.next||e.next))}}const o=this.state.question;if(!o){this.state.done=true;return this.compileResults()}return o.text}predictCase(t,e,s){const r=e.flatMap(t=>t.positive);const o=n.predictText(r,s);if(!o){return}return e.find(t=>t.positive.includes(o))}compileResults(){const t=this.results.filter(t=>testExpression(t.expression,this.state.cases));if(!t.length){return}return t.map(t=>t.text).filter((t,e,s)=>s.indexOf(t)===e).join("\n")}}e.Context=Context;function testExpression(t,e){const{t:s}=t;switch(s){case"var":{const{name:s}=t;return Boolean(e.find(t=>`${t.question}.${t.name}`===s))}case"not":{const{a:s}=t;return!testExpression(s,e)}case"and":{const{a:s,b:n}=t;return testExpression(s,e)&&testExpression(n,e)}case"or":{const{a:s,b:n}=t;return testExpression(s,e)||testExpression(n,e)}}}},662:function(t,e,s){"use strict";Object.defineProperty(e,"__esModule",{value:true});e.argv=s(492)(process.argv)},669:function(t){t.exports=require("util")},747:function(t){t.exports=require("fs")},750:function(t,e,s){"use strict";var n=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:true});const r=n(s(58));const o=n(s(669));const i=s(816);const c=i.createContext();const u=r.default.createInterface({input:process.stdin,output:process.stdout});const a={question:undefined,cases:[]};c.state={question:c.questions.find(t=>t.name===a.question),cases:c.cases.filter(t=>a.cases.includes(`${t.question}.${t.name}`))};(async function(){while(!c.state.done){const t=await new Promise(t=>u.question("> ",t));const e=c.process(t);if(process.env.DEBUG){console.log("[STATE]",o.default.inspect(c.state,false,100,true))}console.log(e||"{EMPTY_RESPONSE}")}})().finally(()=>process.exit())},816:function(t,e,s){"use strict";var n=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:true});const r=n(s(747));const o=n(s(669));const i=s(662);const c=s(575);const u=s(82);if(i.argv.debug){process.env.DEBUG="1"}if(i.argv.synonyms!==undefined){u.synonyms.list=JSON.parse(r.default.readFileSync(typeof i.argv.synonyms==="string"?i.argv.synonyms:"synonyms.json","utf-8"));console.log("Synonyms loaded:",Object.keys(u.synonyms.list).length)}function createContext(){const t=typeof i.argv.config==="string"?i.argv.config:"config.json";const e=JSON.parse(r.default.readFileSync(t,"utf-8"));const s=new c.Context;s.questions.push(...e.questions);s.cases.push(...e.cases);s.results.push(...e.results);if(process.env.DEBUG){console.log("[CONTEXT]",o.default.inspect(s,false,100,true))}return s}e.createContext=createContext}});