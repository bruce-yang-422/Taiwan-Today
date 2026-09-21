<a href="https://today.stack-base.com/"><img src="public/icons/taiwan-today.png" alt="台灣今日曆 Logo" width="80" height="80" /></a>

# 台灣今日曆

官網：[today.stack-base.com](https://today.stack-base.com/)

個人／家族紀事範例：[CSV](templates/history-template.csv)、[XLSX](templates/history-template.xlsx)、[ODS](templates/history-template.ods)。欄位格式見 [範例說明](templates/README.md)，填寫後可在[官網轉檔工具](https://today.stack-base.com/#converter)轉成 JSON，再於插件「設定 → 資料管理」匯入。

以 Vite、TypeScript、Tailwind CSS 與 Manifest V3 實作的 Chrome 新分頁。無後端、無帳號、無追蹤，離線可用，可選擇連線更新公共資料；使用 `storage` 與 `favicon` 權限，連線更新則另需授權 GitHub Raw 連線。

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

- 右上角提供 Gmail、雲端硬碟與 Google 日曆的小圖示捷徑，可直接另開分頁；滑鼠停留顯示名稱。自訂 Google 應用程式九宮格收錄 41 個服務，以常用通訊、影音、搜尋及文件工具優先，商務工具靠後（編輯預設順序，非官方熱門排名）；支援選單內捲動、鍵盤操作、Esc 與點外側關閉。圖示隨插件打包，不讀取 Google 帳戶或同步官方最愛，無需額外權限；來源見 [Google 圖示紀錄](public/icons/google/SOURCES.md)。

- 設定視窗以圓角頁籤分成「外觀、內容、資料管理、關於」，支援左右方向鍵與 Home／End 切換；適用筆電與手機，完成按鈕固定在視窗底部。

- 「設定 → 紀事來源與順序」可開關來源並以上下箭頭排序，預設私人 → 台灣 → 國際；前三則及展開列表皆依已開啟來源的順序顯示。設定會保存並跨分頁同步，關閉不會刪除資料。

- 「設定 → 顯示內容」提供歷史、每日一句、今日待辦與指針時鐘秒針開關，五種樣式共用設定並跨分頁同步，預設皆開啟；隱藏不會刪除資料，數字時鐘仍顯示時分秒。

- 「設定 → 文字大小」提供標準／大字，立即套用並保存在本機；調整歷史內文、來源、操作提示與表單字級。五種樣式已驗證 1366×768 及模擬 125%／150% 縮放的可用視窗，內容可向下捲動。

- 月曆預設以星期日為每週第一天，可在「設定 → 月曆每週起始日」改為星期一，設定自動保存。
- 五種日曆樣式：留白日常、日常方格、歲月紙曆、月序手帖、時光讀本，皆可搭配亮色／暗色。
- 五種樣式提供筆電緊湊排版，縮減卡片、日期、捷徑及區塊間距；以 1366×768、標準字級、2026/09/21 三則歷史與負能量語錄驗證可完整顯示。大字、更多紀事或較長內容仍可自然捲動，不裁切文字。
- 留白日常保留最初的米色背景、置中日期與時鐘、小型捷徑及無卡片外框的歷史紀事。
- 月序手帖：左側網站捷徑、中央國曆與農曆月曆、右側日期、大指針時鐘及待辦；可切換月份、選取日期查看農曆與歷史，或按「今天」返回。右欄標示「選取日期」與完整年月日；「現在時間 · 台灣」、「今日待辦」及「今日語錄」仍以今天為準，並顯示今天日期與說明，待辦共用同一份清單且跨日保留。
- 時光讀本：深藍日期側欄、每日一句、歷史時間軸，底部提供搜尋與捷徑。每日一句可在設定選擇「每日提醒、聖嚴法師語錄、負能量（幽默）、四書五經」，於五種樣式皆可顯示；分類自動保存，依台灣日期在所選分類內輪替。
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

## 下一階段規劃

依優先順序：補齊全年歷史內容、完整備份（個人紀事／捷徑／待辦／設定）、將設定分成外觀／內容／資料管理、改善閱讀體驗（長語錄收合／樣式縮圖；標準／大字已完成），以及提供個人紀事單筆新增／編輯表單。這些項目尚未完成，範圍與完成條件見 [產品路線圖](taiwan_daily_chrome_newtab_plan.md#4-下一階段優先項目)。

## 資料與範圍

### GitHub 公共資料更新

每份資料 JSON 都在開頭宣告自己的 `version`，原本的陣列或物件放在 `data`，例如：

```json
{
  "version": "1.2.0",
  "updatedAt": "2026-09-21T17:20:00.000+08:00",
  "data": []
}
```

**直接修改各 JSON 的 `version`，建置不會自動升版。** 不同檔案可以使用不同版本，例如 `quotes.json` 為 `1.2.0`、`history-taiwan.json` 為 `2.0.0`。版號格式為三段數字 `x.y.z`，不加 `v`。`data` 必須保留該檔案原本的內容格式。

不再使用 `data/versions.json`，各檔案自行宣告版本。`update-manifest.json` 是必要的遠端下載清單，由 `npm run data:prepare-update` 或 `npm run build` 產生；請將資料與這份清單一起提交推送。只改版號或只改內容，都會產生新的更新識別碼。首次上架以 `1.0.0` 為基準，之後自行調整有更新的 JSON 版號，工具不會自動升版。

`history-personal.json` 的版號只代表內建範本，不涉及使用者本機資料；匯入仍相容舊版純陣列（包含用來清空的 `[]`）與新版 `{ "version": "1.0.0", "data": [...] }`。官網轉檔與個人備份仍輸出相容的純陣列。

此包裝格式需要新版插件讀取；舊插件無法直接載入新格式，更新驗證失敗時會保留原資料。設定中的「關於」提供作者、插件版本、發布時間與各資料檔版本；插件版本取自 `manifest.json`。

公共資料檔的 `updatedAt` 使用台灣時間 `+08:00`，由 `npm run data:prepare-update` 或建置時自動維護。檔案變更時更新時間，未變更則保留；更新清單同步使用同一時間。`history-personal.json` 不列入遠端清單，其範本版號與時間可自行修改，使用者匯入的紀事與範本版本無關。

首次點「立即更新」或啟用每日檢查時，Chrome 會要求 GitHub 連線授權；允許後才下載，拒絕則保留原資料。若舊版顯示 `connect-src 'none'`，請在 `chrome://extensions` 重新載入指向最新 `dist` 的擴充功能，關閉舊新分頁後重新開啟；單純重新整理頁面不會更新 manifest 政策。

「設定 → 公共資料更新」可按「立即更新」，或開啟預設關閉的每日自動檢查。有新分頁開啟或返回前景時檢查，持續開啟時每小時確認是否已滿 24 小時；關閉所有新分頁後不會在背景下載。

更新來源固定為本儲存庫 `main/data/`，包含台灣／國際歷史、語錄、民俗節日、政府假日、連假及年度日曆。整批通過大小、SHA-256 與格式驗證後才保存並立即套用；離線或更新失敗保留原資料。私人紀事、捷徑、待辦與設定不會上傳或覆蓋。下載會連線 GitHub，但不附帶上述使用者資料。

維護者修改 JSON 後執行：

```sh
npm run data:prepare-update
```

將修改的公共 JSON 與產生的 `data/update-manifest.json` **一起提交並推送至 main**，使用者即可取得更新，不需為每次內容修改重新上架。每檔上限 2 MB、整批上限 5 MB；產生清單後若再修改資料，須重新執行指令。私人 JSON 不會列入更新清單。

首次啟用此能力仍需發布一次新版擴充功能（包含更新程式與 GitHub 連線權限），並將更新清單推送至遠端。日後程式功能、資料格式、新語錄分類或新歷史主題的變更仍需發布新版；此機制只下載 JSON，不下載或執行遠端程式。

每日一句存放在 [`data/quotes.json`](data/quotes.json)，每筆包含唯一的 `id`、分類 `category`、句子 `text`、出處或署名 `source`，引用語錄另附 `sourceUrl` 供核對。分類值：`daily`（每日提醒）、`sheng-yen`（聖嚴法師）、`negative`（原創負能量）、`classics`（四書五經，目前收錄《論語》《周易》選句）。可直接新增或修改 JSON，依上方公共資料更新流程發布；或重新執行 `npm run build` 將內容隨插件打包。依台灣日期在所選分類內按陣列順序循環選取，同一天顯示同一句；資料隨程式打包，可離線使用。

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
新增其他年度時，另須整理 `holidays.json` 的節日／補假名稱、`long-holidays.json` 的官方連假區間；更新清單會自動納入 `calendar-YYYY.json`（1900～2100 年），已升級的插件可直接下載使用。若要讓新年度隨安裝包附帶，另於 `src/data/publicData.ts` 加入該年匯入。

曆法使用本機打包的 [lunar-typescript](https://github.com/6tail/lunar-typescript)（MIT），未引用其中國大陸假日或宜忌資料。

`data/history-taiwan.json` 與 `data/history-world.json` 合計收錄 193 筆「歷史上的今天」紀事，其中台灣 129 筆（67%）、國際 64 筆（33%）。9～12 月每天皆有 1～3 則；1～8 月目前為精選重大事件，僅涵蓋部分日期，尚未每天有內容，缺少資料的日期會顯示空狀態。內容以重大政治、社會、科學、文化及體育事件為主。另有預設關閉的主題紀事：`data/history-tech.json`（科技，5 筆）與 `data/history-entertainment.json`（影音娛樂，8 筆），同樣僅涵蓋部分日期，會逐步擴充。執行
`npm run data:check-history` 可檢查資料完整性。

YouTube、PChome、GitHub 捷徑內建 favicon；其他捷徑透過 [Chrome 內建 favicon 功能](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)取得，也可自行匯入 PNG / ICO（最大 64 KB）。無雲端同步，資料保存在本機。

## 名稱與語系

擴充功能正式名稱：中文「台灣今日曆」、英文「Taiwan Today」。`manifest.json` 使用
Chrome 擴充功能的 i18n 機制（`__MSG_extName__` / `__MSG_extDescription__` +
`default_locale: zh_TW`），實際文字定義在 `_locales/zh_TW/messages.json` 與
`_locales/en/messages.json`；Chrome 會依瀏覽器 UI 語言自動選字，找不到對應語系則退回
zh_TW。新增語系時在 `_locales/` 下建立對應資料夾即可，`vite.config.ts` 會自動一併複製到
`dist/`。

## 檔案

- `src/calendar/`：台灣日期、農曆、節氣、節日組合（`dailyCalendar.ts` 等）；歷史資料集登錄與合併（`history.ts`，`HistoryDataset`
  介面供未來主題擴充）、個人歷史 JSON 驗證（`personalHistory.ts`）。
- `src/shortcuts/`：捷徑資料驗證與儲存（`chrome.storage.local` / `localStorage`）。
- `src/search/`：搜尋網址組成與自訂捷徑網址驗證。
- `src/data/`：公共資料格式定義與套用（`publicData.ts`）、GitHub 更新下載與快取（`updates.ts`）。
- `src/newtab/`：畫面與互動主體（`newtab.ts`）、指針時鐘（`clock.ts`）、工作便利貼（`todos.ts`）、個人歷史匯入／匯出對話框（`personalHistory.ts`）、紀事來源開關與排序（`historySources.ts`）、公共資料更新面板（`dataUpdates.ts`）、Google 應用程式九宮格（`googleApps.ts` 搭配 `googleServices.ts` 服務清單）、月序手帖與時光讀本版面（`concepts.ts`）；樣式依版面拆分為
  `newtab.css`（留白日常）、`modern.css`（日常方格）、`traditional.css`（歲月紙曆）、`concepts.css`（月序手帖／時光讀本）、`googleApps.css`（Google 應用程式選單）、`readability.css`（文字大小與閱讀相關樣式）。
- `data/`：離線日曆（`calendar-2026.json`、`calendar-2027.json`）、節日與連假規則、歷史紀事（`history-taiwan.json`、`history-world.json`、`history-tech.json`、`history-entertainment.json`、`history-personal.json`）、每日一句與公共資料更新清單（`update-manifest.json`）。
- `public/icons/`：應用程式圖示 `taiwan-today.png`（擴充功能與左上角標誌）、`taiwan-today.ico`（分頁圖示），以及內建捷徑的 favicon 與來源紀錄。
- `_locales/`：擴充功能名稱與說明的中英文語系檔。
- `scripts/import-calendar.mjs`：依年份重建日曆資料，並可用官方 CSV 核對放假旗標。
- `scripts/validate-history.mjs`：歷史紀事欄位、重複與月份覆蓋檢查。
- `scripts/prepare-data-update.mjs`：驗證公共 JSON 並產生 `data/update-manifest.json`，供使用者端下載更新比對。
- `tests/`：曆法及安全邊界單元測試、瀏覽器操作與真實 MV3 離線載入測試。
- `index.html`、`docs/site/`：可部署到 GitHub Pages 的專案介紹網站，含 CSV／XLSX 轉個人歷史 JSON 的本機轉換工具。

## 授權

本專案採用 [ISC License](LICENSE.md)，與 `package.json` 的授權宣告一致。第三方套件、網站圖示及商標仍依各自的授權與權利聲明，圖示來源見 [來源紀錄](public/icons/SOURCES.md)。

## 專案介紹網站與私人紀事工具

`index.html` 是可直接部署到 GitHub Pages 的靜態網站，提供插件介紹、CSV／XLSX 範本、工作表選擇、資料檢查及 JSON 下載。檔案在瀏覽器本機處理，不上傳、不保存；試算表解析器隨網站附帶。

歷史資料分為 `data/history-taiwan.json`（台灣）、`data/history-world.json`（國際）、`data/history-tech.json`（科技主題）、`data/history-entertainment.json`（影音娛樂主題）與
`data/history-personal.json`（個人／家族，預設空陣列）。使用者可透過「設定 → 匯入個人歷史 JSON」選檔、預覽並取代本機個人紀事，立即生效，無需重新建置；支援匯出備份、跨分頁同步，匯入空陣列 `[]` 可清空。檔案最大 5 MB、10,000 筆；格式或儲存錯誤會保留原資料。未曾匯入時使用隨程式附帶的個人 JSON，匯入後以本機資料為準。預設顯示三則，預設私人優先，其次台灣、國際，可依使用者開啟的來源調整順序；可按「顯示更多」展開當天全部紀事，再按「收合紀事」恢復三則，切換日期會自動收合；不要將私人資料推送到公開儲存庫。

除了台灣、國際與個人紀事，「設定 → 紀事來源與順序」還可以另外開啟兩個主題紀事：科技（半導體、個人電腦、手機等產業里程碑，例如台積電成立、聯發科技成立）與影音娛樂（台灣人較熟知的流行音樂、電影電視與配樂原聲，例如五月天首張專輯、《海角七號》上映、《臥虎藏龍》獲奧斯卡最佳原創音樂）。兩者預設關閉，開啟後才會併入當天的紀事清單；性質與台灣、國際紀事相同，同樣每天精選少量事件而非鉅細靡遺的清單，目前尚未涵蓋全年，會逐步擴充。程式以 `HistoryDataset`
這個資料集介面登錄每個主題，未來新增其他主題時同樣會自動出現在來源開關清單中，不需要修改既有資料或顯示邏輯。

部署：將網站檔案提交後，在 GitHub 儲存庫 **Settings → Pages → Deploy from a branch → main / (root) → Save**。預期網址為 `https://bruce-yang-422.github.io/Taiwan-Today/`（需啟用 Pages 才會生效）。網站不依賴擴充功能建置，無需部署 `dist/`。本機預覽可執行 `python -m http.server 8080`，再開啟 `http://localhost:8080/`。
