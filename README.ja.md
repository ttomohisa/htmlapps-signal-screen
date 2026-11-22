# Signal Screen

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-signal-screen/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-signal-screen/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-signal-screen/)

[English README](README.md)

スマホやPCの画面いっぱいに、文字・矢印・色・QRコードを大きく表示できる単一HTMLアプリです。待ち合わせ、イベント誘導、旅行、離れた相手への案内など、その場だけ大きな表示が欲しいときに使えます。

## 🚀 デモ

### [GitHub PagesでSignal Screenを開く](https://ttomohisa.github.io/htmlapps-signal-screen/)

GitHub Pagesから最初のHTMLを読み込んだ後、文字表示、QR生成、設定保存などは端末内だけで処理されます。入力した文字やQRの内容をアプリが外部へ送信することはありません。

リポジトリ内の[PC画面](assets/screenshot.png)と[スマートフォン画面](assets/screenshot-mobile.png)はv1.0.4時点の画像です。v1.1.0ではレイアウトが変わるため、最新版のスクリーンショットはリリース配布物にも含めます。

## 主な機能

- 文字を画面いっぱいに自動フィットして表示。12文字以内の改行なしの短文は1行を優先
- 「ここです」「助けて」「SOS」「止まって」のクイックプリセット
- よく使う文字と背景色を最大3件保存して呼び出し・削除
- `←` `↑` `↓` `→` の方向矢印を大きく表示
- 黒・白・赤・黄・緑・青の背景色
- 背景色に応じて白 / 黒の文字色を自動選択
- **文字・矢印 / QR** をワンタップで切り替え
- URLや短い日本語テキストからQRコードを端末内だけで生成
- QR入力欄から、端末が許可する場合にクリップボードのテキストを貼り付け
- QRコードは読み取りやすさを優先し、黒いモジュール・白背景・クワイエットゾーンを固定
- QRモードでは点滅を自動無効化
- 点滅なし / ゆっくり / ビーコン / SOSパターン
- 点滅を初めて有効にするときの安全確認
- `prefers-reduced-motion` 有効時は点滅を自動的に無効化
- Fullscreen APIによる全画面表示
- Screen Wake Lock対応環境では表示中のスリープを抑制
- 日本語 / Englishを同じHTML内で切り替え
- 文字、QR内容、背景色などをLocalStorageへ自動保存
- PC・スマートフォン向けレスポンシブUI（プリセット優先、コンパクトなプレビュー、スマホ用リセット、キーボード表示への追従）
- 全画面表示中も画面維持・全画面APIの利用可否を通知
- 通常版とgzip自己解凍版の2種類の単一HTMLを生成

## 表示中の操作とリセット

- 「操作を固定」で操作ボタンを表示したままにできます。背景をタップしても隠れません。解除すると、フォーカスや確認ダイアログを保護しながら自動で隠れる動作に戻ります。固定は表示を閉じると解除されます。
- 「画面維持」は表示を開くたびに要求されます。手動でオフにすると、タブに戻ってもオフのままです。再度オンにすると再要求します。オンのままブラウザー側で解除された場合は、タブに戻った際に再取得できます。

- Tab / Shift+Tabで表示中の操作ボタンだけを移動します。フォーカス中のボタンは隠れません。表示を閉じると「全画面で表示」へ戻ります。
- 確認ダイアログが開いているとき、Escはそのダイアログだけを閉じます。もう一度Escを押すと表示を閉じます。
- リセットは確認後、選択中の言語の初期メッセージ、黒背景、点滅なし、文字・矢印モードへ戻します。QRの内容、保存した合図、点滅の確認も消去しますが、言語は維持します。キャンセルでは変更しません。

## すぐに使う

アカウント登録やサーバーへのデータ送信はありません。入力内容と設定はブラウザー内だけで扱われます。

### Webで使う

