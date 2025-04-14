import pandas as pd
import json
import sys

# CSVファイルを読み込む
all_df = pd.read_csv('public/data/conquerlist.csv')
arealist_df = pd.read_csv('public/data/conquerblock.csv')

# 各地域ごとのtotal_postingを合計
total_posting_by_area = all_df.groupby('area_name')['total_posting'].sum().reset_index(name='total_posting_sum')

# 地域IDのマッピング作成
area_mapping = dict(zip(arealist_df['area_name'], arealist_df['area_id']))
all_areas = pd.DataFrame(area_mapping.items(), columns=['area_name', 'area_id'])

# 地域情報とtotal_postingの合計を結合
merged_df = all_areas.merge(total_posting_by_area, on='area_name', how='left')

# 結果がNaNの場合を0に設定
merged_df['total_posting_sum'] = merged_df['total_posting_sum'].fillna(0)

# 必要な列を選んで地域IDでソート
merged_df = merged_df[['area_id', 'total_posting_sum']].sort_values(by='area_id')

# 辞書に変換（NaNを取り除くために数値型に変換）
result_dict = {int(row['area_id']): float(row['total_posting_sum']) for _, row in merged_df.iterrows()}

# totalの合計も計算
total_posting_sum = float(all_df['total_posting'].sum())
result_dict['total'] = total_posting_sum

# 出力ファイルのパスを取得
output_file_path = sys.argv[1]

# JSONファイルに保存
with open(output_file_path, 'w', encoding='utf-8') as f:
    json.dump(result_dict, f, ensure_ascii=False, indent=2)

print(f"Results have been written to {output_file_path}")
