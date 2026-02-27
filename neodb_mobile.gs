// NeoDB.gs
// =========================
// 搜索书籍
// =========================
function searchBook(keyword) {
  if (!keyword) return [];

  try {
    const response = UrlFetchApp.fetch(
      `${BASE_SEARCH_API_URL}?query=${encodeURIComponent(keyword)}&category=book`
    );
    const data = JSON.parse(response.getContentText());
    return data && data.data ? data.data : [];
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

// =========================
// 搜索电影
// =========================
function searchMovie(keyword) {
  if (!keyword) return [];

  try {
    const response = UrlFetchApp.fetch(
      `${BASE_SEARCH_API_URL}?query=${encodeURIComponent(keyword)}&category=movie%2Ctv`
    );
    const data = JSON.parse(response.getContentText());
    return data && data.data ? data.data : [];
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

// =========================
// 获取书籍详细信息并插入 Sheet
// =========================
function selectBook(uuid, index) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Book");
  if (!sheet) return { success: false, message: "未找到 Books Sheet" };

  const response = UrlFetchApp.fetch(`${BASE_DETAIL_API_BOOK_URL}/${uuid}`);
  const detail = JSON.parse(response.getContentText());
  if (!detail) return { success: false, message: "未找到书籍详情" };

  sheet.insertRowBefore(2);

  const searchResults = JSON.parse(PropertiesService.getScriptProperties().getProperty("searchResults"));
  const selected = searchResults[index];

  const bookTitle = selected.title || "未知标题";
  const bookUrl = selected.id;
  const richTextValue = SpreadsheetApp.newRichTextValue()
    .setText(bookTitle)
    .setLinkUrl(bookUrl)
    .build();

  sheet.getRange(2, 1).setFormula(detail.cover_image_url ? `=IMAGE("${detail.cover_image_url}",2)` : "");
  sheet.getRange(2, 2).setRichTextValue(richTextValue);
  sheet.getRange(2, 3).setValue(
    selected.author && Array.isArray(selected.author) 
      ? selected.author.map(a => a.replace(/\[.*?\]\s*/, "")).join(", ") 
      : "-"
  );
  sheet.getRange(2, 4).setValue(
    selected.translator && Array.isArray(selected.translator) 
      ? selected.translator.join(", ") 
      : "-"
  );
  sheet.getRange(2, 6).setValue(detail.pages || "-");
  sheet.getRange(2, 7).setValue(detail.pub_year || "-");
  sheet.getRange(2, 8).setValue(detail.pub_house || "-");
  sheet.getRange(2, 9).setValue(
    selected.author && Array.isArray(selected.author) 
      ? selected.author.map(author => {
          const match = author.match(/\[(.*?)\]/);
          return match ? match[1] : "-";
        }).join(", ") 
      : "-"
  );
  sheet.getRange(2, 10).setValue(new Date());
  sheet.getRange(2, 12).setFormula('=Year(J2)');
  sheet.getRange(2, 13).setFormula('=Month(J2)');
  sheet.getRange(2, 16).setValue(detail.cover_image_url || "-");

  return { success: true };
}

// =========================
// 获取电影详细信息并插入 Sheet
// =========================
function selectMovie(uuid, index) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Movie/TV");
  if (!sheet) return { success: false, message: "未找到 Movies Sheet" };

  const response = UrlFetchApp.fetch(`${BASE_DETAIL_API_MOVIE_URL}/${uuid}`);
  const detail = JSON.parse(response.getContentText());
  if (!detail) return { success: false, message: "未找到电影详情" };

  sheet.insertRowBefore(2);

  const searchResults = JSON.parse(PropertiesService.getScriptProperties().getProperty("searchResults"));
  const selected = searchResults[index];

  const movieTitle = selected.title || "未知标题";
  const movieUrl = selected.id;
  const richTextValue = SpreadsheetApp.newRichTextValue()
    .setText(movieTitle)
    .setLinkUrl(movieUrl)
    .build();

  sheet.getRange(2, 1).setFormula(detail.cover_image_url ? `=IMAGE("${detail.cover_image_url}",2)` : "");
  sheet.getRange(2, 2).setRichTextValue(richTextValue);
  sheet.getRange(2, 3).setValue(selected.director && Array.isArray(selected.director) ? selected.director.join(", ") : "-");
  sheet.getRange(2, 4).setValue(selected.playwright && Array.isArray(selected.playwright) ? selected.playwright.join(", ") : "-");
  sheet.getRange(2, 5).setValue(selected.actor && Array.isArray(selected.actor) ? selected.actor.join(", ") : "-");
  sheet.getRange(2, 6).setValue(selected.genre && Array.isArray(selected.genre) ? selected.genre.join(", ") : "-");
  sheet.getRange(2, 7).setValue(selected.area || "-");
  sheet.getRange(2, 8).setValue(detail.year || "-");
  sheet.getRange(2, 9).setValue(new Date());
  sheet.getRange(2, 11).setFormula('=Year(I2)');
  sheet.getRange(2, 12).setFormula('=Month(I2)');
  sheet.getRange(2, 13).setValue(selected.category || "-");
  sheet.getRange(2, 16).setValue(detail.cover_image_url || "-");

  return { success: true };
}

// =========================
// Web App 前端 HTML 输出
// =========================
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("NeoDB Search")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// =========================
// 存储搜索结果到 Properties，用于选择时使用
// =========================
function cacheResults(results) {
  PropertiesService.getScriptProperties().setProperty("searchResults", JSON.stringify(results));
  return { success: true };
}
