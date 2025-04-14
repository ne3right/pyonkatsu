# エリアリストをjsonに変換
# area_id,area_name,area_block
# python3 bin/arealistcsv2json_small.py public/data/arealist.csv public/data/arealist.json

import pandas as pd
import sys
import os

def main(input_path, output_path):

    inputdata = pd.read_csv(input_path)
    inputdata = inputdata[['area_id', 'area_name', 'area_block']] # area_id, area_name,area_blockだけにする
    inputdata = inputdata.set_index('area_id')
    json_data = inputdata.to_json(output_path, orient='index',force_ascii=False)
    print(f"File saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]  # public/data/arealist.csv
    output_path = sys.argv[2] # public/data/arealist.json

    main(input_path, output_path)
