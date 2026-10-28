/** Settings. Secrets live in Script Properties, never in code:
 *  WEBHOOK_SECRET    - shared secret in the webhook URL (?key=...)
 *  ANTHROPIC_API_KEY - API key for the Anthropic Messages API */
var CONFIG = {
  secretParam: 'key',
  sheetName: 'Summaries', doneSheet: 'Processed IDs', errorSheet: 'Error log',
  apiUrl: 'https://api.anthropic.com/v1/messages',
  apiVersion: '2023-06-01',
  model: 'claude-haiku-4-5-20251001', // small, low-cost model; change per client
  maxTokens: 200,
  maxInputChars: 4000,                // longer messages are cut before sending
  prompt: 'Summarize the following chat message in one short sentence in the same language. Reply with the summary only.',
  timeZone: 'Asia/Tokyo'
};
