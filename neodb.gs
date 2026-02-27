/**
 * NeoDB 搜索工具 - iOS/macOS 视觉优化版
 * 插入位置：第 2 行
 */

const BASE_SEARCH_API_URL = "https://neodb.social/api/catalog/search"; 
const BASE_DETAIL_API_BOOK_URL = "https://neodb.social/api/book";       
const BASE_DETAIL_API_MOVIE_URL = "https://neodb.social/api/movie";     

// 1. 自动创建顶部菜单
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📖 NeoDB 搜索')
      .addItem('搜索书籍', 'searchBookAPI')
      .addItem('搜索影视', 'searchMovieAPI')
      .addToUi();
}

/**
 * 公用 CSS 样式：iOS/macOS 风格
 */
const APPLE_STYLE_CSS = `
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      background-color: #f5f5f7; 
      color: #1d1d1f; 
      margin: 0; padding: 20px;
      line-height: 1.5;
    }
    .card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.3);
    }
    h3 { font-size: 20px; font-weight: 600; margin-top: 0; }
    input[type="text"] {
      width: 100%; padding: 12px; border: 1px solid #d2d2d7;
      border-radius: 8px; font-size: 16px; outline: none;
      box-sizing: border-box; transition: border 0.3s;
    }
    input[type="text"]:focus { border: 2px solid #0071e3; }
    button {
      background-color: #0071e3; color: white; border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 14px;
      font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    button:hover { background-color: #0077ed; }
    button.secondary { background-color: #e8e8ed; color: #1d1d1f; margin-right: 8px; }
    .result-item { border-bottom: 0.5px solid #d2d2d7; padding: 15px 0; }
    .result-item:last-child { border-bottom: none; }
    .cover-img { border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 10px 0; }
    .title { font-size: 17px; font-weight: 600; color: #000; }
    .meta { font-size: 13px; color: #86868b; margin: 4px 0; }
    .desc { font-size: 13px; color: #48484a; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  </style>
`;

// 入口函数
function searchBookAPI() { showInput('book', '书籍搜索'); }
function searchMovieAPI() { showInput('movietv', '影视搜索'); }

/**
 * 2. 弹出输入关键词窗口 (iOS 风格)
 */
function showInput(type, title) {
  const html = `
    <html>
      ${APPLE_STYLE_CSS}
      <body>
        <div class="card">
          <p style="font-weight:500; margin-bottom:12px;">请输入关键词：</p>
          <input type="text" id="kw" placeholder="" autofocus>
          <div style="margin-top: 20px; text-align: right;">
            <button class="secondary" onclick="google.script.host.close()">取消</button>
            <button onclick="runSearch()">搜索</button>
          </div>
        </div>
        <script>
          document.getElementById('kw').addEventListener('keypress', function(e){ if(e.key==='Enter') runSearch(); });
          function runSearch() {
            const val = document.getElementById('kw').value;
            if(!val) return;
            google.script.run.withSuccessHandler(()=>google.script.host.close()).executeSearch(val, '${type}');
          }
        </script>
      </body>
    </html>
  `;
  const ui = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(ui, title);
}

/**
 * 3. 搜索结果展示 (macOS 列表风格)
 */
