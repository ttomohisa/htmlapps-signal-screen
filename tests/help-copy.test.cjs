const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const removed = [
  "ヘルプや確認ダイアログを開いている間は背景をスクロールできません。長い説明はダイアログ内をスクロールして読めます。高さの低い画面でも確認の見出し・閉じるボタン・操作ボタンを表示します。閉じると開いた操作へフォーカスが戻ります。画面幅の変更でリセットボタンが隠れた場合は、「全画面で表示」へ移動しますが、表示は開始しません。",
  "While Help or a confirmation is open, the background stays still. Scroll inside the dialog to read longer text; confirmation headings, Close, and action buttons remain available in a short window. Closing returns focus to the control that opened it. If resizing hides Reset, focus moves to Show full screen without starting the display."
];
for (const file of ["src/index.template.html", "signal-screen.html"]) {
  test(`${file}: user help omits implementation commentary`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const text of removed) assert.ok(!html.includes(text), `Remove implementation copy from ${file}`);
  });
}
