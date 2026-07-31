/**
 * サンプル1: Googleフォーム回答の自動通知(メール+Slack対応)
 *
 * フォームの回答がスプレッドシートに記録された瞬間、
 * 指定した宛先にメール通知します。Slack Webhookも任意で使えます。
 *
 * 【設定手順の概要】※詳細は同梱の手順書を参照
 * 1. フォームの回答先スプレッドシートの拡張機能 > Apps Script にこのコードを貼り付け
 * 2. 下の CONFIG を書き換え
 * 3. setupTrigger() を1回実行(初回は権限の承認が出ます)
 */

// ===== 設定(ここだけ書き換えてください) =====
const CONFIG = {
  // 通知先メールアドレス(複数はカンマ区切り)
  MAIL_TO: 'your-address@example.com',

  // メールの件名に付く接頭辞
  MAIL_SUBJECT_PREFIX: '【フォーム回答】',

  // Slack Incoming Webhook のURL(使わない場合は空文字のまま)
  SLACK_WEBHOOK_URL: '',

  // 通知に含めない項目名(例: ['タイムスタンプ'])
  EXCLUDE_FIELDS: [],
};
// =============================================

/**
 * 初期設定: フォーム送信トリガーを作成します(1回だけ実行)
 */
function setupTrigger() {
  // 二重登録を防ぐため、既存の同名トリガーを削除
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'onFormSubmitNotify') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('onFormSubmitNotify')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log('トリガーを設定しました。フォームをテスト送信して動作を確認してください。');
}

/**
 * フォーム送信時に呼ばれる本体
 * @param {Object} e フォーム送信イベント
 */
function onFormSubmitNotify(e) {
  try {
    const body = buildMessage_(e);
    const subject = CONFIG.MAIL_SUBJECT_PREFIX + '新しい回答が届きました';

    // メール通知
    if (CONFIG.MAIL_TO) {
      MailApp.sendEmail(CONFIG.MAIL_TO, subject, body);
    }

    // Slack通知(設定されている場合のみ)
    if (CONFIG.SLACK_WEBHOOK_URL) {
      UrlFetchApp.fetch(CONFIG.SLACK_WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ text: subject + '\n' + body }),
        muteHttpExceptions: true,
      });
    }
  } catch (err) {
    // 失敗しても回答の記録自体には影響しない。エラーはログと管理者メールに残す
    console.error('通知に失敗しました: ' + err.message);
    if (CONFIG.MAIL_TO) {
      MailApp.sendEmail(
        CONFIG.MAIL_TO,
        CONFIG.MAIL_SUBJECT_PREFIX + '通知エラー',
        'フォーム通知の送信に失敗しました。\n\n' + err.message
      );
    }
  }
}

/**
 * 回答内容を読みやすいテキストに整形します
 * @param {Object} e フォーム送信イベント
 * @return {string} 整形済みメッセージ
 */
function buildMessage_(e) {
  const lines = [];
  const namedValues = e.namedValues || {};

  Object.keys(namedValues).forEach(function (field) {
    if (CONFIG.EXCLUDE_FIELDS.indexOf(field) !== -1) return;
    const value = namedValues[field].join(', ');
    lines.push('■ ' + field + '\n' + (value || '(未回答)'));
  });

  lines.push('\n---\nシートを開く: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  return lines.join('\n\n');
}

/**
 * 動作テスト用: ダミーデータで通知を送ります(トリガー設定前の確認に)
 */
function testNotify() {
  onFormSubmitNotify({
    namedValues: {
      'タイムスタンプ': ['2026/07/12 10:00:00'],
      'お名前': ['テスト太郎'],
      'お問い合わせ内容': ['これはテスト送信です。'],
    },
  });
  Logger.log('テスト通知を送信しました。受信を確認してください。');
}
