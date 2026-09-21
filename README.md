# 台灣今日曆

以 Vite、TypeScript、Tailwind CSS 與 Manifest V3 實作的 Chrome 新分頁。無後端、無帳號、無追蹤，使用 `storage` 與 `favicon` 權限。

## 安裝

需要 Node.js 22.16 以上。

```sh
npm ci
npm run build
```

開啟 `chrome://extensions` → 啟用「開發人員模式」→「載入未封裝項目」→ 選取本專案的 **dist** 資料夾。開啟新分頁即可使用。更新程式後重新建置，再於擴充功能頁按重新載入。

Edge 可在 `edge://extensions` 使用相同方式載入。

## 開發與驗證

```sh
npm run dev
npm run data:import
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

開發預覽網址為 `/newtab.html`；一般網頁使用 localStorage，擴充功能使用 chrome.storage.local，兩者資料互相獨立。建置由小型 Vite 外掛複製 manifest，無需 CRXJS 或背景 service worker。

## 已實作

- 月曆預設以星期日為每週第一天，可在「外觀 → 月曆每週起始日」改為星期一，設定自動保存。
- 五種日曆樣式：留白日常、日常方格、歲月紙曆、月序手帖、時光讀本，皆可搭配亮色／暗色。
- 留白日常保留最初的米色背景、置中日期與時鐘、小型捷徑及無卡片外框的歷史紀事。
- 月序手帖：左側網站捷徑、中央國曆與農曆月曆、右側日期、大指針時鐘及待辦；可切換月份、選取日期查看農曆與歷史，或按「今天」返回。時鐘、待辦與每日一句仍以今天為準，待辦共用同一份清單。
- 時光讀本：深藍日期側欄、每日一句、歷史時間軸，底部提供搜尋與捷徑。每日一句可在外觀設定選擇「每日提醒、聖嚴法師語錄、負能量（幽默）、四書五經」，於月序手帖與時光讀本顯示；分類自動保存，依台灣日期在所選分類內輪替。
- 日常方格樣式採灰藍背景與圓角卡片；寬螢幕並排日期、時鐘、待辦，下方提供膠囊搜尋列、捷徑卡片與歷史卡片，支援暗色模式。
- 便利貼固定於各樣式的預設位置，不可拖曳；點標題可收合／展開，舊版儲存的拖曳位置不再套用。
- 右側工作便利貼：新增待辦、勾選完成、刪除與完成數量；自動儲存在本機，跨日保留，不自動清空。桌面展開、小螢幕收合，可點標題切換；移除擴充功能會清除本機資料。
- 台灣時間指針時鐘，含時針、分針與秒針；每秒更新，背景分頁暫停更新，返回時校正。桌面以 1920×1080 設計，時鐘置於中央日曆右側；窄螢幕改為上下排列。
- 台灣時區國曆、星期、農曆、二十四節氣、節氣進度與倒數；跨午夜及返回分頁更新。
- 台灣民俗節日、2026～2027 年政府行政機關節日／補假，以及連假日次。
- Google 搜尋及歷史事件深入了解連結。
- 捷徑新增、編輯、刪除、拖曳排序；編輯按鈕支援 Alt + 左右方向鍵排序。
- 首次使用的預設捷徑為 YouTube、Facebook、Yahoo 奇摩、ChatGPT；保留使用者已儲存的捷徑。舊版升級時會補上 ChatGPT，手動刪除後不會再次加入。
- 外觀使用圖示搭配滑動分段控制（系統／亮色／暗色），支援鍵盤方向鍵與減少動態效果偏好；另可選五種日曆樣式，設定持久保存。
- 歲月紙曆樣式採紙曆排版、朱紅年份橫幅、雙線框及明體字；寬螢幕以日期／大時鐘／待辦並排，支援亮色紙面與深色配色。
- 響應式畫面、鍵盤操作、儲存錯誤提示、同裝置分頁設定更新。

## 資料與範圍

每日一句存放在 [`data/quotes.json`](data/quotes.json)，每筆包含唯一的 `id`、分類 `category`、句子 `text`、出處或署名 `source`，引用語錄另附 `sourceUrl` 供核對。分類值：`daily`（每日提醒）、`sheng-yen`（聖嚴法師）、`negative`（原創負能量）、`classics`（四書五經，目前收錄《論語》《周易》選句）。可直接新增或修改 JSON，重新執行 `npm run build` 並載入擴充功能後生效。依台灣日期在所選分類內按陣列順序循環選取，同一天顯示同一句；資料隨程式打包，可離線使用。

放假資料涵蓋 2026～2027 年政府行政機關；未收錄年度以本地曆法運算，不臆測放假或補班。
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
新增其他年度時，另須整理 `holidays.json` 的節日／補假名稱、`long-holidays.json` 的官方連假區間，並於 `src/calendar/dailyCalendar.ts` 加入該年資料。
資料來源與核對結果見 [日曆資料整理紀錄](docs/calendar-data-review.md)。

曆法使用本機打包的 [lunar-typescript](https://github.com/6tail/lunar-typescript)（MIT），未引用其中國大陸假日或宜忌資料。

`data/history-taiwan.json` 與 `data/history-world.json` 合計收錄 150 筆「歷史上的今天」紀事，其中台灣 99 筆（66%）、國際 51 筆（34%），涵蓋 9～12 月每天 1～3 則（另保留 2/28），以重大政治、社會、科學、文化及體育事件為主；其餘月份尚未收錄，會顯示空狀態。執行
`npm run data:check-history` 可檢查資料完整性，整理原則見 [歷史資料整理紀錄](docs/history-data-review.md)。

YouTube、PChome、GitHub 捷徑內建 favicon；其他捷徑透過 [Chrome 內建 favicon 功能](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)取得，也可自行匯入 PNG / ICO（最大 64 KB）。無雲端同步，資料保存在本機。

## 名稱與語系

擴充功能正式名稱：中文「台灣今日曆」、英文「Taiwan Today」。`manifest.json` 使用
Chrome 擴充功能的 i18n 機制（`__MSG_extName__` / `__MSG_extDescription__` +
`default_locale: zh_TW`），實際文字定義在 `_locales/zh_TW/messages.json` 與
`_locales/en/messages.json`；Chrome 會依瀏覽器 UI 語言自動選字，找不到對應語系則退回
zh_TW。新增語系時在 `_locales/` 下建立對應資料夾即可，`vite.config.ts` 會自動一併複製到
`dist/`。

## 檔案

- `src/calendar/`：台灣日期、農曆、節氣、節日與歷史組合。
- `src/shortcuts/`：捷徑資料驗證與儲存（`chrome.storage.local` / `localStorage`）。
- `src/search/`：搜尋網址組成與自訂捷徑網址驗證。
- `src/newtab/`：畫面與互動主體（`newtab.ts`）、指針時鐘（`clock.ts`）、工作便利貼（`todos.ts`）、月序手帖與時光讀本版面（`concepts.ts`）；樣式依版面拆分為
  `newtab.css`（留白日常）、`modern.css`（日常方格）、`traditional.css`（歲月紙曆）、`concepts.css`（月序手帖／時光讀本）。
- `data/`：離線日曆、節日、連假、歷史與每日一句 JSON。
- `public/icons/`：應用程式圖示 `taiwan-today.png`（擴充功能與左上角標誌）、`taiwan-today.ico`（分頁圖示），以及內建捷徑的 favicon 與來源紀錄。
- `_locales/`：擴充功能名稱與說明的中英文語系檔。
- `scripts/import-calendar.mjs`：CSV 匯入及來源差異報告。
- `scripts/validate-history.mjs`：歷史紀事欄位、重複與月份覆蓋檢查。
- `tests/`：曆法及安全邊界單元測試、瀏覽器操作與真實 MV3 離線載入測試。

## 授權

本專案採用 [ISC License](LICENSE.md)，與 `package.json` 的授權宣告一致。第三方套件、網站圖示及商標仍依各自的授權與權利聲明，圖示來源見 [來源紀錄](public/icons/SOURCES.md)。

## 專案介紹網站與私人紀事工具

`index.html` 是可直接部署到 GitHub Pages 的靜態網站，提供插件介紹、CSV／XLSX 範本、工作表選擇、資料檢查及 JSON 下載。檔案在瀏覽器本機處理，不上傳、不保存；試算表解析器隨網站附帶。

歷史資料分為 `data/history-taiwan.json`（台灣）、`data/history-world.json`（國際）與 `data/history-personal.json`（個人／家族，預設空陣列）。使用者可透過「外觀 → 匯入個人歷史 JSON」選檔、預覽並取代本機個人紀事，立即生效，無需重新建置；支援匯出備份、跨分頁同步，匯入空陣列 `[]` 可清空。檔案最大 5 MB、10,000 筆；格式或儲存錯誤會保留原資料。未曾匯入時使用隨程式附帶的個人 JSON，匯入後以本機資料為準。每天最多顯示三則，個人紀事優先，其次台灣、國際；不要將私人資料推送到公開儲存庫。

未來科技、半導體、PC、手機與影音娛樂主題已預留 `HistoryDataset` 介面；目前尚未提供主題內容或切換功能，詳見 [歷史主題擴充規劃](docs/history-topics-plan.md)。

部署：將網站檔案提交後，在 GitHub 儲存庫 **Settings → Pages → Deploy from a branch → main / (root) → Save**。預期網址為 `https://bruce-yang-422.github.io/Taiwan-Today/`（需啟用 Pages 才會生效）。網站不依賴擴充功能建置，無需部署 `dist/`。本機預覽可執行 `python -m http.server 8080`，再開啟 `http://localhost:8080/`。
