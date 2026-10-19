import fs from 'node:fs';
import babel from './node_modules/playwright/lib/transform/babelBundle.js';
const strings=JSON.parse(fs.readFileSync('locale-strings.json','utf8'));
const catalogs={en:{},ja:{}};
for(const line of fs.readFileSync('.translations.tsv','utf8').replace(/^\uFEFF/,'').trimEnd().split(/\r?\n/)){const [id,en,ja]=line.split('\t'); if(!en||!ja)throw Error(line); catalogs.en[strings[+id]]=en;catalogs.ja[strings[+id]]=ja;}
fs.mkdirSync('src/i18n',{recursive:true});
for(const [lang,data]of Object.entries(catalogs))fs.writeFileSync(`src/i18n/${lang}.json`,JSON.stringify(data,null,2)+'\n');
const files = fs.readdirSync('src/newtab').filter(x=>x.endsWith('.ts')).map(x=>'src/newtab/'+x).concat(['src/search/imageSearch.ts','src/shortcuts/importIcon.ts','src/calendar/personalHistoryFile.ts','src/calendar/spreadsheet.ts']);
for(const file of files){let source=fs.readFileSync(file,'utf8');const ast=babel.babelParse(source,file);const targets=[];
babel.traverse(ast,{StringLiteral(p){if(catalogs.en[p.node.value])targets.push({node:p.node,key:p.node.value});},TemplateLiteral(p){const key=p.node.quasis.map((q,i)=>(i?`{${i-1}}`:'')+q.value.cooked).join('');if(catalogs.en[key])targets.push({node:p.node,key});}});
function range(start,end){const within=targets.filter(t=>t.node.start>=start&&t.node.end<=end).sort((a,b)=>a.node.start-b.node.start||b.node.end-a.node.end);let result='',pos=start;for(const {node,key}of within){if(node.start<pos)continue;result+=source.slice(pos,node.start);result+=`t(${JSON.stringify(key)}${node.type==='TemplateLiteral'?', ['+node.expressions.map(e=>range(e.start,e.end)).join(', ')+']':''})`;pos=node.end;}return result+source.slice(pos,end);}
if(targets.length)fs.writeFileSync(file,"import { t } from '../i18n';\n"+range(0,source.length));}
// Static text is marked explicitly; dynamic content never passes through a DOM observer.
let html=fs.readFileSync('newtab.html','utf8');
html=html.replace(/>([^<>]+)</g,(full,text)=>{const key=text.trim();if(!catalogs.en[key])return full;return `>${text.replace(key,`<span data-i18n="${key}">${key}</span>`)}<`;});
// Text wrappers are invalid inside title and option. Keep these text-only nodes.
html=html.replace(/<(title|option)([^>]*)><span data-i18n="([^"]+)">([^<]+)<\/span><\/(?:title|option)>/g,'<$1$2 data-i18n="$3">$4</$1>');
// Attribute translations are looked up from the original value during initialization.
html=html.replace('src="/src/newtab/newtab.ts"','src="/src/newtab/bootstrap.ts"');
fs.writeFileSync('newtab.html',html);
