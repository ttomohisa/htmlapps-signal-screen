# Signal Screen

[English README](README.md)

スマホやPCの画面いっぱいに、文字・矢印・色・QRコード・SOSパターンを大きく表示する単一HTMLアプリです。待ち合わせ、イベント誘導、旅行、緊急時の補助的な合図などに使えます。

## 主な機能

- 最大60文字の巨大表示
- URLや短いテキストを端末内でQRコード化して大きく表示
- QRは黒・白固定＋4モジュールの余白で読み取りやすさを優先
- 「ここです」「助けて」「SOS」「止まって」と4方向矢印のプリセット
- 黒・白・赤・黄・緑・青の背景色
- 背景に応じた白/黒の自動コントラスト
- 点滅なし / ゆっくり / ビーコン / SOSパターン
- 点滅初回の安全確認
- `prefers-reduced-motion` 有効時は点滅を自動無効化
- Fullscreen API / Screen Wake Lock（対応環境のみ）
- 日本語 / English
- LocalStorageへの自動保存
- 外部通信なし、アカウント不要

## 使い方

1. 「文字・矢印」または「QR」を選びます。
2. 文字モードでは文字/プリセット・背景色・必要な場合だけ点滅を設定します。
3. QRモードではURLや短いテキストを入力します。QRは端末内だけで生成され、点滅は使用しません。
4. 「全画面で表示」を押します。
5. 表示中は画面をタップして操作UIを表示/非表示できます。

## 注意

点滅する画面は、人によって不快感や体調への影響を起こす場合があります。光に敏感な方の近くでは使用しないでください。Signal Screenは高頻度ストロボを提供せず、端末の `prefers-reduced-motion` も尊重します。

ブラウザーから端末の画面輝度は変更できません。Signal Screenは認証済みの緊急信号・交通標識・航行信号の代替ではありません。

## ビルド

Windows PowerShell 5.1 で:

```powershell
.\build-standalone.ps1
```

または:

```powershell
.\scripts\check-repository.ps1
```

通常版 `dist/index.html` と自己解凍版 `dist/index.self-extract.html` を生成します。最新テンプレートの仕様に合わせ、自己解凍ローダーはASCII-onlyで、通常版のfaviconを自動継承します。

## プライバシー

入力した文字と設定はブラウザー内だけで処理されます。CSPは `connect-src 'none'` で、ランタイム通信・解析・テレメトリはありません。

## License

MIT License