[デモを開く](https://ttomohisa.github.io/htmlapps-signal-screen/)だけで利用できます。インストールやアカウント登録は不要です。

### ダウンロードして使う

最新版のHTMLは[GitHub Releases](https://github.com/ttomohisa/htmlapps-signal-screen/releases/latest)からダウンロードできます。v1.1.0のファイル名は `htmlapps-signal-screen-v1.1.0.html` です。Chromium系ブラウザー、Firefox、Safariで開いてください。

リポジトリの `dist/` と `signal-screen.html` はビルド時点のファイルです。PR更新直後には最新ソースを反映していない場合があるため、利用時はバージョン付きのリリースファイルを選ぶか、`build-standalone.ps1` で生成してください。

文字・矢印・QR生成などのコア機能は、通常版HTMLを `file://` で直接開いても利用できる設計です。FullscreenやScreen Wake Lockは、ブラウザーや開き方によって利用できない場合があります。

### 自己解凍版を使う

リリースにある `*.self-extract.html` は、通常版HTMLをgzip圧縮して内包した1ファイル版です。開くとブラウザー内で展開し、そのままSignal Screenを起動します。

自己解凍版には `DecompressionStream` 対応ブラウザーが必要です。通常版と同じfaviconを自動継承し、自己解凍ローダーはWindows PowerShell 5.1で文字化けしにくいASCII-onlyで生成します。

## 使い方

### 文字・矢印を表示する

1. **文字・矢印** を選びます。
2. 表示したい文字を入力するか、「ここです」「SOS」などのプリセットを選びます。
3. 必要に応じて背景色を選びます。
4. 点滅が必要な場合だけ、ゆっくり / ビーコン / SOSから選びます。
5. **全画面で表示** を押します。
6. 全画面表示中に画面をタップすると操作ボタンを表示 / 非表示できます。

よく使う合図は「今の合図を保存」で最大3件まで保存できます。保存するのは文字と背景色で、点滅設定は保存しません。保存した合図の削除と全体のリセットには確認が必要です。スマホのプレビュー右上にもリセットがあります。

文字サイズは画面内へ収まるよう自動調整されます。12文字以内で改行がない場合は1行を優先し、文字が小さくなりすぎるときは折り返します。短い文字や矢印は、スマートフォンを横向きにするとさらに大きく見せられます。

### QRコードを表示する

1. **QR** を選びます。
2. URLまたは短いテキストを入力します。対応ブラウザーでは「貼り付け」からクリップボードを読み込めます。
3. 入力と同時にQRコードのプレビューが生成されます。
4. **全画面で表示** を押すと、読み取りやすいサイズまでQRコードを拡大します。

クリップボードへのアクセスは「貼り付け」を押したときにだけ行います。許可されていない場合は、入力欄を長押しして貼り付けてください。ブラウザーからクリップボードへ自動アクセスすることはありません。

QR生成は端末内だけで行われます。QRモードでは読み取り性能を優先するため、背景色変更と点滅は使用しません。現在の入力上限はUTF-8で300 bytesです。

### 点滅表示

点滅は必要な場面だけで使用してください。初回に安全確認ダイアログを表示します。

- **ゆっくり**: 間隔を空けて表示 / 非表示を繰り返します。
- **ビーコン**: 視認性を高める低速の明滅です。
- **SOS**: `... --- ...` を意識した表示パターンです。

高頻度ストロボは実装していません。また、端末で `prefers-reduced-motion` が有効な場合は点滅を強制的に「なし」へ戻します。

## リリースとGitHub Pages

`main` への反映後、リリース用ワークフローが検証を行い、未公開のバージョンについてタグとGitHub Releaseを作成します。PRの時点ではタグもリリースも作成しません。通常版・自己解凍版のHTML、ZIP、チェックサム、更新後のスクリーンショットを配布します。

## GitHub Pagesで公開する

このリポジトリには、単一HTMLをビルド・検証してGitHub Pagesへ公開するワークフローが含まれています。

1. リポジトリ名を `htmlapps-signal-screen` としてGitHubへプッシュします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` ブランチへプッシュするか、Actions画面から **Deploy standalone app to GitHub Pages** を実行します。
4. ビルド成功後、`https://ttomohisa.github.io/htmlapps-signal-screen/` で公開されます。

Pagesがまだ有効になっていない場合、ワークフローはHTMLのビルドまでは行い、Pagesデプロイだけをスキップして設定手順をSummaryへ表示します。Pagesを有効にした後でワークフローを再実行してください。

## 開発とビルド

```text
.
├─ src/index.template.html             # アプリ本体
├─ app.config.json                     # アプリ名・バージョン・出力設定
├─ dependencies.json                   # ビルド時依存の定義
├─ build-standalone.bat                # Windows用ビルド入口
├─ build-standalone.ps1                # 通常版HTMLの生成
├─ scripts/
│  ├─ release-screenshots.browser.cjs  # リリース用スクリーンショット生成
│  ├─ build-self-extract.ps1           # 自己解凍版の生成
│  ├─ verify-standalone.ps1            # 通常版の検証
│  ├─ verify-self-extract.ps1          # 自己解凍版の検証
│  └─ check-repository.ps1             # リポジトリ全体のチェック
├─ dist/
│  ├─ index.html                       # 通常版
│  └─ index.self-extract.html          # gzip自己解凍版
└─ .github/workflows/
   ├─ build-standalone.yml             # Pull Request時のビルド検証
   ├─ deploy-pages.yml                 # mainからPagesへ自動公開
   └─ release.yml                      # main反映後のタグ・Release作成
```

### Windowsでビルドする

```powershell
.\build-standalone.ps1
```

リポジトリ全体のチェックを含める場合：

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

ビルドでは以下を検証します。

- 未置換のビルドプレースホルダーが残っていないこと
- 外部script / stylesheet / frame / CSS URLが残っていないこと
- CSPに `connect-src 'none'` が含まれること
- 自己解凍ローダーがASCII-onlyであること
- 自己解凍版が通常版と同じfaviconを持つこと
- gzip展開後のHTMLが通常版とバイト単位で一致すること

## プライバシーと通信防止

Signal Screenはローカルファーストで動作します。

- 入力した文字とQR内容はブラウザー内だけで処理
- 設定と保存した合図の保存先はLocalStorageのみ
- QR生成も端末内で完結
- アカウント登録なし
- Analytics / Telemetryなし
- サーバーAPIなし
- CSPに `connect-src 'none'` を指定

GitHub Pages版では最初のHTMLを取得する通信は発生しますが、Signal Screenのランタイム処理から入力内容を外部へ送信することはありません。クリップボードの読み取りは「貼り付け」を押したときだけ行います。ブラウザーの保存データは、端末側の操作やブラウザーの設定によって消える場合があります。

## 安全上の注意と制限事項

- 点滅する画面は、人によって不快感や体調への影響を起こす場合があります。光に敏感な方の近くでは使用しないでください。
- Signal Screenは高頻度ストロボを提供しませんが、安全性を保証する医療機器ではありません。
- **認証済みの緊急信号、道路標識、航行信号、航空信号などの代替ではありません。**
- ブラウザーから端末の画面輝度を変更することはできません。屋外では端末側で明るさを調整してください。
- Fullscreen APIとScreen Wake Lockは、ブラウザーやセキュリティコンテキストによって利用できない場合があります。
- QR入力はUTF-8で300 bytesまでです。情報量が増えるほどQRコードが細かくなり、離れた場所から読み取りにくくなります。
- QRコードの色変更や点滅には対応していません。読み取りやすさを優先した仕様です。
- LocalStorageを削除すると保存していた文字、QR内容、合図、設定も消えます。

## 使用ライブラリ

| ライブラリ | バージョン / 由来 | ライセンス | 用途 |
| --- | --- | --- | --- |
| QRCode for JavaScript | Kazuhiko Arase / `qrcode-terminal` 0.12.0由来のソースを改変 | MIT | QRコード生成 |

QR生成コードはUTF-8入力へ対応するため一部変更してHTML内へ直接内包しています。ランタイムに外部ライブラリを読み込むことはありません。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を確認してください。

## コントリビューション

バグ報告や機能提案はIssueからお願いします。開発への参加方法は [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

## ライセンス

Copyright © 2026 ttomohisa

このプロジェクトは [MIT License](LICENSE) で公開されています。
