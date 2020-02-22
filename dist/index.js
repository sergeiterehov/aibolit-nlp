module.exports=function(t,e){"use strict";var s={};function __webpack_require__(e){if(s[e]){return s[e].exports}var n=s[e]={i:e,l:false,exports:{}};t[e].call(n.exports,n,n.exports,__webpack_require__);n.l=true;return n.exports}__webpack_require__.ab=__dirname+"/";function startup(){return __webpack_require__(325)}return startup()}({58:function(t){t.exports=require("readline")},325:function(t,e,s){"use strict";const n=s(58);const i=n.createInterface({input:process.stdin,output:process.stdout});class Context{constructor(){this.questions=[];this.results=[];this.cases=[];this.state={cases:[]}}process(t){if(this.state.done){return}if(!this.state.question&&!this.state.cases.length){const t=this.questions[0];if(!t){return}this.state.question=t}else{const{question:e,cases:s}=this.state;if(!e){return}const n=s.find(t=>t.question===e.name);if(!n){const s=this.cases.filter(t=>t.question===e.name);const n=this.predictCase(e,s,t);if(!n){return"I don't understand. :-("}this.cases.push(n);this.state.question=this.questions.find(t=>t.name===n.next||e.next)}}const e=this.state.question;if(!e){this.state.done=true;return"{RESULTS}"}return e.text}predictCase(t,e,s){return e.find(t=>t.positive.find(t=>{return t.trim().toLowerCase()===s.trim().toLowerCase()}))}}const o=new Context;o.questions.push({name:"1",text:"Question 1?"},{name:"2",text:"Question 2?"});o.cases.push({question:"1",name:"a",positive:["Yes","Sure"],next:"2"},{question:"1",name:"b",positive:["No"]},{question:"2",name:"a",positive:["Yes","Sure"]},{question:"2",name:"b",positive:["No"]});o.results.push({cases:[""],text:"Result"});const r={question:undefined,cases:[]};o.state.question=o.questions.find(t=>t.name===r.question);o.state.cases=o.cases.filter(t=>r.cases.includes(`${t.question}.${t.name}`));(async function(){while(!o.state.done){const t=await new Promise(t=>i.question("> ",t));const e=o.process(t);console.log(e||"Unknown...")}})().finally(()=>process.exit())}});