## ピンマップデータをエリアごとに分割しjsonに出力する
# ピンマップデータ エリア,ピン名称,緯度,経度,ステータス,備考
# all.csv area,name,lat,long,status,note
# エリアリストデータ id(連番),エリア,エリアブロック
# arealist.csv area_id,area_name,area_block
# エリアブロックデータ id(連番),エリア,エリアブロック
# areablock.csv block_id,block_key,block_name

# python3 bin/csv2json_small.py public/data/all.csv public/data/arealist.csv public/data/areablock.csv public/data/

import pandas as pd
import sys
import os

def main(input_path, arealist_path, areablock_path, output_path):
    data = pd.read_csv(input_path)
    arealist = pd.read_csv(arealist_path)
    areablock = pd.read_csv(areablock_path)

    arealist = arealist[['area_id', 'area_name', 'area_block']]
    data.rename(columns={'area': 'area_name'}, inplace=True)

    # ファイルサイズ削減のためarea_nameをarea_idで置換
    merged_data = pd.merge(data, arealist, on='area_name', how='left', suffixes=('', ''))
    final_data = merged_data.copy()[['area_id', 'name', 'lat', 'long', 'status', 'note']]

    area_blocks = dict(zip(areablock['block_key'], areablock['block_name'])) # key valueの形のJSONにする
  
    for block_key, block_name in area_blocks.items():
        block_areas = arealist[arealist['area_block'] == block_name]['area_id']
        filtered_data = final_data[final_data['area_id'].isin(block_areas)]
        
        filtered_output_path = os.path.join(output_path, 'block', f'{block_key}.json')
        filtered_data.to_json(filtered_output_path, orient='records', force_ascii=False)
        print(f"Filtered file saved to {filtered_output_path}")

    json_output_path = os.path.join(output_path, 'all.json')
    final_data.to_json(json_output_path, orient='records', force_ascii=False)
    print(f"File saved to {json_output_path}")

    json_output_path = os.path.join(output_path, 'areablock.json')
    areablock.to_json(json_output_path, orient='records', force_ascii=False)
    print(f"File saved to {json_output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python script.py <input_path> <arealist_path> <block_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    arealist_path = sys.argv[2]
    areablock_path = sys.argv[3]
    output_path = sys.argv[4]

    main(input_path, arealist_path, areablock_path, output_path)
