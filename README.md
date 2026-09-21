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

- 台灣時間指針時鐘，含時針、分針與秒針；每秒更新，背景分頁暫停更新，返回時校正。桌面以 1920×1080 設計，時鐘置於中央日曆右側；窄螢幕改為上下排列。
- 台灣時區國曆、星期、農曆、二十四節氣、節氣進度與倒數；跨午夜及返回分頁更新。
- 台灣民俗節日、2026 年政府行政機關節日／補假，以及連假日次。
- Google 搜尋及歷史事件深入了解連結。
- 捷徑新增、編輯、刪除、拖曳排序；編輯按鈕支援 Alt + 左右方向鍵排序。
- 跟隨系統／淺色／深色，現代／傳統樣式；設定持久保存。
- 響應式畫面、鍵盤操作、儲存錯誤提示、同裝置分頁設定更新。

## 資料與範圍

放假資料僅適用 2026 年政府行政機關；其他年度以本地曆法運算，不臆測放假或補班。執行
`npm run data:import` 可重建 `data/calendar-2026.json`，驗證全年農曆、節氣與連假，校正報告見
[日曆資料整理紀錄](docs/calendar-data-review.md)。

曆法使用本機打包的 [lunar-typescript](https://github.com/6tail/lunar-typescript)（MIT），未引用其中國大陸假日或宜忌資料。

`data/history.json` 目前收錄 150 筆「歷史上的今天」紀事，其中台灣 99 筆（66%）、國際 51 筆（34%），涵蓋 9～12 月每天 1～3 則（另保留 2/28），以重大政治、社會、科學、文化及體育事件為主；其餘月份尚未收錄，會顯示空狀態。執行
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
- `src/newtab/`：畫面、互動與樣式。
- `data/`：離線日曆、節日、連假與歷史 JSON。
- `public/icons/`：內建捷徑（YouTube、PChome、GitHub）的 favicon 及來源紀錄。
- `_locales/`：擴充功能名稱與說明的中英文語系檔。
- `scripts/import-calendar.mjs`：CSV 匯入及來源差異報告。
- `scripts/validate-history.mjs`：歷史紀事欄位、重複與月份覆蓋檢查。
- `tests/`：曆法及安全邊界單元測試、瀏覽器操作與真實 MV3 離線載入測試。

## 授權

本專案採用 [ISC License](LICENSE.md)，與 `package.json` 的授權宣告一致。第三方套件、網站圖示及商標仍依各自的授權與權利聲明，圖示來源見 [來源紀錄](public/icons/SOURCES.md)。
