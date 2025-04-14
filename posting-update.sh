#!/bin/env bash
set -euo pipefail

# 定数の定義
BASE_DIR=~/poster-map/
DATA_DIR=public/data
GCS_URL="https://script.google.com/macros/s/---/exec" # GASのURLを指定

# メイン処理
cd "$BASE_DIR"

git pull

# 更新したときだけ実施（市町村ブロックのリストをダウンロード）
# curl -sL "$GCS_URL?sheetName=postingblock" > "$DATA_DIR/conquerblock.csv"

# posting map data download
curl -sL "$GCS_URL?sheetName=postingmapdata" > "$DATA_DIR/conquerlist.csv"

# ポスティングデータをblockごとに分割
python3 bin/conquercsv2json_small.py "$DATA_DIR/conquerlist.csv" "$DATA_DIR/conquerblock.csv" "$DATA_DIR"

# エリアごとに集計
python3 bin/summarize_areatotal.py "$DATA_DIR/conquerareatotal.json"

# Git 操作
git add -N .

if ! git diff --exit-code --quiet
then
    git add .
    git commit -m "Posting Data Update"
    git push
#    #source .env
#    #npx netlify-cli deploy --prod --message "Deploy" --dir=./public --auth $NETLIFY_AUTH_TOKEN
fi
