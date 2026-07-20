/**
 * サンプル2: 売上データの自動集計レポート(日次メール送信)
 *
 * 「データ」シートの記録(日付・カテゴリ・金額)を毎朝自動で集計し、
 * 「集計」シートを更新したうえで、当月サマリーをメールで送ります。
 *
 * 【前提のシート構成】※列名はCONFIGで変更できます
 *   シート「データ」: A列=日付, B列=カテゴリ, C列=金額(1行目はヘッダー)
 *
 * 【設定手順の概要】※詳細は同梱の手順書を参照
 * 1. スプレッドシートの拡張機能 > Apps Script にこのコードを貼り付け
 * 2. 下の CONFIG を書き換え
 * 3. setupDailyTrigger() を1回実行(初回は権限の承認が出ます)
 */

// ===== 設定(ここだけ書き換えてください) =====
const CONFIG = {
  DATA_SHEET: 'データ',      // 記録用シート名
  REPORT_SHEET: '集計',      // 集計結果を書き出すシート名(無ければ自動作成)
  MAIL_TO: 'your-address@example.com', // レポート送信先(空文字なら送信しない)
  MAIL_SUBJECT: '【日次レポート】当月売上サマリー',
  DAILY_HOUR: 8,             // 毎日何時に実行するか(0-23)
};
// =============================================

/**
 * 初期設定: 毎日定時のトリガーを作成します(1回だけ実行)
 */
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'runDailyReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('runDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.DAILY_HOUR)
    .create();

  Logger.log('毎日' + CONFIG.DAILY_HOUR + '時のトリガーを設定しました。');
}

/**
 * 本体: 集計→シート更新→メール送信
 */
function runDailyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!dataSheet) {
    throw new Error('シート「' + CONFIG.DATA_SHEET + '」が見つかりません。CONFIGを確認してください。');
  }

  const rows = dataSheet.getDataRange().getValues().slice(1); // ヘッダー除外
  const summary = aggregateCurrentMonth_(rows);

  writeReportSheet_(ss, summary);

  if (CONFIG.MAIL_TO) {
    MailApp.sendEmail(CONFIG.MAIL_TO, CONFIG.MAIL_SUBJECT, buildMailBody_(summary, ss.getUrl()));
  }
}

/**
 * 当月分をカテゴリ別・日別に集計します
 * @param {Array<Array>} rows データ行(日付, カテゴリ, 金額)
 * @return {Object} 集計結果
 */
function aggregateCurrentMonth_(rows) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const byCategory = {};
  const byDay = {};
  let total = 0;
  let count = 0;

  rows.forEach(function (row) {
    const date = row[0];
    const category = String(row[1] || '未分類');
    const amount = Number(row[2]) || 0;

    if (!(date instanceof Date)) return; // 日付でない行は無視
    if (date.getFullYear() !== year || date.getMonth() !== month) return; // 当月のみ

    byCategory[category] = (byCategory[category] || 0) + amount;
    const dayKey = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM/dd');
    byDay[dayKey] = (byDay[dayKey] || 0) + amount;
    total += amount;
    count += 1;
  });

  return { year: year, month: month + 1, total: total, count: count, byCategory: byCategory, byDay: byDay };
}

/**
 * 「集計」シートに結果を書き出します(毎回クリアして再作成)
 */
function writeReportSheet_(ss, summary) {
  let sheet = ss.getSheetByName(CONFIG.REPORT_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.REPORT_SHEET);
  }
  sheet.clearContents();

  const lines = [
    ['対象月', summary.year + '年' + summary.month + '月'],
    ['合計金額', summary.total],
    ['件数', summary.count],
    ['最終更新', new Date()],
    [],
    ['カテゴリ', '金額'],
  ];

  Object.keys(summary.byCategory)
    .sort(function (a, b) { return summary.byCategory[b] - summary.byCategory[a]; })
    .forEach(function (cat) {
      lines.push([cat, summary.byCategory[cat]]);
    });

  lines.push([]);
  lines.push(['日付', '金額']);
  Object.keys(summary.byDay).sort().forEach(function (day) {
    lines.push([day, summary.byDay[day]]);
  });

  // 行ごとに列数が違うため1列ずつ書くのではなく、最大列数に合わせて整形して一括書き込み
  const maxCols = 2;
  const values = lines.map(function (line) {
    const padded = line.slice(0, maxCols);
    while (padded.length < maxCols) padded.push('');
    return padded;
  });
  sheet.getRange(1, 1, values.length, maxCols).setValues(values);
}

/**
 * メール本文を組み立てます
 */
function buildMailBody_(summary, url) {
  const lines = [
    summary.year + '年' + summary.month + '月の売上サマリーです。',
    '',
    '合計: ' + summary.total.toLocaleString() + '円(' + summary.count + '件)',
    '',
    '■ カテゴリ別',
  ];

  Object.keys(summary.byCategory)
    .sort(function (a, b) { return summary.byCategory[b] - summary.byCategory[a]; })
    .forEach(function (cat) {
      lines.push('・' + cat + ': ' + summary.byCategory[cat].toLocaleString() + '円');
    });

  lines.push('');
  lines.push('詳細はシートをご確認ください: ' + url);
  return lines.join('\n');
}

/**
 * 動作テスト用: 手動で1回実行します(トリガー設定前の確認に)
 */
function testReport() {
  runDailyReport();
  Logger.log('レポートを実行しました。「' + CONFIG.REPORT_SHEET + '」シートとメールを確認してください。');
}
