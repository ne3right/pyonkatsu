import pandas as pd
import json  # Pythonの標準JSONライブラリをインポート
import sys
import os

# CSVファイルのパス
csv_file = "groupstatus.csv"
json_file = "groupstatus.json"

def main(input_path, output_path):
    # CSVを読み込む
    df = pd.read_csv(input_path)
    df = df.fillna("")

    # groupnameごとにグループ化して辞書に変換
    grouped_data = df.groupby("groupname").apply(lambda x: x.drop(columns=["groupname"]).to_dict(orient="records")).to_dict()

    # groupstatusを取り除いた状態でJSONに変換
    # grouped_dataの中身がそのままJSONのトップレベルに来るように変更
    json_output_path = os.path.join(output_path, 'groupstatus.json')
    with open(json_output_path, "w", encoding="utf-8") as file:
        json.dump(grouped_data, file, indent=2, ensure_ascii=False)  # groupstatusを省略
    print(f"File saved to {json_output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    main(input_path, output_path)
