<a href="https://today.stack-base.com/"><img src="public/icons/taiwan-today.png" alt="台灣今日曆 Logo" width="80" height="80" /></a>

# 台灣今日曆

[![Version](https://img.shields.io/github/package-json/v/bruce-yang-422/Taiwan-Today?style=flat-square&label=version)](package.json)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue?style=flat-square)](LICENSE.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](src/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](vite.config.ts)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](tailwind.config.ts)
[![Website](https://img.shields.io/badge/官網-today.stack--base.com-205E86?style=flat-square)](https://today.stack-base.com/)
[![GitHub Stars](https://img.shields.io/github/stars/bruce-yang-422/Taiwan-Today?style=flat-square&logo=github)](https://github.com/bruce-yang-422/Taiwan-Today/stargazers)

官網：[today.stack-base.com](https://today.stack-base.com/) · [隱私權政策](https://today.stack-base.com/privacy.html)

立即安裝：[Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/adgohcafbfdmkkllmphehaeainhbeigp)

版本下載：[v1.1.0 安裝包](release/taiwan-daily-chrome-1.1.0.zip) · [v1.1.0 更新說明](V1.1.0.md) · [v1.0.0 發布頁](https://github.com/bruce-yang-422/Taiwan-Today/releases/tag/v1.0.0)

目前原始碼版本：**1.1.0**，更新內容見 [v1.1.0 更新說明](V1.1.0.md)；本版封裝檔統一為 [`release/taiwan-daily-chrome-1.1.0.zip`](release/taiwan-daily-chrome-1.1.0.zip)，已包含縮小網站存取權限與 Chrome Search API 搜尋修改，可用於商店上傳。

以 Vite、TypeScript、Tailwind CSS 與 Manifest V3 實作的 Chrome 新分頁，提供繁體中文、English、日本語介面，支援國內、短期出差及長期海外的日曆與時鐘設定。無後端、無帳號、無追蹤，日曆與內建內容可離線使用；天氣、使用瀏覽器預設搜尋引擎的文字搜尋、外部連結與公共資料更新需要網路。

使用 `storage`、`favicon`、`search` 與限定於 `api.open-meteo.com` 的天氣連線權限；公共資料更新的 `raw.githubusercontent.com` 為選用權限，由使用者手動執行或啟用每日檢查時授權。不申請所有 HTTP／HTTPS 網站的存取權限；捷徑圖示由 Chrome 內建功能、打包素材或自行上傳提供。

個人／家族紀事範例：[CSV](templates/history-template.csv)、[XLSX](templates/history-template.xlsx)、[ODS](templates/history-template.ods)。選一種填寫，再使用[官網轉檔工具](https://today.stack-base.com/#converter)預覽並下載 JSON，於插件「設定 → 資料管理 → 匯入個人歷史」匯入。欄位格式見 [範例說明](templates/README.md)。

## 安裝

### 從 Chrome 商店安裝（推薦）

1. 前往 [台灣今日曆的 Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/adgohcafbfdmkkllmphehaeainhbeigp)。
2. 點選「加到 Chrome」，依瀏覽器提示確認安裝。
3. 開啟新分頁即可使用。

### 手動下載安裝（不需要 Node.js）

1. 下載 [taiwan-daily-chrome-1.1.0.zip](release/taiwan-daily-chrome-1.1.0.zip)。
2. 將 ZIP 解壓縮到固定的資料夾。
3. 開啟 `chrome://extensions`，啟用「開發人員模式」，按「載入未封裝項目」。
4. 選取解壓縮後直接包含 `manifest.json` 的資料夾，開啟新分頁即可使用。

Edge 可在 `edge://extensions` 使用相同方式載入。安裝後請保留解壓縮的資料夾，瀏覽器會持續從這裡讀取插件。

### 從原始碼建置

需要 Node.js 22.16 以上。若下載的是 GitHub 自動提供的 **Source code**，請使用此方式建置。

```sh
npm ci
npm run build
```

開啟 `chrome://extensions` → 啟用「開發人員模式」→「載入未封裝項目」→ 選取本專案的 **dist** 資料夾。開啟新分頁即可使用。更新程式後重新建置，再於擴充功能頁按重新載入。

## 語言、日曆情境與天氣

### 三語介面

在「設定 → 外觀 → 語言」選擇繁體中文、English、日本語，或依瀏覽器自動選擇。設定保存在本機，切換後重新載入目前分頁。五種樣式的介面與日曆標籤均支援三語；歷史紀事、語錄、私人內容及已儲存捷徑名稱保留原文。語言切換不會自動改變日曆情境、天氣地點或假日規則。

### 國內、短期出差與長期海外

在「設定 → 外觀 → 日曆使用情境」選擇：

| 使用情境 | 日期與日曆內容 | 時鐘 |
| --- | --- | --- |
| 國內使用（預設） | 臺灣日期、民國年、農曆、節氣與臺灣假期。 | 臺灣時間。 |
| 短期出差 | 保留臺灣日期與日曆，適合短期在歐美、日本等地工作或旅行。 | 可選臺灣時間，或依天氣地點回傳的時區顯示。 |
| 長期海外 | 依裝置當地或自選 IANA 時區顯示西曆，隱藏民國年、農曆、節氣與臺灣假期。 | 與日曆使用相同時區。 |

長期海外模式不自動加入其他國家的法定假日。出差時鐘選擇地點時間時，會透過天氣 API 取得時區，尚未取得時顯示等待提示。天氣地點與日曆情境分開保存，人在海外也可以繼續使用臺灣日曆。

### 設定天氣地點

1. 開啟「設定 → 外觀」，點選有定位圖示、底色與箭頭的「設定天氣地點」按鈕；按鈕下方顯示目前地點。
2. 臺灣可選 22 縣市、368 鄉鎮市區，預設為臺北市信義區；國內外也可選「自訂 GPS（國內外）」並輸入緯度、經度。
3. 套用後保存於本機；歲月紙曆卡片只顯示已選地點、更新按鈕、目前天氣與明日預報。

目前天氣包含溫度與天氣狀況；明日預報包含高低溫與降雨機率。資料使用 Open-Meteo，功能使用中且分頁可見時每 10 分鐘更新，同地點共用快取；返回分頁時補查過期資料。更新失敗保留上次資料並標示，沒有快取時顯示錯誤與重試按鈕。天氣的今天／明天依 API 回傳的所在地時區判定。

縣市、行政區名稱與行政區英文名稱依中央氣象署，中心點座標採中華郵政政府開放資料（2016-08-12 版）；來源保存在 [taiwan-locations.json](src/weather/taiwan-locations.json)。日本語介面的行政區保留官方中文原名。行政區中心點無法代表整區的微氣候，山區、沿海或住家可改填 GPS；目前天氣仍為模式估算，可能與實況不同。資料來源與授權見 [Open-Meteo](https://open-meteo.com/) 及 [CC BY 4.0](https://open-meteo.com/en/licence)，座標資料依政府資料開放授權條款第 1 版使用。

插件不請求裝置定位權限。天氣 API 會收到查詢座標與連線 IP，不會收到私人紀事、待辦或捷徑；處理方式見[隱私權政策](privacy.html)。

## 開發與驗證

### 英文與日文日曆資料

`data/en/` 與 `data/ja/` 各提供 `long-holidays.json`、`holidays.json`、`calendar-2026.json`、`calendar-2027.json`、`festivals.json`。內容包含名稱、節日說明、適用範圍、農曆與節氣翻譯；沿用中文原檔的 JSON 欄位、資料版本與原始更新時間，日期、休假規則及連假天數保持一致。這些是獨立資料檔，目前新分頁仍以中文公共資料配合介面翻譯顯示，尚未將這十份檔案接入遠端更新清單。

節日英文名稱參考[人事行政總處](https://www.dgpa.gov.tw/en/information?pid=12580&uid=353)，日文名稱參考[交通部觀光署](https://jp.taiwan.net.tw/m1.aspx?sNo=0003064)；神祇英文名稱優先採[臺北市民政局中英對照](https://reduce-co2.civil.taipei/News_Content.aspx?n=9805C9CBAC56EE33&s=63D784EA791273D9&sms=9A5AC51390A2BB5C)，節氣名稱參考[日本國立天文台](https://eco2.mtk.nao.ac.jp/koyomi/faq/24sekki.html.en)。來源與採用範圍見 [translation-sources.json](data/translation-sources.json)：`official` 表示查得完整官方用語，`derived` 表示採官方專名組成的譯文，其餘為 `project_translation`，不宣稱是官方名稱。節日說明與適用範圍為中文原文的專案翻譯。

```sh
npm run data:localize      # 從中文原檔、介面辭典及說明翻譯產生十份資料
npm run data:check-locales # 檢查翻譯檔是否與來源同步，不寫入檔案
```

節日名稱與節氣名稱維護於 `src/i18n/en.json`、`src/i18n/ja.json`；完整說明與適用範圍維護於 `scripts/calendar-data-translations.json`。新增專名、歷史名稱或地標譯文時，先查主管政府機關公布的名稱並記錄來源；查無官方譯名時明確標示為專案翻譯。

```sh
npm run dev
npm run data:import
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npx playwright test tests/e2e/contrast.spec.ts
# 桌面高度、五種樣式貼圖搜尋及 MV3 圖片上傳
npx playwright test tests/e2e/modern-layout.spec.ts tests/e2e/search-clipboard.spec.ts
# 天氣、日曆時區與縮小權限後的 Chrome 圖示
npx playwright test tests/e2e/weather.spec.ts tests/e2e/automatic-icons.spec.ts
npm run data:check-history
# 官網下載與轉檔測試（需安裝 Python）
npx playwright test --config tests/pages/playwright.config.mjs
```

開發預覽網址為 `/newtab.html`；一般網頁使用 localStorage，擴充功能使用 chrome.storage.local，兩者資料互相獨立。建置由小型 Vite 外掛複製 manifest，無需 CRXJS 或背景 service worker。

### 建置、封裝與暫存檔

`dist/` 是 `npm run build` 產生的可載入擴充功能；封裝時只壓縮 `dist/` 內的檔案，確保 `manifest.json` 位於 ZIP 根目錄，版本封裝統一保存為 `release/taiwan-daily-chrome-1.1.0.zip`。上傳商店前，核對 ZIP 中的版本與權限是否和根目錄 manifest 一致。

測試截圖與執行結果輸出到 `test-results/`，報告可能產生於 `playwright-report/`；兩者均可刪除，後續執行測試時會重新產生。`.scratch/`、`.research/` 與 `*.log` 為忽略的本機暫存。一次性翻譯腳本與中間檔已移除，正式翻譯維護使用下述語言包及 `scripts/localize-calendar-data.mjs`。

## 已實作

- 歲月紙曆月份置中於左上可用區域，右側顯示小月曆；星期與農曆緊接日期數字，下方顯示目前天氣與明日預報，裝訂頭採飽和深紅色。
- 提供繁體中文、English、日本語介面，以及國內、短期出差、長期海外情境；天氣支援臺灣鄉鎮市區與自訂 GPS。操作方式見[語言、日曆情境與天氣](#語言日曆情境與天氣)，翻譯資料維護見[英文與日文日曆資料](#英文與日文日曆資料)。

- 右上角提供 Gmail、雲端硬碟與 Google 日曆的小圖示捷徑，可直接另開分頁；滑鼠停留顯示名稱。自訂 Google 應用程式九宮格收錄 41 個服務，以常用通訊、影音、搜尋及文件工具優先，商務工具靠後（編輯預設順序，非官方熱門排名）；支援選單內捲動、鍵盤操作、Esc 與點外側關閉。圖示隨插件打包，不讀取 Google 帳戶或同步官方最愛，無需額外權限；來源見 [Google 圖示紀錄](public/icons/google/SOURCES.md)。

- 設定視窗以圓角頁籤分成「外觀、內容、資料管理、關於」，支援左右方向鍵與 Home／End 切換；適用筆電與手機，完成按鈕固定在視窗底部。

- 「設定 → 內容 → 紀事來源與順序」可開關來源並以上下箭頭排序，預設私人 → 台灣 → 國際；前三則及展開列表皆依已開啟來源的順序顯示。設定會保存並跨分頁同步，關閉不會刪除資料。

- 「設定 → 內容 → 顯示內容」提供歷史、每日一句、今日待辦與指針時鐘秒針開關，五種樣式共用設定並跨分頁同步，預設皆開啟；隱藏不會刪除資料，數字時鐘仍顯示時分秒。

- 「設定 → 外觀 → 文字大小」提供標準／大字，立即套用並保存在本機；調整歷史內文、來源、操作提示與表單字級。五種樣式已驗證 1366×768 及模擬 125%／150% 縮放的可用視窗，內容可向下捲動。

- 文字配色以 WCAG AA 對比為目標（一般文字 4.5:1、大字 3:1），低彩度不以透明度淡化文字。對比回歸測試涵蓋五種亮／暗樣式的新分頁、待辦、四個設定頁籤、捷徑視窗及 Google 選單；新分頁另取樣實際背景，檢查紙紋、山線、時鐘與提示字。這是文字對比檢查，不代表整站已完成所有 WCAG 項目的認證。

- 月曆預設以星期日為每週第一天，可在「設定 → 外觀 → 月曆每週起始日」改為星期一，設定自動保存。
- 五種日曆樣式：留白日常、日常方格、歲月紙曆、月序手帖、時光讀本，皆可搭配亮色／暗色。
- 五種樣式提供筆電緊湊排版，縮減卡片、日期、捷徑及區塊間距；以 1366×768、標準字級、2026/09/21 三則歷史與負能量語錄驗證可完整顯示。大字、更多紀事或較長內容仍可自然捲動，不裁切文字。
- 日常方格與歲月紙曆另針對較高的桌面視窗縮減卡片高度與留白；以 1920×1080、2560×1214、1366×768，標準字級、七個捷徑及三則紀事驗證主要內容可在一頁內顯示。日常方格的捷徑卡片依可用寬度縮放，七個網站加「新增捷徑」「常用網站」可維持同一列。
- 五種樣式以低彩度配色為主，歲月紙曆裝訂頭採飽和深紅色，保留文字對比與各自的視覺特色：留白日常依亮／暗模式使用晨光／月夜山景背景（`public/art/classic-light.png`、`public/art/classic-dark.png`）；日常方格使用霧藍色與圓角卡片；歲月紙曆使用依日期狀態區分顏色的大日期、深紅色裝訂頭與層疊紙邊；月序手帖使用米白／低彩度深灰綠底色，搭配橄欖綠側欄與灰綠重點色；時光讀本使用深海藍封面與山海線條。皆提供亮／暗色，背景圖片與裝飾 SVG 隨插件打包，無須網路。
- 留白日常採置中日期與時鐘、圓形捷徑、襯線字體及無卡片外框的歷史紀事。
- 留白日常的山景背景保留原始 21:9 比例，依視窗等比例滿版縮放；16:9 與較窄的螢幕適度裁切兩側，暗色背景靠右保留月亮。每日一句、歷史紀事與頁尾使用 75% 不透明的底色維持文字可讀性，底色寬度與內容對齊。
- 月序手帖：左側網站捷徑、中央國曆與農曆月曆、右側日期、大指針時鐘及待辦；可切換月份、選取日期查看農曆與歷史，或按「今天」返回。右欄標示「選取日期」與完整年月日；時鐘依日曆情境顯示臺灣或所選時區時間，「今日待辦」及「今日語錄」仍以今天為準，並顯示今天日期與說明，待辦共用同一份清單且跨日保留。
- 時光讀本：深藍日期側欄、每日一句、歷史時間軸，底部提供搜尋與捷徑。每日一句可在設定選擇「每日提醒、佛家智慧、負能量（幽默）、四書五經、名人語錄、文學短句、聖經、影視佳句」，於五種樣式皆可顯示；分類自動保存，依所選日曆時區的日期在所選分類內輪替。
- 日常方格樣式採本機 SVG 背景：霧藍細格、半透明圓角幾何與柔光；亮色呈現晨光，暗色搭配冷藍光與少量暖光。背景檔案為 `public/art/modern-light.svg` 與 `public/art/modern-dark.svg`。寬螢幕並排日期、時鐘、待辦，下方提供膠囊搜尋列、捷徑卡片與歷史卡片。
- 便利貼固定於各樣式的預設位置，不可拖曳；點標題可收合／展開，舊版儲存的拖曳位置不再套用。
- 右側工作便利貼：新增待辦、勾選完成、刪除與完成數量；自動儲存在本機，跨日保留，不自動清空。桌面展開、小螢幕收合，可點標題切換；移除擴充功能會清除本機資料。
- 依日曆情境設定時區的指針時鐘，含時針、分針與秒針；每秒更新，背景分頁暫停更新，返回時校正。桌面以 1920×1080 設計，時鐘置於中央日曆右側；窄螢幕改為上下排列。
- 國內與出差模式提供臺灣時區國曆、星期、農曆、二十四節氣、節氣進度與倒數；長期海外依所選時區顯示西曆。跨午夜及返回分頁更新。
- 台灣民俗節日、2026～2027 年政府行政機關節日／補假，以及連假日次。
- 使用瀏覽器預設搜尋引擎的文字搜尋與歷史事件「深入了解」。
- 五種樣式共用文字搜尋列，透過 Chrome Search API 使用瀏覽器預設搜尋引擎；操作見[文字搜尋](#文字搜尋)。
- 捷徑新增、編輯、刪除、拖曳排序；編輯按鈕支援 Alt + 左右方向鍵排序。
- 首次使用的預設捷徑依序為 Yahoo 奇摩、YouTube、ChatGPT、Gemini、Google 搜尋首頁；保留使用者已儲存的捷徑。舊版升級時會補上 ChatGPT，手動刪除後不會再次加入。
- 外觀使用圖示搭配滑動分段控制（系統／亮色／暗色），支援鍵盤方向鍵與減少動態效果偏好；另可選五種日曆樣式，設定持久保存。
- 歲月紙曆樣式以 CSS 繪製撕頁日曆造型：深紅色裝訂頭、銅釘、紙紋、層疊紙邊與柔和陰影，搭配依日期狀態區分顏色的大日期、深藍文字及明體字；寬螢幕以日期／大時鐘／待辦並排。亮／暗模式分別搭配晨光／暖燈花卉背景（`public/art/traditional-light.png`、`public/art/traditional-dark.png`），保留原始 21:9 比例，16:9 等比例裁切兩側。每日一句、歷史區塊與標誌使用 90% 不透明的襯底，保持花卉背景上的文字清楚。
- 響應式畫面、鍵盤操作、儲存錯誤提示、同裝置分頁設定更新。

## 下一階段規劃

尚待完成：補齊全年歷史內容、完整備份（個人紀事／捷徑／待辦／設定）、長語錄展開／收合、插件內的樣式縮圖，以及個人紀事單筆新增／編輯表單。設定四頁籤與標準／大字已完成；官網提供五種樣式的亮／暗色實際截圖。原始規劃見 [產品路線圖](taiwan_daily_chrome_newtab_plan.md#4-下一階段優先項目)，目前完成狀態以本文件為準。

## 資料與範圍

### 個人紀事匯入

插件可直接匯入 UTF-8 CSV、XLSX、ODS 或 JSON，在本機自動讀取、驗證與預覽，確認後才取代個人紀事；也可先使用官網轉檔工具，確認紀事後下載 JSON 再匯入。CSV 使用與官網範本相同的中英文表頭。XLSX／ODS 可選擇工作表，只匯入選取的工作表；支援 Excel 日期儲存格，解析器隨插件打包，可離線使用。

私人紀事的 `region` 是可自訂分類（最多 40 字），例如童年、中年、公司名稱或小孩名字；留白預設為「個人」。所有匯入紀事皆歸「私人」來源，不因分類文字而改成台灣或國際公共歷史。

### 資料版本與更新時間

日曆、歷史、節日與語錄等資料 JSON 都在開頭宣告自己的 `version`，原本的陣列或物件放在 `data`，例如：

```json
{
  "version": "1.2.0",
  "updatedAt": "2026-09-21T17:20:00.000+08:00",
  "data": []
}
```

**直接修改各 JSON 的 `version`，建置不會自動升版。** 不同檔案可以使用不同版本，例如 `quotes.json` 為 `1.2.0`、`history-taiwan.json` 為 `2.0.0`。版號格式為三段數字 `x.y.z`，不加 `v`。`data` 必須保留該檔案原本的內容格式。

不再使用 `data/versions.json`，各檔案自行宣告版本。`update-manifest.json` 是必要的遠端下載清單，由 `npm run data:prepare-update` 或 `npm run build` 產生；請將資料與這份清單一起提交推送。只改版號或只改內容，都會產生新的更新識別碼。首次上架以 `1.0.0` 為基準，之後自行調整有更新的 JSON 版號，工具不會自動升版。

`history-personal.json` 的版號只代表內建範本，不涉及使用者本機資料；匯入仍相容舊版純陣列（包含用來清空的 `[]`）與新版 `{ "version": "1.0.0", "data": [...] }`。個人備份仍輸出相容的純陣列。

此包裝格式需要新版插件讀取；舊插件無法直接載入新格式，更新驗證失敗時會保留原資料。設定中的「關於」提供作者、插件版本、發布時間與各資料檔版本；插件版本取自 `manifest.json`。

公共資料檔的 `updatedAt` 使用台灣時間 `+08:00`，由 `npm run data:prepare-update` 或建置時自動維護。檔案變更時更新時間，未變更則保留。`update-manifest.json` 的頂層與逐檔項目同時提供 UTC `updatedAt`（結尾 `Z`）與台灣時間 `updatedAtTaiwan`（結尾 `+08:00`），兩欄表示同一時刻，皆為 ISO 8601 格式。`history-personal.json` 不列入遠端清單，其範本版號與時間可自行修改，使用者匯入的紀事與範本版本無關。

### GitHub 公共資料更新

首次點「立即更新」或啟用每日檢查時，Chrome 會要求 GitHub 連線授權；允許後才下載，拒絕則保留原資料。若舊版顯示 `connect-src 'none'`，請在 `chrome://extensions` 重新載入指向最新 `dist` 的擴充功能，關閉舊新分頁後重新開啟；單純重新整理頁面不會更新 manifest 政策。

「設定 → 資料管理 → 公共資料更新」可按「立即更新」，或開啟預設關閉的每日自動檢查。有新分頁開啟或返回前景時檢查，持續開啟時每小時確認是否已滿 24 小時；關閉所有新分頁後不會在背景下載。

更新來源固定為本儲存庫 `main/data/`，包含台灣／國際歷史、科技／影音娛樂主題、語錄、民俗節日、政府假日、連假及年度日曆。整批通過大小、SHA-256 與格式驗證後才保存並立即套用；離線或更新失敗保留原資料。私人紀事、捷徑、待辦與設定不會上傳或覆蓋。下載會連線 GitHub，但不附帶上述使用者資料。

維護者修改 JSON 後執行：

```sh
npm run data:prepare-update
```

將修改的公共 JSON 與產生的 `data/update-manifest.json` **一起提交並推送至 main**，使用者即可取得更新，不需為每次內容修改重新上架。每檔上限 2 MB、整批上限 5 MB；產生清單後若再修改資料，須重新執行指令。私人 JSON 不會列入更新清單。

首次啟用此能力仍需發布一次新版擴充功能（包含更新程式與 GitHub 連線權限），並將更新清單推送至遠端。日後程式功能、資料格式、新語錄分類或新歷史主題的變更仍需發布新版；此機制只下載 JSON，不下載或執行遠端程式。

### 每日一句

每日一句存放在 [`data/quotes.json`](data/quotes.json)，每筆包含唯一的 `id`、分類 `category`、句子 `text`、出處或署名 `source`，引用語錄另附 `sourceUrl` 供核對。分類值：`daily`（每日提醒）、`sheng-yen`（佛家智慧）、`negative`（負能量／幽默）、`classics`（四書五經，共 366 則）、`famous`（名人語錄）、`literature`（文學短句）、`bible`（聖經，共 366 則）、`screen`（影視佳句，共 366 則）。可直接新增或修改 JSON，依上方公共資料更新流程發布；或重新執行 `npm run build` 將內容隨插件打包。依所選日曆時區的日期在所選分類內按陣列順序循環選取，同一天顯示同一句；資料隨程式打包，可離線使用。每日提醒共 366 則原創短句，包含專注與時間、學習與成長、溝通與關係、情緒整理、休息與身體照顧、生活整理、決策與處事七個方向；專注與時間、決策與處事各 53 則，其餘各 52 則，主題交錯安排。在資料內容與順序不變的情況下，連續 366 天不重複，第 367 天開始下一輪，跨年不重設。

名人語錄收錄 366 則，涵蓋 21 位中外作者，包含老子、魯迅、張愛玲、三毛、林語堂、愛默生、梭羅、培根、海倫・凱勒、富蘭克林、羅素等人的著作、書信、演說與文學節錄。排除中國詩詞及四書五經內容，與 `classics` 分類區隔；《道德經》選句保留於名人語錄。作者交錯安排，資料內容與順序不變時，連續 366 天不重複，第 367 天開始下一輪，跨年不重設。

中文原作保留原文與作品名稱；外文由本專案翻譯，畫面署名標示「台灣今日曆譯」，古希臘作品依所引英譯本轉譯。小說與戲劇台詞另標示作品、角色或敘述者，避免混同作者本人的主張；JSON 的 `originalText`、`sourceWork`、`sourceUrl` 保留原文、作品／篇章與核對網址，節錄另於出處欄標示，顯示文字可調整句末標點。來源包括 Project Gutenberg、維基文庫、皇冠出版社及林語堂故居刊物；林語堂條目依故居刊物引用，未推定原始著作篇名。新分類需要重新建置並載入新版插件；舊版無法只靠公共資料更新取得分類支援。

### 日曆與節日

臺灣放假資料涵蓋 2026～2027 年政府行政機關，僅於國內與短期出差模式套用；未收錄年度以本地曆法運算，不臆測放假或補班。長期海外模式使用西曆，不套用臺灣假期或其他國家的法定假日。
`calendar-2026.json` 保留原年度資料，新增的 `calendar-2027.json` 供 2027 年日期使用。
`festivals.json` 是跨年度的國曆／農曆節日規則，不必逐年改日期；春節、端午、中秋依農曆自動換算，清明、除夕與母親節由程式計算。
另收錄迎神、迎財神、天公生、頭牙、尾牙、送神及常見神明誕辰；`description` 保存民俗活動與信仰說明，`observances` 列出同日一併顯示的其他紀念名稱。這些內容依使用者提供的民俗資料整理，農曆規則不在閏月重複匹配，亦不作為政府放假依據。

```sh
# 使用已收錄的官方放假資料，重新產生該年農曆及節氣
node scripts/import-calendar.mjs --year 2027
# 以人事行政總處 CSV 核對／更新逐日放假旗標
node scripts/import-calendar.mjs --year 2027 --csv path/to/116-calendar.csv
```

`npm run data:import` 預設重建 2027 年。腳本會檢查全年日期、星期、放假欄位、24 節氣及已收錄的連假日次；沒有官方放假資料時會停止。
新增其他年度時，另須整理 `holidays.json` 的節日／補假名稱、`long-holidays.json` 的官方連假區間；更新清單會自動納入 `calendar-YYYY.json`（1900～2100 年），已升級的插件可直接下載使用。若要讓新年度隨安裝包附帶，另於 `src/data/publicData.ts` 加入該年匯入。

曆法使用本機打包的 [lunar-typescript](https://github.com/6tail/lunar-typescript)（MIT），未引用其中國大陸假日或宜忌資料。

### 歷史內容

`data/history-taiwan.json` 與 `data/history-world.json` 合計收錄 193 筆「歷史上的今天」紀事，其中台灣 129 筆（67%）、國際 64 筆（33%）。9～12 月每天皆有 1～3 則；1～8 月目前為精選重大事件，僅涵蓋部分日期，尚未每天有內容，缺少資料的日期會顯示空狀態。內容以重大政治、社會、科學、文化及體育事件為主。另有預設關閉的主題紀事：`data/history-tech.json`（科技，51 筆）與 `data/history-entertainment.json`（影音娛樂，28 筆），同樣僅涵蓋部分日期，會逐步擴充。執行
`npm run data:check-history` 可檢查資料完整性。

### 文字搜尋

五種樣式共用搜尋列。輸入文字後按 Enter 或搜尋按鈕，會透過 `chrome.search.query()` 在目前分頁使用 Chrome 設定的預設搜尋引擎；貼上純文字維持原本的輸入方式。「歷史上的今天」的「深入了解」也使用相同 API，不固定導向 Google、不變更預設搜尋引擎設定。

搜尋需要 `search` 權限，僅在已安裝的 Chrome 擴充功能中可用。網站預覽不提供搜尋 API；API 無法使用或執行失敗時會顯示提示，不會改用固定搜尋網址。插件不保存搜尋紀錄，搜尋服務商依其政策處理查詢內容。不提供剪貼簿圖片搜尋或圖片上傳。

### 常用網站與捷徑圖示

捷徑區的「常用網站」可依分類勾選並批次新增，也可搜尋名稱或網址。切換分類與搜尋時保留勾選，已加入的網站會標示「已新增」並避免重複加入；取消勾選會標示「將移除」，按「儲存變更」後才移除對應捷徑。取消或關閉選單不套用變更，「還原變更」可重設本次勾選。其他自訂捷徑不受影響，保留的捷徑維持原名稱、圖示與排序。

網站清單維護於 `data/websites.json`，目前收錄 8 類、52 個網站：搜尋與入口、社群與通訊、影音與音樂、購物與生活、新聞與資訊、AI 工具、工作與學習、交通與旅遊。清單為人工選輯，非熱門排名。`schemaVersion` 為 1；每個分類包含 `id`、`name`、`sites`，每個網站包含唯一 `id`、`name`、HTTPS `url` 與指向打包圖示的相對路徑 `icon`。選用的 `matchPaths` 可指定同一網站的入口路徑，`*` 代表一段帳號等路徑。例如 Gemini 的 `/app`、`/u/0/app` 與首頁會視為同一入口，首頁查詢參數不影響清單的已新增判斷；特定會話與其他不同頁面仍分別保留。修改 JSON 後執行 `npm run build` 即可更新隨插件附帶的清單。

52 個網站皆預先備好 Logo，隨插件打包；常用網站選單離線也能顯示，圖示載入失敗時以名稱縮寫替代。加入捷徑後先使用同一份預設圖示，再依下列機制取得與更新網站圖示。來源見[常用網站圖示紀錄](public/icons/websites/SOURCES.md)。

自動圖示僅透過 [Chrome 內建 favicon 功能](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)取得，不直接下載捷徑網站首頁、CDN 或 `/favicon.ico`，因此不需要任意網站存取權限。若 Chrome 回傳預設地球圖示或讀取失敗，保留原有快取、打包圖示或名稱縮寫，也可自行上傳圖示。成功圖示保存在本機，滿 7 天後於開啟新分頁時重新向 Chrome 查詢；失敗隔天再試，不保證 Chrome 已有網站最新圖示。同一網站的同時請求會合併，快取最多保留 100 個網站。

也可自行匯入 PNG / ICO（最大 5 MB，匯入後自動縮小為最長邊 64 px，保留透明背景）；自訂圖示優先使用，不被自動更新覆蓋。無雲端同步，資料保存在本機。

維護者要重新下載常用網站的預設圖示時，執行：

```sh
node scripts/prepare-website-icons.mjs
npm run build
```

圖示準備腳本會連線官方網站或 DuckDuckGo 圖示服務，並更新 `data/websites.json` 的 `icon` 路徑及來源紀錄；一般建置直接使用已打包的檔案，不會自動重新下載 Logo。

## 名稱與語系

擴充功能正式名稱：中文「台灣今日曆」、英文「Taiwan Today」、日文「台湾こよみ」。`manifest.json` 使用
Chrome 擴充功能的 i18n 機制（`__MSG_extName__` / `__MSG_extDescription__` +
`default_locale: zh_TW`），實際文字定義在 `_locales/zh_TW/messages.json` 與
`_locales/en/messages.json`、`_locales/ja/messages.json`；Chrome 會依瀏覽器 UI 語言自動選字，找不到對應語系則退回
zh_TW。新增語系時在 `_locales/` 下建立對應資料夾即可，`vite.config.ts` 會自動一併複製到
`dist/`。

## 檔案

- `src/calendar/`：日曆情境與時區（`context.ts`）、臺灣日期、農曆、節氣、節日組合（`dailyCalendar.ts` 等）；歷史資料集登錄與合併（`history.ts`，`HistoryDataset`
  介面供未來主題擴充）、個人歷史 JSON 驗證（`personalHistory.ts`）、CSV 解析與表格欄位轉換（`personalHistoryFile.ts`、`historyRows.js`）、XLSX／ODS 解析（`spreadsheet.ts`、`spreadsheet.worker.ts`）。
- `src/i18n/`：介面英文／日文辭典（`en.json`、`ja.json`）、語言選擇與格式化（`index.ts`）、日曆標籤及錯誤訊息翻譯。繁體中文以原始字串作為索引與預設文字。
- `src/weather/`：天氣查詢、座標與快取驗證（`weather.ts`），以及臺灣 22 縣市、368 鄉鎮市區的政府名稱與中心點資料（`taiwan-locations.json`）。
- `src/shortcuts/`：捷徑資料驗證與儲存（`chrome.storage.local` / `localStorage`）、Chrome 圖示查詢與快取（`automaticIcon.ts`）。
- `src/search/`：Chrome Search API 文字搜尋、搜尋表單事件與自訂捷徑網址驗證（`search.ts`）。
- `src/data/`：資料版本包裝解析（`document.ts`）、公共資料格式定義與套用（`publicData.ts`）、GitHub 更新下載與快取（`updates.ts`）。
- `src/newtab/`：畫面與互動主體（`newtab.ts`）、設定頁籤與鍵盤導覽（`settingsTabs.ts`）、關於與各資料檔版本（`about.ts`）、指針時鐘（`clock.ts`）、日曆情境設定（`calendarContext.ts`）、天氣顯示與地點設定（`weather.ts`）、工作便利貼（`todos.ts`）、個人歷史匯入／匯出對話框（`personalHistory.ts`）、紀事來源開關與排序（`historySources.ts`）、公共資料更新面板（`dataUpdates.ts`）、Google 應用程式九宮格（`googleApps.ts` 搭配 `googleServices.ts` 服務清單）、月序手帖與時光讀本版面（`concepts.ts`）；樣式依版面拆分為
  `newtab.css`（共用基礎與留白日常）、`modern.css`（日常方格）、`traditional.css`（歲月紙曆）、`concepts.css`（月序手帖／時光讀本）、`identity.css`（五種樣式的配色、背景與材質）、`googleApps.css`（Google 應用程式選單）、`readability.css`（文字大小與閱讀相關樣式）、`settingsTabs.css`（設定頁籤）、`weather.css`（紙曆日期排版、天氣與地點設定按鈕）、`compact.css`（桌面與筆電緊湊排版）。
- `data/`：離線日曆（`calendar-2026.json`、`calendar-2027.json`）、節日與連假規則、歷史紀事（`history-taiwan.json`、`history-world.json`、`history-tech.json`、`history-entertainment.json`、`history-personal.json`）、每日一句與公共資料更新清單（`update-manifest.json`）；`en/`、`ja/` 保存日曆翻譯資料，`translation-sources.json` 記錄翻譯來源。
- `public/icons/`：應用程式圖示 `taiwan-today.png`（擴充功能與左上角標誌）、`taiwan-today.ico`（分頁圖示），以及內建捷徑的 favicon 與來源紀錄；`public/icons/google/` 保存 Google 應用程式選單圖示，`public/icons/websites/` 保存常用網站預設圖示，皆附來源說明。
- `public/art/`：留白日常的亮／暗山景 PNG、日常方格的亮／暗幾何 SVG、歲月紙曆的亮／暗花卉 PNG，以及其他樣式的山海線條裝飾。
- `templates/`：CSV、XLSX、ODS 個人紀事範本與填寫說明，供官網下載。
- `vendor/sheetjs/`：插件與官網共用的本機試算表解析器及第三方授權。
- `_locales/`：擴充功能名稱與說明的繁體中文、英文及日文語系檔。
- `scripts/import-calendar.mjs`：依年份重建日曆資料，並可用官方 CSV 核對放假旗標。
- `scripts/localize-calendar-data.mjs`、`scripts/calendar-data-translations.json`：日曆翻譯檔的產生、來源同步檢查與說明譯文。
- `scripts/validate-history.mjs`：歷史紀事欄位、重複與月份覆蓋檢查。
- `scripts/prepare-history-templates.mjs`：產生三種格式的紀事範本，並核對 XLSX／ODS 內容。
- `scripts/prepare-data-update.mjs`：驗證公共 JSON 並產生 `data/update-manifest.json`，供使用者端下載更新比對。
- `scripts/prepare-website-icons.mjs`：預先下載常用網站 Logo，更新圖示路徑與來源紀錄。
- `tests/`：曆法及安全邊界單元測試、天氣與時區測試、瀏覽器操作及真實 MV3 離線載入／網站權限測試；`tests/pages/` 驗證官網範本下載與三種格式轉檔。
- `index.html`、`docs/site/`：可部署到 GitHub Pages 的專案介紹網站，提供五種樣式的真實截圖、CSV／XLSX／ODS 範本下載、JSON 轉檔與匯入教學。樣式來源為 `docs/site/tailwind.css`，由 `tailwind.site.config.ts` 建置；截圖存放於 `docs/site/images/`，首頁裁切範圍定義於 `docs/site/tailwind.css`。

## 專案介紹網站與私人紀事工具

`index.html` 是可直接部署到 GitHub Pages 的靜態網站，先介紹插件核心功能、五種樣式與安裝入口，再提供個人紀事範本、轉檔與匯入教學，兩部分比重接近 1:1。官網提供 CSV／XLSX／ODS 轉 JSON 工具，可在瀏覽器本機驗證、預覽及下載 history-personal.json，再匯入插件；檔案不會上傳。

歷史資料分為 `data/history-taiwan.json`（台灣）、`data/history-world.json`（國際）、`data/history-tech.json`（科技主題）、`data/history-entertainment.json`（影音娛樂主題）與
`data/history-personal.json`（個人／家族，`data` 預設為空陣列）。使用者可透過「設定 → 資料管理 → 匯入個人歷史」選檔、預覽並取代本機個人紀事，立即生效，無需重新建置；支援匯出備份、跨分頁同步，匯入空陣列 `[]` 可清空。檔案最大 5 MB、10,000 筆；格式或儲存錯誤會保留原資料。未曾匯入時使用隨程式附帶的個人 JSON，匯入後以本機資料為準。預設顯示三則，預設私人優先，其次台灣、國際，可依使用者開啟的來源調整順序；可按「顯示更多」展開當天全部紀事，再按「收合紀事」恢復三則，切換日期會自動收合；不要將私人資料推送到公開儲存庫。

除了台灣、國際與個人紀事，「設定 → 內容 → 紀事來源與順序」還可以另外開啟兩個主題紀事：科技（半導體、個人電腦、手機等產業里程碑，例如台積電成立、聯發科技成立）與影音娛樂（台灣人較熟知的流行音樂、電影電視與配樂原聲，例如五月天首張專輯、《海角七號》上映、《臥虎藏龍》獲奧斯卡最佳原創音樂）。兩者預設關閉，開啟後才會併入當天的紀事清單；性質與台灣、國際紀事相同，同樣每天精選少量事件而非鉅細靡遺的清單，目前尚未涵蓋全年，會逐步擴充。程式以 `HistoryDataset`
這個資料集介面登錄每個主題，未來新增其他主題時同樣會自動出現在來源開關清單中，不需要修改既有資料或顯示邏輯。

部署：將網站檔案提交後，在 GitHub 儲存庫 **Settings → Pages → Deploy from a branch → main / (root) → Save**。正式網址為 [today.stack-base.com](https://today.stack-base.com/)；根目錄 `CNAME` 已指定此網域，Pages 的自訂網域與 DNS 需對應設定。網站不依賴擴充功能建置，官網採用 Tailwind CSS，修改 `index.html`、`docs/site/tailwind.css` 或 `tailwind.site.config.ts` 後，執行 `npm run build:site`，將產生的 `docs/site/style.css` 一起提交。開發時可用 `npm run dev:site` 持續編譯。無需部署 `dist/`；需保留 `docs/site/`、`templates/`、`vendor/sheetjs/`、`src/calendar/historyRows.js` 及網站使用的 `public/icons/` 資源。本機預覽可執行 `python -m http.server 8080`，再開啟 `http://localhost:8080/`。

隱私權政策位於 `privacy.html`，涵蓋插件本機資料、選用連線權限、搜尋與外部網站、官網轉檔及資料刪除方式。

網站已提供 canonical、Open Graph／Twitter 分享資訊、WebSite／SoftwareApplication 結構化資料，以及 `robots.txt`、`sitemap.xml`；正式網址統一為 `https://today.stack-base.com/`。

## 授權

本專案採用 [ISC License](LICENSE.md)，與 `package.json` 的授權宣告一致。第三方套件、網站圖示及商標仍依各自的授權與權利聲明，圖示來源見[捷徑來源紀錄](public/icons/SOURCES.md)、[Google 圖示紀錄](public/icons/google/SOURCES.md)及[常用網站圖示紀錄](public/icons/websites/SOURCES.md)。

佛家智慧共 366 則：保留聖嚴法師、星雲大師、惟覺老和尚、淨空法師，以及《金剛般若波羅蜜經》《佛遺教經》的原有 16 則，新增《法句經》240 則、《六祖大師法寶壇經》80 則、《四十二章經》30 則。每則附核對網址，新增選句保留原文、經名及篇章資訊。內部分類值沿用 `sheng-yen`，相容既有偏好設定。

四書五經共 366 則，涵蓋《論語》111 則、《孟子》70 則、《大學》20 則、《中庸》30 則、《禮記》其他篇章 40 則、《周易》41 則、《尚書》25 則、《詩經》19 則、《春秋左氏傳》10 則；《左傳》明確標示為傳文。兩個分類皆交錯安排來源，在資料內容與順序不變時，連續 366 天不重複，第 367 天開始下一輪，跨年不重設。原文、篇章及來源網址保存在 `data/quotes.json` 各筆資料中。

文學短句收錄 366 則。文學短句以成長與省思為選句方向，收錄現代散文、小說及《菜根譚》《圍爐夜話》《幽夢影》等哲理小品，附作者、篇名、原文及來源網址。支援五種版型、偏好保存與公共資料更新；資料及順序不變時，連續 366 天不重複，第 367 天開始下一輪。版本與節錄方式保存在各筆 `sourceWork`，原文及連結保存在 `originalText`、`sourceUrl`。

「聖經」分類收錄繁體《和合本》366 則經文選讀，涵蓋愛與饒恕、智慧與學習、謙卑與節制、盼望與安慰、感恩及行善等主題。每則為一節或相鄰數節，附書卷、章節、版本與來源連結；保留經文原意，排除依賴敘事情境才可理解的零碎片段。支援五種版型、偏好保存、依所選日曆時區日期輪替與公共資料更新。

「影視佳句」共 366 則，包含電影與動畫電影 307 則、電視與動畫影集 59 則，以希望、自我認識、挫折、關係與人生選擇為主題。保留原有 33 則，新增 333 則；每則附作品中英文名、年份、所據英文台詞及來源，中文為專案自譯，並非官方字幕。非英語原作另標明採用英文譯本／配音版本。依所選日曆時區的日期每日輪替，在資料與順序不變時連續 366 天不重複，第 367 天開始下一輪，跨年不重設。新增選句依英文 Wikiquote 作品／分季條目核對；該站為可編輯的二手語錄資料庫，並非官方字幕或逐集影音複核。各筆 `sourceWork` 與 `sourceUrl` 保留角色、集名等資訊及核對連結。

語錄來源補充：佛典使用 [CBETA XML 電子佛典](https://github.com/cbeta-org/xml-p5)，完整版本與使用條件 header 保存在 [licenses/cbeta/](licenses/cbeta/)，分別對應《法句經》《四十二章經》《六祖大師法寶壇經》，不由專案程式碼授權取代。古籍及文學選句依維基文庫版本，許地山《空山靈雨》採《空山霝雨》1925 年版。聖經底本為 [Open Bibles 繁體和合本](https://github.com/seven1m/open-bibles/blob/master/chi-cuv.usfx.xml)，2026-09-23 所用檔案 SHA-256：`049e36ec3ee1b5c9bc2c8bfd2ca07f9f1f30398838f692d12ea38a092d41fe4b`；顯示文字省略譯註與詩題等，原文保存在 `originalText`，整理方式記在 `sourceWork`。
