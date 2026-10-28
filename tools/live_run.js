// Usage: ANTHROPIC_API_KEY=... node tools/live_run.js  (makes 3 real API calls; fictional messages)
// Live run: same src/ code via mock_gas, but UrlFetchApp does a real HTTPS call (key from env only, never printed).
var m = require('../test/mock_gas.js'), cp = require('child_process'), path = require('path');
var SRC = path.join(__dirname, '..', 'src');
var helper = 'let d="";process.stdin.on("data",c=>d+=c).on("end",async()=>{const o=JSON.parse(d);o.headers["x-api-key"]=process.env.ANTHROPIC_API_KEY;const r=await fetch(o.url,{method:"POST",headers:Object.assign({"content-type":"application/json"},o.headers),body:o.payload});process.stdout.write(JSON.stringify({code:r.status,body:await r.text()}))})';
var w = m.world({ props: { WEBHOOK_SECRET: 's', ANTHROPIC_API_KEY: '__FROM_ENV__' } });
w.globals.UrlFetchApp = { fetch: function (url, o) {
  var h = Object.assign({}, o.headers); delete h['x-api-key'];
  var r = JSON.parse(cp.execFileSync('node', ['-e', helper], { input: JSON.stringify({ url: url, headers: h, payload: o.payload }) }).toString());
  return { getResponseCode: function () { return r.code; }, getContentText: function () { return r.body; } };
} };
var c = m.load(SRC, ['Config.gs', 'Lib.gs', 'Main.gs'], w);
var msgs = [
  '[To:222] サンプル商事の山田です。明日の打ち合わせは14時から15時に変更をお願いできますか。資料は前日までに送ります。',
  '請求書の件です。10月分は金額を修正したものを再発行しました。旧版は破棄してください。',
  '来週の納品ですが、部品の入荷が遅れていて、水曜から金曜にずれる見込みです。確定したらまた連絡します。'
];
msgs.forEach(function (t, i) {
  var at = new Date();
  var res = JSON.parse(c.doPost({ parameter: { key: 's' }, postData: { contents: JSON.stringify({ webhook_event_type: 'message_created', webhook_event: { message_id: 'live' + (i + 1), room_id: 900, account_id: 901, body: t } }) } }).text);
  console.log(JSON.stringify({ at: at.toISOString(), res: res }));
});
console.log(JSON.stringify(w.sheets.Summaries.__rows()));
console.log(JSON.stringify((w.sheets['Error log']||{__rows:()=>[]}).__rows()));
