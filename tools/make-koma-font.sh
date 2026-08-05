#!/bin/sh
# 駒の字の埋め込みフォントを作りなおす。
# Shippori Mincho Bold から駒に使う14文字だけを抜いて woff2 にする。
# 出来た koma.woff2 を base64 にして index.html の @font-face に貼る。
#   pip install fonttools brotli
set -e
SRC=ShipporiMincho-Bold.ttf
[ -f "$SRC" ] || curl -sSLo "$SRC" \
  https://raw.githubusercontent.com/google/fonts/main/ofl/shipporimincho/ShipporiMincho-Bold.ttf
python3 -m fontTools.subset "$SRC" \
  --text="歩香桂銀金角飛玉と杏圭全馬龍" \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize \
  --notdef-outline --drop-tables+=DSIG \
  --output-file=koma.woff2
python3 -c "import base64;print(base64.b64encode(open('koma.woff2','rb').read()).decode())" > koma.woff2.b64
echo "koma.woff2 と koma.woff2.b64 を作りました"
