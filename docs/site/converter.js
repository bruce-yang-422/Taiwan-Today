const aliases = { '日期':'date','年份':'year','標題':'title','摘要':'summary','分類':'region','關鍵字':'keyword','來源':'source','來源網址':'sourceUrl' };
const fields=['date','year','title','summary','region','keyword','source','sourceUrl'];
export function convertRows(rows, category='個人', dateParser=()=>null) {
 const errors=[],records=[],seen=new Set();
 if(rows.length<2)return {records,errors:['表格至少需要表頭與一筆資料。']};
 if(rows.length>10001)return {records,errors:['最多接受 10,000 筆紀事。']};
 const headers=rows[0].map(v=>{const s=String(v??'').replace(/^\uFEFF/,'').trim();return aliases[s]??s;});
 for(const f of ['date','title','summary'])if(!headers.includes(f))errors.push(`缺少必要欄位：${f}`);
 for(const f of fields)if(headers.filter(h=>h===f).length>1)errors.push(`重複表頭：${f}`);
 if(errors.length)return {records,errors};
 rows.slice(1).forEach((row,index)=>{
  if(row.every(v=>v===null||v===undefined||String(v).trim()===''))return;
  const at=`第 ${index+2} 列`;const item={};headers.forEach((h,i)=>{if(fields.includes(h))item[h]=row[i]??'';});
  const text=v=>String(v??'').trim();
  let year=text(item.year);let month,day,fullYear;
  const raw=item.date;
  if(typeof raw==='number') {const d=dateParser(raw);if(d){fullYear=d.y;month=d.m;day=d.d;}}
  else {const s=text(raw);const full=/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);const short=/^(\d{1,2})[-/](\d{1,2})$/.exec(s);if(full){fullYear=+full[1];month=+full[2];day=+full[3];}else if(short){month=+short[1];day=+short[2];}}
  if(fullYear && year && Number(year)!==fullYear){errors.push(`${at}：年份與完整日期不一致。`);return;}
  year=year||String(fullYear??'');
  if(!/^\d{1,4}$/.test(year)||+year<1){errors.push(`${at}：請填寫西元年份或完整日期。`);return;}
  const d=new Date(0);d.setUTCHours(0,0,0,0);d.setUTCFullYear(+year,(month??0)-1,day??0);
  if(!month||!day||d.getUTCFullYear()!==+year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day){errors.push(`${at}：日期不存在，請確認月份、日期及閏年。`);return;}
  const title=text(item.title),summary=text(item.summary),region=text(item.region)||category,sourceUrl=text(item.sourceUrl);
  if(!title||!summary){errors.push(`${at}：標題與摘要不能空白。`);return;}
  if(title.length>200||summary.length>5000){errors.push(`${at}：標題最多 200 字、摘要最多 5,000 字。`);return;}
  if(!['個人','家族','台灣','國際'].includes(region)){errors.push(`${at}：分類須為個人、家族、台灣或國際。`);return;}
  if(sourceUrl){try{const url=new URL(sourceUrl);if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch{errors.push(`${at}：來源網址必須為不含帳密的 HTTPS 網址。`);return;}}
  const date=`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const key=[date,year,title].join('|');if(seen.has(key)){errors.push(`${at}：相同日期、年份與標題重複。`);return;}seen.add(key);
  records.push({date,year:+year,title,summary,keyword:text(item.keyword),source:text(item.source)||'私人紀事',sourceUrl,region});
 });
 if(!records.length&&!errors.length)errors.push('沒有可轉換的紀事。');
 records.sort((a,b)=>a.date.localeCompare(b.date)||a.year-b.year);
 return {records:errors.length?[]:records,errors};
}
