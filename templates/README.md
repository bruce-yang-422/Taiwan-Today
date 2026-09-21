# 個人／家族紀事範例

下載 [CSV](history-template.csv)、[Excel XLSX](history-template.xlsx) 或 [OpenDocument ODS](history-template.ods)，三種格式包含相同的兩筆示意紀事。請替換成自己的內容，保留第一列表頭。

| 欄位 | 格式 |
| --- | --- |
| 日期 | 必填，文字格式 `09-21`，或完整日期 `2010-09-21` |
| 年份 | 西元年；日期已含年份時可留白 |
| 標題 | 必填，最多 200 字 |
| 摘要 | 必填，最多 5,000 字 |
| 分類 | 個人／家族；空白則使用轉檔工具的分類選項 |
| 關鍵字 | 選填，填寫後會提供 Google 搜尋連結 |
| 來源 | 選填，例如家庭相簿 |
| 來源網址 | 選填，只接受 HTTPS 網址 |

CSV 使用 UTF-8（含 BOM）；以試算表開啟時，建議把「日期」欄指定為文字，避免 `09-21` 被自動加上錯誤年份。

填寫後到 [官網轉檔工具](https://today.stack-base.com/#converter) 選取檔案，下載 `history-personal.json`，再於插件「設定 → 資料管理 → 匯入個人歷史」匯入。每個檔案最多 5 MB、10,000 筆紀事，資料只在瀏覽器處理。

維護者可執行 `node scripts/prepare-history-templates.mjs` 重新產生範例。
