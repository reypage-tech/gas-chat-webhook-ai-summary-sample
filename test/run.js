// node test/run.js : checks the script in a mock environment (Google services and the AI API are fakes, all data is fictional, no network).
var m = require('./mock_gas.js'), path = require('path');
var SRC = path.join(__dirname, '..', 'src'), FILES = ['Config.gs', 'Lib.gs', 'Main.gs'], API = 'https://api.anthropic.com/v1/messages';
var calls = [];
function fakeApi(url, o) {
  calls.push(o); var body = JSON.parse(o.payload), txt = body.messages[0].content;
  if (/FAIL/.test(txt)) return { code: 529, body: JSON.stringify({ type: 'error', error: { message: 'overloaded' } }) };
  return { code: 200, body: JSON.stringify({ model: body.model, content: [{ type: 'text', text: 'MOCK SUMMARY: delivery moved to Friday' }], usage: { input_tokens: 40, output_tokens: 9 } }) };
}
var props = { WEBHOOK_SECRET: 's3', ANTHROPIC_API_KEY: 'test-key-not-real' };
var t = m.runner(), w = m.world({ props: props, http: { [API]: fakeApi } }), c = m.load(SRC, FILES, w);
var post = function (cx, key, p) { return JSON.parse(cx.doPost({ parameter: { key: key }, postData: { contents: JSON.stringify(p) } }).text); };
var cw = function (id, body, type) { return { webhook_setting_id: '1', webhook_event_type: type || 'message_created', webhook_event_time: 1790000000, webhook_event: { message_id: id, room_id: 111, account_id: 222, body: body, send_time: 1790000000 } }; };
t.ok('a wrong secret is refused, nothing is written and the API is not called', post(c, 'x', cw('m1', 'hi')).ok === false && !w.sheets.Summaries && calls.length === 0);
var r = post(c, 's3', cw('m1', '[To:333] Sample Co: the delivery date has moved from Wednesday to Friday.')).result;
var row = w.sheets.Summaries.__rows()[1];
t.ok('a message is summarized and written with time, room, sender, original and summary', r.added === 1 && row[1] === '111' && row[2] === '222' && row[4] === 'MOCK SUMMARY: delivery moved to Friday' && row[6] === '40/9');
t.ok('Chatwork tags are removed before sending', row[3].indexOf('[To:') < 0 && JSON.parse(calls[0].payload).messages[0].content.indexOf('[To:') < 0);
t.ok('the API key is sent only as a header, taken from Script Properties', calls[0].headers['x-api-key'] === 'test-key-not-real' && calls[0].payload.indexOf('test-key-not-real') < 0);
t.ok('the same message ID sent again is not summarized twice', post(c, 's3', cw('m1', 'again')).result.dup === 1 && calls.length === 1);
t.ok('an API error goes to the error log', post(c, 's3', cw('m2', 'FAIL please')).result.errors === 1 && /529/.test(w.sheets['Error log'].__rows()[1][2]));
t.ok('other event types are ignored', post(c, 's3', cw('m3', 'x', 'room_created')).result.added === 0 && calls.length === 2);
var w2 = m.world({ props: { WEBHOOK_SECRET: 's3' }, http: { [API]: fakeApi } }), c2 = m.load(SRC, FILES, w2); var n = calls.length;
t.ok('without ANTHROPIC_API_KEY nothing is sent and the reason is logged', post(c2, 's3', cw('m4', 'hello')).result.errors === 1 && calls.length === n && /not set/.test(w2.sheets['Error log'].__rows()[1][2]));
var long = 'a'.repeat(5000); c.buildRequest_(long, c.CONFIG);
t.ok('very long messages are cut before sending', c.buildRequest_(long, c.CONFIG).messages[0].content.length < 4200);
post(c, 's3', cw('m5', '=HYPERLINK("x") please check'));
t.ok('a value that looks like a formula is stored as text', String(w.sheets.Summaries.__rows()[2][3]).charAt(0) === "'");
m.dump(w); t.done();
