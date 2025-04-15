function mapDataHandring(args) {
  // 1行目 = 住所, 2行目=枚数 3行目以降=メモ、備考
  const addressText = args[0].trim();
  const leafsCount = args[1].trim();
  const note = args.slice(2).map(line => line.trim()).join(" ");

  console.log(`📌 住所: ${addressText} 📌 枚数: ${leafsCount} 📌 備考: ${note}`);

  //数値チェック
  const num = Number(leafsCount);
  if (!Number.isFinite(num)) {
    return "❌ エラー: ポスティング枚数は半角数字で書いてください";
  }

  const address = searchAddressfromOpenAddress(addressText); // pref=東京都,city=千代田区,address=永田町1丁目
  console.log("address:" + JSON.stringify(address, null, 2));

  if (address?.error) {
    const reply = `❌ ${address.error}`;
    logResult(addressText, leafsCount, note, "住所検索エラー", reply);
    return reply;
  }

  let result = "";
  let reply = "";

  if(address) {
    const currentDate = getCurrentDate();
    const addRow = [currentDate, address.pref, address.city, address.town, leafsCount, note]; // 実績値を追加
    const dataSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET_NAME); // シートを取得
    dataSheet.appendRow(addRow);

    reply = `✅ 住所「${addressText}」枚数「${leafsCount}」のぴょん活を報告しました。}`;
    result = "住所登録あり"; // 住所登録があった場合
  } else {
    reply = `❌ ${addressText}は登録されていません。オープンアドレスデータを検索して確認してください。丁目は半角数字で書いてください。\nまれにマップの住所データが古い場所もあります。`;
    result = "住所登録なし";
  }

  logResult(addressText, leafsCount, note, result, reply);
  return reply;
}

function logResult(addressText, leafsCount, note, result, reply) {
  const currentTime = getCurrentDateTime();
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOG_SHEET_NAME);
  const newRow = [currentTime, addressText, leafsCount, note, result, reply];
  sheet.appendRow(newRow);
}

function searchAddressfromOpenAddress(addressText) {
  const url = `https://uedayou.net/loa/${encodeURIComponent(addressText)}.json`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      return { error: "住所データの取得に失敗しました。URLが存在しないか、サーバーエラーの可能性があります。" };
    }

    const json = JSON.parse(response.getContentText());
    const topKey = Object.keys(json)[0];
    const record = json[topKey];

    const getValue = (key) => {
      const item = record[key];
      return item && item[0] && item[0].value ? item[0].value : null;
    };

    const pref = getValue("http://imi.go.jp/ns/core/rdf#都道府県");
    const cityBase = getValue("http://imi.go.jp/ns/core/rdf#市区町村");
    const ward = getValue("http://imi.go.jp/ns/core/rdf#区");
    const town = getValue("http://imi.go.jp/ns/core/rdf#町名");
    const chome = getValue("http://imi.go.jp/ns/core/rdf#丁目");
    const hasPart = record["http://purl.org/dc/terms/hasPart"];

    // Level 5 (番地) は hasPart がない時とする
    if (!hasPart) {
      return { error: "番地を除いて入力してください。" };
    }

    // hasPart の全てが URI で、すべて "〇丁目" で終わる場合はエラー
    const allChomeOnly = hasPart.every(part => {
      return part.type === "uri" && /[0-9一二三四五六七八九十]+丁目$/.test(part.value);
    });

    if (allChomeOnly) {
      return { error: "範囲が広すぎます。丁目まで入力してください。" };
    }

    // 区がある場合は市区町村に統合
    const city = ward ? `${cityBase}${ward}` : cityBase;

    // 都道府県だけの場合は弾く
    if (pref && !city && !town) {
      return { error: "範囲が広すぎます。" };
    }

    // 都道府県 + 市区町村だけの場合は弾く
    if (pref && city && !town) {
      return { error: "範囲が広すぎます。" };
    }

    // 都道府県 + 市区町村 + 町名がある場合は返す
    if (pref && city && town) {
      const fullTown = chome ? `${town}${chome}丁目` : town;
      return {
        pref: pref,
        city: city,
        town: fullTown
      };
    }

    return { error: "住所データの構造が不完全です。" };
  } catch (e) {
    Logger.log(`Error: ${e}`);
    return { error: `住所検索中にエラーが発生しました（${e.message}）` };
  }
}

function getCurrentDateTime() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");
}

function getCurrentDate() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd");
}

