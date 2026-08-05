# 駒の字のフォント

盤と駒台に描く駒の文字は **Shippori Mincho Bold** を使っています。
端末に入っているフォントに左右されず、オフラインでも同じ見た目になるように、
駒に使う14文字（歩香桂銀金角飛玉と杏圭全馬龍）だけを切り出して
`index.html` の `@font-face` に woff2 として埋め込んであります（3.7KB）。

- 書体: Shippori Mincho — https://github.com/fontdasu/ShipporiMincho
- Copyright 2021 The Shippori Mincho Project Authors
- ライセンス: SIL Open Font License 1.1（全文は `OFL.txt`）
- Reserved Font Name の指定はありません

作りなおすときは `tools/make-koma-font.sh` を実行して、
出力された `koma.woff2.b64` の中身を `index.html` の
`@font-face` の `url(data:font/woff2;base64,...)` に貼り替えます。
