# 每日一句經典來源

影視佳句目前 33 則的來源與清單修正紀錄見 [影視佳句清單整理](screen-review.md)。外語台詞保留原文，中文標示為自譯；目前每 33 天輪替一次。

`data/quotes.json` 的新增經典選句附有 `originalText`、`sourceWork` 與 `sourceUrl`，供核對原文與篇章。引用古籍正文，不採用現代白話翻譯；整理標點的條目另作標示。《春秋左氏傳》選句標示為傳文，不混稱《春秋》經文。

佛典取自 [CBETA XML 電子佛典](https://github.com/cbeta-org/xml-p5)，連結指向 [CBETA 線上閱讀](https://cbetaonline.dila.edu.tw/zh/)。本目錄保留所使用電子版本的完整 TEI header，包含版本、製作資訊與使用條件：

- `T04n0210.header.xml`：《法句經》。
- `T17n0784.header.xml`：《四十二章經》。
- `T48n2008.header.xml`：《六祖大師法寶壇經》。

CBETA 電子版本的使用條件以各 header 的 `availability` 為準，不由專案程式碼授權取代。四書五經選句來源為維基文庫各條目，具體版本與網址保存在每筆資料中。

整理日期：2026-09-23。

## 文學短句

文學短句收錄 366 則，以時間、自我認識、人際關係、學習與人生選擇等成長省思為方向；保留 53 則現代文學選句，另選入 313 則洪應明《菜根譚》、王永彬《圍爐夜話》、張潮《幽夢影》的哲理小品。純寫景、地理介紹、器物細節，以及離開前文便難以理解的敘事片段不列入選句方向。以維基文庫的原作正文逐句核對，不引用現代白話改寫、編者介紹或作品中的中國詩詞。每則保留作者、篇名、原文與來源網址；與既有各分類以去除標點後的文字比對，排除重複。

許地山《空山靈雨》採用維基文庫[《空山霝雨》1925 年版](https://zh.wikisource.org/zh-hant/空山霝雨_(1925))。顯示時將該版的全形句點 `．` 整理為 `。`，原用字及 `originalText` 保留，`sourceWork` 標示「標點整理」。其餘選句保留所據版本用字，移除網頁排版空白與隱形分頁字元。

各分類的 366 則依固定順序循環，每日一則；原有分類的資料與順序不變。

哲理小品依維基文庫[《菜根譚》明刻本](https://zh.wikisource.org/zh-hant/菜根譚)、[《圍爐夜話》](https://zh.wikisource.org/zh-hant/圍爐夜話)、[《幽夢影》](https://zh.wikisource.org/zh-hant/幽夢影)正文核對。《幽夢影》不收錄附在正文後的他人評語；部分顯示文字整理頓號為逗號或補齊句末句號，`originalText` 保留原文，`sourceWork` 註明標點整理。

## 聖經

`bible` 收錄繁體《和合本》366 則經文選讀，來自 32 卷書。以愛與饒恕、智慧與學習、謙卑與節制、盼望與安慰、感恩及行善為選句方向；避開族譜、地名、單純事件敘述、指涉不明及需要長篇上下文的片段。相鄰經節若共同表達一個完整意思，合為一則並標明節數範圍；不拼接不同段落、不以白話改寫冒充經文。舊約智慧書、詩篇、先知書、福音書與新約書信交錯排列。

底本為 [Open Bibles 的 `chi-cuv.usfx.xml`](https://github.com/seven1m/open-bibles/blob/master/chi-cuv.usfx.xml)，其[版本清單](https://github.com/seven1m/open-bibles#translation-list)標示為 Chinese (Traditional)、Chinese Union Version、Public Domain。2026-09-23 所用檔案的 SHA-256 為 `049e36ec3ee1b5c9bc2c8bfd2ca07f9f1f30398838f692d12ea38a092d41fe4b`。

每則 `originalText` 保留底本所錄完整經節，含附註及詩題；`text` 僅省略譯註、詩題或樂歌標記，並移除因截取經節而落單的引號，具體整理記在 `sourceWork`。保留底本用字，不改寫為勵志文。`sourceUrl` 連至 Bible Gateway 的相應 CUV 書卷章節，方便閱讀上下文；不同電子版本的標點及異體字可能略有差異，以前述底本為準。
