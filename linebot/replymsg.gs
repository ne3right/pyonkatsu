// ぴょん活スタート：コマンド一覧を表示
// 使い方：マニュアル表示
// 地図：マップURLを表示
// ぴょん活報告：ぴょん活報告を行うコマンド

// 命令の定義（1行目）
const COMMANDS = {
  "ぴょん活スタート": handleStart,
  "使い方": handleManual,
  "地図": handleMap,
  "ぴょん活報告": handlePosting,
  "住所検索": handleSearch,
};

// ポスティングマップ塗りつぶしコマンド
function handlePosting(args) {
  // 空チェック
  if (!Array.isArray(args) || args.length === 0 || args[0].trim() === "") {
    return "⚠️ 空のメッセージです。\nぴょん活報告\n住所(必須)\n枚数(必須)\n備考（任意）\nを改行で区切ってメッセージを送ってください";
  }

  // 最低限 住所 + 枚数 の2行は必要
  if (args.length < 2 || args[1].trim() === "") {
    return "❌ エラー: 2行目にポスティング枚数を入力してください（半角数字）";
  }

  const messages = mapDataHandring(args);
  console.log("📌 messages:"+ messages);
  return messages;
}

// 住所検索
function handleSearch(args) {
  return "https://uedayou.net/loa/\n";
}
/*
function handleSearch(args) {
  if (args.length === 0 || args[0].trim() === "") {
    return "⚠️ 空のメッセージです。\n住所検索\n地名(必須)\nを改行で区切ってメッセージを送ってください";
  }
  const messages = addressSearchHandring(args);
  console.log("📌 messages:"+ messages);
  return messages;
}
*/

// 🟢 コマンド一覧
function handleStart(args) {
  return "一行目に書いたキーワードで自動処理を行います。\n"
       + "✨利用できるコマンド一覧✨\n"
       + "----------------------\n"
       + "地図\n\n"
       + "ぴょん活報告\n"
       + "住所検索\n"
       + "----------------------\n"
       + "メッセージの1行目にコマンドを書いておくってください\n\n"
       + "詳しくはマニュアルページをご覧ください\n"
       + "https://pyonkatsu.netlify.app/linebot/";
}

function handleManual(args) {
  return "📌 使い方マニュアル:\n"
       + "ぴょん活報告\n"
       + "ポスティングの報告をして地図を塗ろう！\n"
       + "LINEのメッセージに次のように書いて送ってね\n"
       + "--------------------------\n"
       + "ぴょん活報告\n"
       + "東京都千代田区永田町1丁目\n"
       + "500\n"
       + "マンション○△に投函済み\n"
       + "--------------------------\n"
       + "詳しくはマニュアルページをご覧ください\n"
       + "https://pyonkatsu.netlify.app/linebot/";
}

function handleMap(args) {
  return "https://pyonkatsu.netlify.app/\n";
}

