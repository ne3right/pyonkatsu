# python3 bin/signboard2json_small.py public/data/signboard.csv public/data/

import pandas as pd
import sys
import os

def main(input_path, output_path):
    data = pd.read_csv(input_path)
    data = data.fillna("")
    if 'lastupdate' in data.columns:
        data['lastupdate'] = data['lastupdate'].astype(str)  # 文字列に変換

    # groupid ごとにデータを分割して保存
    grouped = data.groupby('groupid')
    
    signboard_dir = os.path.join(output_path, "signboard")
    os.makedirs(signboard_dir, exist_ok=True)
    
    for group_id, group_data in grouped:
        output_file = os.path.join(signboard_dir, f'{group_id}.json')
        group_data.drop(columns=['groupid'], inplace=True)
        group_data.to_json(output_file, orient='records', force_ascii=False)
        print(f"File saved to {output_file}")

    json_output_path = os.path.join(signboard_dir, 'all.json')
    data.to_json(json_output_path, orient='records', force_ascii=False)
    print(f"File saved to {json_output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    main(input_path, output_path)
