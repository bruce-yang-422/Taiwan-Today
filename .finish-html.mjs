import fs from 'node:fs';
let html=fs.readFileSync('newtab.html','utf8').replace(/<span data-i18n="[^"]+">([^<]*)<\/span>/g,'$1').replace(/ data-i18n="[^"]+"/g,'');
html=html.replace('<label for="calendar-style">','<label for="language">語言</label><select id="language" aria-describedby="language-note"><option value="auto">自動（依瀏覽器）</option><option value="zh-TW">繁體中文</option><option value="en">English</option><option value="ja">日本語</option></select><p id="language-note" class="settings-note">切換語言會重新載入分頁。歷史紀事、語錄與私人內容保留原文。</p><label for="calendar-style">');
fs.writeFileSync('newtab.html',html);
