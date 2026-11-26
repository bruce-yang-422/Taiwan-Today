const characters = "內戶冊別刪決沒見並來兩狀則為紀紅訂計頁個剛庫徑時氣納紙訊託記針陣動務區問國執將專帳帶張從啟敗現產畢異習處術訪設這連閉備單報尋復換減無畫發筆結絡給著註貼進郵鄉開間雲項須傳僅匯嗎圓會業歲當節經義腦號裝詢試該詳資較載農過電預頓圖實對態慣種稱維網臺與認語誤說遠際麼齊寫導廣慶數標樣確碼範線緯請論輪適閱餘憶擇曆機歷獨縣輸辦選錄錯隨靜頭優儲幫應擊檔檢縮聯聲鍵隱點擴擷瀏蹤轉鎮離題額證識邊關類觸議鐘響屬欄續覽護權歡讀變顯驗體讓灣觀";
const simplified = "内户册别删决没见并来两状则为纪红订计页个刚库径时气纳纸讯托记针阵动务区问国执将专帐带张从启败现产毕异习处术访设这连闭备单报寻复换减无画发笔结络给着注贴进邮乡开间云项须传仅汇吗圆会业岁当节经义脑号装询试该详资较载农过电预顿图实对态惯种称维网台与认语误说远际麽齐写导广庆数标样确码范线纬请论轮适阅余忆择历机历独县输办选录错随静头优储帮应击档检缩联声键隐点扩撷浏踪转镇离题额证识边关类触议钟响属栏续览护权欢读变显验体让湾观";
const lookup = new Map([...characters].map((character, index) => [character, simplified[index]]));

export function simplify(text) {
  return text.replace(/[\u3400-\u9fff]/gu, character => lookup.get(character) ?? character);
}

export function simplifyTree(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) walker.currentNode.data = simplify(walker.currentNode.data);
  for (const element of root.querySelectorAll('[alt], [aria-label], [data-style-name]')) {
    for (const attribute of ['alt', 'aria-label', 'data-style-name']) {
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, simplify(element.getAttribute(attribute)));
    }
  }
}
