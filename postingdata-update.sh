#!/bin/env bash
set -euo pipefail

# 定数の定義
DATA_DIR=public/data
GCS_URL="https://script.google.com/macros/s/---/exec" # GASのURLを指定

# ポスティングデータをblockごとに分割
python3 bin/postingmapdata2json.py "$DATA_DIR/postingdata.csv" "$DATA_DIR/conquer"