function executeSearch(keyword, category) {
  try {
    const response = UrlFetchApp.fetch(`${BASE_SEARCH_API_URL}?query=${encodeURIComponent(keyword)}&c=${category}`);
    const data = JSON.parse(response.getContentText());

    if (data && data.data && data.data.length > 0) {
      const results = data.data;
      PropertiesService.getScriptProperties().setProperty("searchResults", JSON.stringify(results));

      let htmlContent = results.map((item, index) => {
        const isBook = category === 'book';
        const subTitle = isBook ? `作者: ${ (item.author || []).join(", ") }` : `导演: ${ (item.director || []).join(", ") }`;
        const extra = isBook ? `出版社: ${item.pub_house || "无"}` : `主演: ${ (item.actor || []).slice(0,3).join(", ") }...`;

        return `
          <div class="result-item">
            <div class="title">${index + 1}. ${item.title || "未知"}</div>
            <div class="meta">${subTitle}</div>
            <div class="meta">${extra}</div>
            ${item.cover_image_url ? `<img src="${item.cover_image_url}" class="cover-img" style="width:100px;"/>` : ""}
            <div class="desc">${item.description || "暂无简介"}</div>
            <button style="margin-top:10px;" onclick="google.script.run.${isBook ? 'selectBookResult' : 'selectMovieResult'}(${index}); google.script.host.close();">确认选择</button>
          </div>
        `;
      }).join("");

      const html = `<html>${APPLE_STYLE_CSS}<body><h3>${category==='book'?'书籍':'影视'}搜索结果</h3>${htmlContent}</body></html>`;
      const ui = HtmlService.createHtmlOutput(html).setWidth(600).setHeight(500);
      SpreadsheetApp.getUi().showModalDialog(ui, "NeoDB 搜索结果");
    } else {
      SpreadsheetApp.getUi().alert("未找到结果");
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(`发生错误：${error.message}`);
  }
}

/**
 * 4. 插入书籍 (第 2 行)
 */
function selectBookResult(index) {
  const results = JSON.parse(PropertiesService.getScriptProperties().getProperty("searchResults"));
  const selected = results[index];
  const detail = JSON.parse(UrlFetchApp.fetch(`${BASE_DETAIL_API_BOOK_URL}/${selected.uuid}`).getContentText());

  if (detail) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.insertRowBefore(2); // 改为第 2 行
    
    const richText = SpreadsheetApp.newRichTextValue().setText(selected.title).setLinkUrl(selected.id).build();
    sheet.getRange(2, 1).setFormula('=IMAGE("' + (detail.cover_image_url || "") + '", 2)');
    sheet.getRange(2, 2).setRichTextValue(richText);
    sheet.getRange(2, 3).setValue(selected.author ? selected.author.map(a => a.replace(/\[.*?\]\s*/, "")).join(", ") : "-");
    sheet.getRange(2, 4).setValue((selected.translator || []).join(", "));
    sheet.getRange(2, 6).setValue(detail.pages || "-");
    sheet.getRange(2, 7).setValue(detail.pub_year || "-");
    sheet.getRange(2, 8).setValue(detail.pub_house || "-");
    sheet.getRange(2, 9).setValue(selected.author ? selected.author.map(a => { const m = a.match(/\[(.*?)\]/); return m ? m[1] : "-"; }).join(", ") : "-");
    sheet.getRange(2, 10).setValue(new Date());
    sheet.getRange(2, 12).setFormula('=Year(J2)'); // 同步更新公式参考
    sheet.getRange(2, 13).setFormula('=Month(J2)');
    sheet.getRange(2, 16).setValue(detail.cover_image_url || "-");
  }
}

/**
 * 5. 插入电影 (第 2 行)
 */
function selectMovieResult(index) {
  const results = JSON.parse(PropertiesService.getScriptProperties().getProperty("searchResults"));
  const selected = results[index];
  const detail = JSON.parse(UrlFetchApp.fetch(`${BASE_DETAIL_API_MOVIE_URL}/${selected.uuid}`).getContentText());

  if (detail) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.insertRowBefore(2); // 改为第 2 行

    const richText = SpreadsheetApp.newRichTextValue().setText(selected.title).setLinkUrl(selected.id).build();
    sheet.getRange(2, 1).setFormula('=IMAGE("' + (detail.cover_image_url || "") + '", 2)');
    sheet.getRange(2, 2).setRichTextValue(richText);
    sheet.getRange(2, 3).setValue((selected.director || []).join(", "));
    sheet.getRange(2, 4).setValue((selected.playwright || []).join(", "));
    sheet.getRange(2, 5).setValue((selected.actor || []).join(", "));
    sheet.getRange(2, 6).setValue((selected.genre || []).join(", "));
    sheet.getRange(2, 7).setValue(selected.area || "-");
    sheet.getRange(2, 8).setValue(detail.year || "-");
    sheet.getRange(2, 9).setValue(new Date());
    sheet.getRange(2, 11).setFormula('=Year(I2)');
    sheet.getRange(2, 12).setFormula('=Month(I2)');
    sheet.getRange(2, 13).setValue(selected.category || "-");
    sheet.getRange(2, 16).setValue(detail.cover_image_url || "-");
  }
}
