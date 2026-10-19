import fs from 'node:fs';
import babel from './node_modules/playwright/lib/transform/babelBundle.js';
const files = fs.readdirSync('src/newtab').filter(x=>x.endsWith('.ts')).map(x=>'src/newtab/'+x).concat(['src/search/imageSearch.ts','src/shortcuts/importIcon.ts','src/calendar/personalHistoryFile.ts','src/calendar/spreadsheet.ts']);
const strings=new Set();
for(const file of files){const ast=babel.babelParse(fs.readFileSync(file,'utf8'),file);babel.traverse(ast,{StringLiteral(p){if(/[\u3400-\u9fff]/u.test(p.node.value))strings.add(p.node.value);},TemplateLiteral(p){const text=p.node.quasis.map((q,i)=>(i?`{${i-1}}`:'')+q.value.cooked).join('');if(/[\u3400-\u9fff]/u.test(text))strings.add(text);}});}
const html=fs.readFileSync('newtab.html','utf8');for(const m of html.matchAll(/>([^<>]+)</g)){const s=m[1].trim();if(/[\u3400-\u9fff]/u.test(s))strings.add(s);}for(const m of html.matchAll(/(?:aria-label|placeholder|title|alt)="([^"]+)"/g)){if(/[\u3400-\u9fff]/u.test(m[1]))strings.add(m[1]);}
fs.writeFileSync('locale-strings.json',JSON.stringify([...strings],null,2));
console.log([...strings].map((s,i)=>`${i}: ${s}`).join('\n'));

