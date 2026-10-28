/** Deploy as a web app and set its URL (with ?key=SECRET) as the Chatwork webhook URL. */
function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('WEBHOOK_SECRET');
  if (!secret || (e.parameter || {})[CONFIG.secretParam] !== secret) return out_({ ok: false, reason: 'forbidden' });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActive();
    var log = sheet_(ss, CONFIG.sheetName, ['Received', 'Room', 'Sender', 'Original', 'Summary', 'Model', 'Tokens in/out']);
    var done = sheet_(ss, CONFIG.doneSheet, ['Message ID']), err = sheet_(ss, CONFIG.errorSheet, ['Received', 'Message ID', 'Reason', 'Text']);
    var seen = {}; done.getDataRange().getValues().forEach(function (r) { seen[r[0]] = true; });
    var now = Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy-MM-dd HH:mm'), res = { added: 0, errors: 0, dup: 0 };
    var key = props.getProperty('ANTHROPIC_API_KEY');
    extractChatwork_(JSON.parse(e.postData.contents)).forEach(function (msg) {
      if (seen[msg.id]) { res.dup++; return; }
      var text = cleanText_(msg.text);
      var r = key ? summarize_(text, key) : { ok: false, error: 'ANTHROPIC_API_KEY is not set' };
      if (r.ok) { log.appendRow([now, msg.room, msg.from, safeCell_(text), safeCell_(r.summary), r.model, r.inTok + '/' + r.outTok]); res.added++; }
      else { err.appendRow([now, msg.id, r.error, safeCell_(text)]); res.errors++; }
      done.appendRow([msg.id]); seen[msg.id] = true;   // failed ones are kept in Error log, not retried
    });
    return out_({ ok: true, result: res });
  } finally { lock.releaseLock(); }
}
/** Calls the Anthropic Messages API. The key comes only from Script Properties. */
function summarize_(text, key) {
  var resp = UrlFetchApp.fetch(CONFIG.apiUrl, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': CONFIG.apiVersion },
    payload: JSON.stringify(buildRequest_(text, CONFIG))
  });
  return parseResponse_(resp.getResponseCode(), resp.getContentText());
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet_(ss, name, header) { var s = ss.getSheetByName(name); if (!s) { s = ss.insertSheet(name); s.appendRow(header); } return s; }
