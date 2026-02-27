/**
 * 集中管理所有自定义菜单
 * 无论你有多少个功能模块，都在这里统一入口
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  // --- NeoDB 模块 ---
  ui.createMenu("📚 NeoDB")
    .addItem("搜索书籍", "searchBookAPI")
    .addItem("搜索电影", "searchMovieAPI")
    .addToUi();
