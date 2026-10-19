import fs from 'node:fs';
for(const f of ['src/i18n/en.json','src/i18n/ja.json']){const data=JSON.parse(fs.readFileSync(f,'utf8'));const ja=f.includes('/ja.');Object.assign(data,ja?{
'語言':'言語','自動（依瀏覽器）':'自動（ブラウザに合わせる）','切換語言會重新載入分頁。歷史紀事、語錄與私人內容保留原文。':'言語を変更するとタブを再読み込みします。歴史の出来事・ことば・個人の内容は原文のままです。',
'私人（個人／家族）':'個人・家族','台灣':'台湾','國際':'世界','科技':'テクノロジー','影音娛樂':'エンタメ',
'台灣常用':'台湾のサイト','新聞與閱讀':'ニュース・読み物','AI 工具':'AI ツール','工作與生產力':'仕事・生産性','社群與通訊':'SNS・通信','影音與娛樂':'動画・音楽','購物與生活':'買い物・暮らし','交通與旅遊':'交通・旅行'
}:{
'語言':'Language','自動（依瀏覽器）':'Automatic (browser language)','切換語言會重新載入分頁。歷史紀事、語錄與私人內容保留原文。':'Changing language reloads this tab. Historical events, quotes and personal content remain in their original language.',
'私人（個人／家族）':'Personal / family','台灣':'Taiwan','國際':'World','科技':'Technology','影音娛樂':'Entertainment',
'台灣常用':'Taiwan essentials','新聞與閱讀':'News & reading','AI 工具':'AI tools','工作與生產力':'Work & productivity','社群與通訊':'Social & messaging','影音與娛樂':'Video & music','購物與生活':'Shopping & lifestyle','交通與旅遊':'Transport & travel'
});fs.writeFileSync(f,JSON.stringify(data,null,2)+'\n');}
console.log(JSON.parse(fs.readFileSync('data/websites.json','utf8')).categories.map(c=>({name:c.name,sites:c.sites.map(s=>s.name)})));
console.log(JSON.parse(fs.readFileSync('data/festivals.json','utf8')).data.flatMap(f=>[f.name,...(f.observances??[])]));
console.log([...new Set(Object.values(JSON.parse(fs.readFileSync('data/holidays.json','utf8')).data))]);
