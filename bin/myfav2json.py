import pandas as pd
import json
import os
import sys

def main(input_csv, output_dir):
    # 入力CSV読み込み
    df = pd.read_csv(input_csv)

    # 出力ディレクトリ作成
    os.makedirs(output_dir, exist_ok=True)

    # 都道府県一覧とインデックスマップ
    pref_list = df["pref"].unique()
    pref_index_map = {pref: str(i + 1) for i, pref in enumerate(pref_list)}

    # ---------- prefs.json（都道府県ごとの合計） ----------
    prefs_data = {}
    for i, pref in enumerate(pref_list, start=1):
        pref_id = str(i)
        df_pref = df[df["pref"] == pref]
        total_sum = int(df_pref["count"].sum())

        members = df_pref.groupby("name")["count"].sum().reset_index()
        members_list = members.to_dict(orient="records")

        prefs_data[pref_id] = {"pref": pref, "sum": total_sum, "members": members_list}

    prefs_path = os.path.join(output_dir, "prefs.json")
    with open(prefs_path, "w", encoding="utf-8") as f:
        json.dump(prefs_data, f, ensure_ascii=False, indent=2)
    print(f"[出力] {prefs_path}")

    # ---------- 各 prefX.json と prefX_cityY.json ----------
    for pref in pref_list:
        pref_id = pref_index_map[pref]
        df_pref = df[df["pref"] == pref]
        city_list = df_pref["city"].unique()

        city_data = {}
        for j, city in enumerate(city_list, start=1):
            city_id = str(j)
            df_city = df_pref[df_pref["city"] == city]
            city_sum = int(df_city["count"].sum())

            members = df_city.groupby("name")["count"].sum().reset_index()
            members_list = members.to_dict(orient="records")

            city_data[city_id] = {"city": city, "sum": city_sum, "members": members_list}

            # prefX_cityY.json の作成
            address_list = df_city["address"].unique()

            address_data = {}
            for k, address in enumerate(address_list, start=1):
                address_id = str(k)
                df_address = df_city[df_city["address"] == address]
                address_sum = int(df_address["count"].sum())

                members = df_address.groupby("name")["count"].sum().reset_index()
                members_list = members.to_dict(orient="records")

                address_data[address_id] = {"address": address, "sum": address_sum, "members": members_list}

            city_json_path = os.path.join(output_dir, f"pref{pref_id}_city{j}.json")
            with open(city_json_path, "w", encoding="utf-8") as f:
                json.dump(address_data, f, ensure_ascii=False, indent=2)
            print(f"[出力] {city_json_path}")

        # prefX.json の作成
        pref_json_path = os.path.join(output_dir, f"pref{pref_id}.json")
        with open(pref_json_path, "w", encoding="utf-8") as f:
            json.dump(city_data, f, ensure_ascii=False, indent=2)
        print(f"[出力] {pref_json_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <postingdata.csv> <output_dir>")
        sys.exit(1)

    input_path = sys.argv[1]  # 例: public/data/myfavdata.csv
    output_path = sys.argv[2] # 例: public/data/myfav

    main(input_path, output_path)
