import { convertRows } from './converter.js';
const $=id=>document.getElementById(id);
let workbook,records=[],revision=0;
function reset(){records=[];$('output').value='';$('count').textContent='尚無紀事';$('download').disabled=true;$('errors').replaceChildren();}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('file').onchange=async()=>{
 const token=++revision;reset();workbook=undefined;$('sheet').replaceChildren();$('sheet').disabled=true;$('convert').disabled=true;
 const file=$('file').files[0];if(!file){$('status').textContent='等待選擇檔案。';return;}
 if(!/\.(csv|xlsx|ods)$/i.test(file.name)||file.size>5*1024*1024){$('status').textContent='請選擇不超過 5 MB 的 CSV、XLSX 或 ODS 檔案。';return;}
 $('status').textContent='正在讀取檔案…';
 try{
  const csv=/\.csv$/i.test(file.name);const input=csv?await file.text():await file.arrayBuffer();if(token!==revision)return;
  if(csv&&input.includes('\uFFFD'))throw Error('CSV 請另存成 UTF-8 編碼後再試。');
  workbook=XLSX.read(input,{type:csv?'string':'array',raw:true,cellDates:false,sheetRows:10002});
  if(!workbook.SheetNames.length)throw Error('檔案內沒有工作表。');
  for(const name of workbook.SheetNames)$('sheet').add(new Option(name,name));
  $('sheet').disabled=false;$('convert').disabled=false;$('status').textContent=`已讀取 ${file.name}，請選擇工作表後轉換。`;
 }catch(e){$('status').textContent=`無法讀取：${e.message||'請確認檔案格式。'}`;}
};
for(const id of ['sheet','category'])$(id).onchange=()=>{reset();$('status').textContent='選項已變更，請重新轉換。';};
$('convert').onclick=()=>{
 reset();try{
 const sheet=workbook.Sheets[$('sheet').value];const range=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']||'A1');
 if(range.e.r>=10001||range.e.c>63)throw Error('表格最多 10,000 筆紀事、64 欄。');
 const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,defval:'',blankrows:true});
 const result=convertRows(rows,$('category').value,v=>XLSX.SSF.parse_date_code(v,{date1904:!!workbook.Workbook?.WBProps?.date1904}));
 if(result.errors.length){$('status').textContent=`發現 ${result.errors.length} 個問題，請修正後重新選取檔案。`;for(const message of result.errors.slice(0,50)){const li=document.createElement('li');li.textContent=message;$('errors').append(li);}return;}
 records=result.records;$('output').value=JSON.stringify(records.slice(0,20),null,2);$('count').textContent=`${records.length} 則紀事`;$('download').disabled=false;$('status').textContent='轉換完成，資料未上傳。';
 }catch(e){$('status').textContent=`無法轉換：${e.message}`;}
};
$('download').onclick=()=>download('history-personal.json',JSON.stringify(records,null,2)+'\n','application/json;charset=utf-8');
