// その他設定
var replyToken, json

//ポストで送られてくるので、ポストデータ取得
function doPost(e) {
  // 動作確認用のログ出力
  console.log("doPost")

  // LINEBotから送られてきたデータを、プログラムで利用しやすいようにJSON形式に変換する
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];
  console.log(event)

  // メッセージからコマンド抽出
  const extracted = extractCommand(event);
  // 無効なメッセージの場合OKを返す（LINEエラー対応のため)
  if (!extracted) return ContentService.createTextOutput("OK");

  const { command, args, replyToken } = extracted;

  // 命令が存在する場合は対応する関数を実行
  if (COMMANDS[command]) {
    const responseText = COMMANDS[command](args);
    messages= reply_message(responseText);
  } else {
    messages= reply_message("こんにちは。ぴょん活報告BOTです。コマンドで命令してもらうと答えを返します。まず「ぴょん活スタート」とだけ話しかけてみてください");
  }

  // line-bot-sdk-gas のライブラリを利用しています ( https://github.com/kobanyan/line-bot-sdk-gas )
  const linebotClient = new LineBotSDK.Client({ channelAccessToken: CHANNEL_ACCESS_TOKEN });

  // メッセージを返信
  try{
    linebotClient.replyMessage(replyToken, messages);
  }catch(e){
    // うまく動作しない場合は、エラーが発生していないか確認してみましょう
    console.log(e)
  }
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

// 返信用にメッセージを成形
function reply_message(text) {
  return [{'type':'text', 'text': text}]
}

// メッセージからコマンドを抽出する関数
function extractCommand(event) {
  if (!event || event.type !== "message" || event.message.type !== "text") {
    return null;
  }
  console.log(event.message.text)

  // 各行の前後空白だけを削除、空行は残す
  const messageLines = event.message.text
    .split(/\r?\n/)
    .map(line => line.trim());

  const command = messageLines[0]; // 1行目の命令を取得
  const args = messageLines.slice(1); // 2行目以降の引数を取得
  return {
    command,
    args,
    replyToken: event.replyToken
  };
}
