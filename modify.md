# デザイン最新化の変更内容（引き継ぎ資料）

notelist（https://github.com/licodeenar/notelist）で実施したデザイン刷新を
note-updated に移植したときの変更内容のまとめ。
同系統の別ツール（GAS + 静的HTML構成）に同じ最新化を適用する際の手順書として使う。

参考実装: `notelist` リポジトリ（移植元）/ `note-updated/docs` 配下（移植済みの実例）

## 変更の概要

| 対象 | 変更内容 |
|------|----------|
| style.css | 全面リニューアル（CSS変数テーマ・カード型UI・スピナー） |
| script.js | 結果表示をテーブル → カード型リスト（ul/li）に変更、ローディングをGIF → CSSスピナーに変更 |
| index.html | 説明文をチェックマーク付きリスト化、不要な `<br>` 削除、ヘッダーアイコンに alt 追加 |

ロジック（API呼び出し・パラメータ・エラー判定・JSON表示モード）は変更しない。
GAS側の変更も不要（レスポンス項目はそのまま使う）。

## 1. style.css の置き換え

旧CSS（メディアクエリ3分割・テーブル装飾ベース）を全面的に置き換える。
`note-updated/docs/assets/style.css` をベースにコピーし、ツール固有の結果表示部分だけ調整する。

新デザインの骨子:

- `:root` のCSS変数でテーマ定義（アクセント `#2cb696`、背景 `#f6f8f9`、カード白、角丸14px など）
- フォントは Noto Sans JP（Google Fonts の css2 でimport）
- `header` は flex で右寄せ、白背景 + 下ボーダー、アイコン36pxの円形
- `main` は `max-width: 640px` 中央寄せ（メディアクエリの3分割は廃止。h1のサイズのみ `@media (min-width: 671px)` で拡大）
- 入力フォーム `#setting` は白カード（角丸 + シャドウ）
- テキスト入力 `.cp_input` は背景グレー・ボーダーレス、focusでアクセント色ボーダー
- ボタン `.cp_button` は幅100%・ピル型・hover/active/disabled/focus-visible の状態スタイルあり
- ラジオ・チェックボックスはアクセント色のカスタムコントロール
- 説明文 `.cp_explain` は `ul` 想定で、`li::before` に緑のチェックマーク `✓`

結果表示（カード型リスト）:

- `.note_count` … リスト上部の「○人」表示
- `.note_list` … `ul`。白カード（角丸 + シャドウ）、`overflow: hidden`
- `.note_item + .note_item` … 行間の区切りボーダー
- `.note_item a` … flexの行レイアウト。hoverで `--accent-light` 背景
- `.note_avatar` … 40px円形のプロフィール画像（`object-fit: cover`）
- `.note_body` / `.note_data_name` / `.note_data_id` … 名前とID（ellipsisで省略）
- 右端の要素はツール固有（後述）

ステータス・ローディング:

- `.note_status` … 「取得できませんでした」等のメッセージ用
- `.note_loading::after` … CSSアニメーションのスピナー（`@keyframes spin`）。waiting.gif は不要になる

### ツール固有部分（行の右端）

リスト行の右端に出す情報はツールごとに違うので、ここだけ作り変える:

- notelist … `.note_index`（連番）と `.note_follow`（フォロー状態アイコン）
- note-updated … `.note_updated`（`b` で日数差、下に最終更新日）

`margin-left: auto; flex: none;` で右寄せするパターンは共通。

## 2. script.js の修正

`drawTable()`（結果描画）と、ローディング表示の2箇所のみ変更する。

### ローディング表示

```js
// 旧
document.getElementById(resultDispId).innerHTML = '<img src="img/waiting.gif"><br>しばらく時間がかかります。。。';
// 新
document.getElementById(resultDispId).innerHTML = '<div class="note_status note_loading">しばらく時間がかかります。。。</div>';
```

### エラー表示

```js
// 旧
document.getElementById(elementId).innerHTML = '情報を取得できませんでした。';
// 新
document.getElementById(elementId).innerHTML = '<div class="note_status">情報を取得できませんでした。</div>';
```

### 結果リスト描画

`<table>` 生成を `<ul class="note_list">` 生成に置き換える。note-updated での実例:

