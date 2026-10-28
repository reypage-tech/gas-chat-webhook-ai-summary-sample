/** Pure logic, no Google services (covered by the tests). */
/** Reads a Chatwork webhook (message_created / mention_to_me). Returns [] for other events. */
function extractChatwork_(json) {
  var ev = json && json.webhook_event; if (!ev || !ev.body) return [];
  var type = json.webhook_event_type;
  if (type !== 'message_created' && type !== 'mention_to_me') return [];
  return [{ id: String(ev.message_id), room: String(ev.room_id), from: String(ev.account_id || ev.from_account_id || ''), text: String(ev.body) }];
}
/** Removes Chatwork tags such as [To:123] or [info]...[/info] markers before summarizing. */
function cleanText_(text) { return String(text).replace(/\[\/?[a-zA-Z]+(?::[^\]]*)?\]/g, ' ').replace(/\s+/g, ' ').trim(); }
/** Builds the Messages API request body. */
function buildRequest_(text, cfg) {
  var t = text.length > cfg.maxInputChars ? text.slice(0, cfg.maxInputChars) : text;
  return { model: cfg.model, max_tokens: cfg.maxTokens, messages: [{ role: 'user', content: cfg.prompt + '\n\n' + t }] };
}
/** Reads the summary and token usage out of a Messages API response. */
function parseResponse_(code, body) {
  var j; try { j = JSON.parse(body); } catch (e) { return { ok: false, error: 'HTTP ' + code + ' (not JSON)' }; }
  if (code !== 200) return { ok: false, error: 'HTTP ' + code + ': ' + ((j.error && j.error.message) || 'error') };
  var s = (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('').trim();
  if (!s) return { ok: false, error: 'empty summary' };
  return { ok: true, summary: s, model: j.model, inTok: (j.usage || {}).input_tokens, outTok: (j.usage || {}).output_tokens };
}
/** Stops a value from being read as a formula */
function safeCell_(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; }
