const characters = "內戶冊別刪決沒見並來兩狀則為紀紅訂計頁個剛庫徑時氣納紙訊託記針陣動務區問國執將專帳帶張從啟敗現產畢異習處術訪設這連閉備單報尋復換減無畫發筆結絡給著註貼進郵鄉開間雲項須傳僅匯嗎圓會業歲當節經義腦號裝詢試該詳資較載農過電預頓圖實對態慣種稱維網臺與認語誤說遠際麼齊寫導廣慶數標樣確碼範線緯請論輪適閱餘憶擇曆機歷獨縣輸辦選錄錯隨靜頭優儲幫應擊檔檢縮聯聲鍵隱點擴擷瀏蹤轉鎮離題額證識邊關類觸議鐘響屬欄續覽護權歡讀變顯驗體讓灣觀";
const simplified = "内户册别删决没见并来两状则为纪红订计页个刚库径时气纳纸讯托记针阵动务区问国执将专帐带张从启败现产毕异习处术访设这连闭备单报寻复换减无画发笔结络给着注贴进邮乡开间云项须传仅汇吗圆会业岁当节经义脑号装询试该详资较载农过电预顿图实对态惯种称维网台与认语误说远际麽齐写导广庆数标样确码范线纬请论轮适阅余忆择历机历独县输办选录错随静头优储帮应击档检缩联声键隐点扩撷浏踪转镇离题额证识边关类触议钟响属栏续览护权欢读变显验体让湾观";
const lookup = new Map([...characters].map((character, index) => [character, simplified[index]]));

const terminology = {
  'Chrome 線上應用程式商店': 'Chrome 网上应用店',
  'Chrome 商店': 'Chrome 应用店',
  '隱私權政策': '隐私政策',
  '隱私權': '隐私',
  '新分頁': '新标签页',
  '分頁': '标签页',
  '擴充功能': '扩展程序',
  '插件': '扩展程序',
  '使用者': '用户',
  '瀏覽器設定檔': '浏览器用户配置',
  '瀏覽器': '浏览器',
  '設定': '设置',
  '紀事': '记录',
  '規格': '规格',
  '本機儲存': '本地存储',
  '本機': '本地',
  '儲存': '存储',
  '裝置': '设备',
  '雲端硬碟': '云端硬盘',
  '雲端同步': '云同步',
  '電子郵件': '电子邮件',
  '身分證字號': '身份证号码',
  '網址': '网址',
  '超連結': '超链接',
  '外部連結': '外部链接',
  '連線': '连接',
  '網路': '网络',
  '預設': '默认',
  '程式': '程序',
  '轉檔': '格式转换',
  '檔案': '文件',
  '匯入': '导入',
  '匯出': '导出',
  '取代': '替换',
  '範本': '模板',
  '表頭': '表头',
  '儲存格': '单元格',
  '工作表': '工作表',
  '前五筆': '前五条',
  '筆': '条',
  '重新整理': '刷新',
  '另存': '另存为',
  '截圖': '截图',
  '配色': '配色',
  '亮色': '浅色',
  '暗色': '深色',
  '滑鼠': '鼠标',
  '點擊': '点击',
  '點選': '点击',
  '關鍵字': '关键词',
  '伺服器': '服务器',
  '記憶體': '内存',
  '國曆': '公历',
  '公投': '公投',
  '臺灣': '台湾',
  '臺北市': '台北市',
  '模式估算值': '模型估算值',
  '快取': '缓存',
  '追蹤': '跟踪',
  '使用者輪廓分析': '用户画像分析',
  '智慧型': '智能',
};
const phrases = new RegExp(Object.keys(terminology).sort((a, b) => b.length - a.length).join('|'), 'gu');

export function simplify(text) {
  return text.replace(phrases, phrase => terminology[phrase])
    .replace(/[\u3400-\u9fff]/gu, character => lookup.get(character) ?? character)
    .replaceAll('麽', '么');
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