```js
html = '<div class="note_count">' + obj.length + '人</div><ul class="note_list">';
for (let i = 0; i < obj.length; i++) {
    // …ツール固有の値の整形…
    html += '<li class="note_item">' +
        '<a href="' + obj[i].url + '" target="_blank" rel="noopener">' +
        '<img class="note_avatar" src="' + obj[i].userProfileImagePath + '" alt="">' +
        '<span class="note_body">' +
        '<span class="note_data_name">' + obj[i].nickname + '</span>' +
        '<span class="note_data_id">@' + obj[i].urlname + '</span>' +
        '</span>' +
        '<span class="note_updated"><b>' + daydiff + '</b>' + lastupdated + '</span>' + // ← 右端はツール固有
        '</a></li>';
}
html += '</ul>';
```

ポイント:

- リンクには `rel="noopener"` を付ける
- APIが `userProfileImagePath` を返さないツールの場合は、イニシャル表示にフォールバックする
  （notelist の `assets/script.js` 参照。`userProfileImagePath` の有無で `<img class="note_avatar">` と
  `<span class="note_avatar note_avatar_initial">` を出し分け、CSSに `.note_avatar_initial` を追加）
- JSON表示モード（`note_data_json`）は変更不要

## 3. index.html の修正

- 説明文を `<div class="cp_explain">…<br>…</div>` から `<ul class="cp_explain"><li>…</li></ul>` に変更
  （行頭の「・」は削除。チェックマークはCSSが付ける）
- レイアウト調整用の `<br>`（説明文の後、ラジオボタンの後など）を削除
  （新CSSはmarginで間隔を取るため不要）
- ヘッダーアイコンの `<img>` に `alt` 属性を追加

フォーム構造（id・name・onclick）は変更しない。

## 4. バグ修正（script.js）

デザイン移植とあわせて、以下の不具合を修正した。新しいツールにも同様に適用すること。
（notelist の `assets/script.js` / `assets/script_mfollow.js`、note-updated の `docs/assets/script.js` が修正済みの実例）

### 4-1. XSS対策（最重要）

APIレスポンスの値（`nickname` / `urlname` / `url` / `userProfileImagePath` など）を
エスケープせずに `innerHTML` へ挿入していた。ニックネーム等にHTML文字が含まれると
表示崩れやスクリプト注入の余地がある。

エスケープ関数を追加し、HTMLに埋め込むすべての外部由来の値に適用する:

```js
// HTMLに埋め込む値をエスケープ（XSS対策）
function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}
```

- リスト描画の各項目: `escapeHtml(obj[i].nickname)` のように包む（href / src 属性値も対象）
- JSON表示モードの生レスポンスも対象: `escapeHtml(jasons)`

### 4-2. 入力値のURLエンコード

入力されたIDをそのままクエリ文字列に連結していたため、`&` や `=`、日本語を含む入力で
リクエストが壊れる。クエリ／POSTパラメータに載せる値はすべて `encodeURIComponent()` で包む。

```js
'/exec?id=' + encodeURIComponent(noteId) + '&key=' + encodeURIComponent(form.note_key.value)
```

**注意（POST送信のツール）**: notelist の mutual_follow（POSTでID/パスワードを送る）では、
GAS側がエンコード前提で値を受け取らないため、`encodeURIComponent()` を適用すると
記号を含むパスワードでログインエラーになる。POSTでGASに送るツールに適用する場合は、
GAS側がパラメータをどうパースしているかを確認してから適用すること
（確認できない場合はエンコードしない＝従来挙動を維持する）。

### 4-3. JSON.parse の例外処理

APIが不正なレスポンス（HTMLのエラーページ等）を返すと `JSON.parse()` が例外を投げ、
ローディング表示のまま止まっていた。try/catchで囲み、失敗時はエラーメッセージを表示する。

```js
try {
    obj = JSON.parse(jasons);
} catch (e) {
    document.getElementById(elementId).innerHTML = '<div class="note_status">情報を取得できませんでした。</div>';
    return;
}
```

### 4-4. 未入力ガード

IDが未入力でもAPIリクエストが飛んでいた。実行前に `trim()` してチェックする。

```js
let noteId = form.note_id.value.trim();
if (noteId === '') {
    document.getElementById(resultDispId).innerHTML = '<div class="note_status">noteのIDを入力してください。</div>';
    return;
}
```

## 5. 適用後の確認

- 取得実行 → スピナー表示 → カード型リストが表示されること
- エラー時（存在しないID等）に `.note_status` のメッセージが出ること
- 「JSON形式で表示する」が従来どおり動くこと
- スマホ幅（〜640px）でレイアウトが崩れないこと
- waiting.gif が未使用になる（ファイル削除は任意）
- ID未入力で実行 → 「noteのIDを入力してください。」が表示されること
- `&` や日本語を含むIDで実行してもリクエストが壊れないこと
- ニックネームに `<` `>` 等を含むユーザがいても表示が崩れないこと
