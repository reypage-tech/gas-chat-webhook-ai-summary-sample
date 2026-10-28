# Live API runs

Real calls to the Anthropic Messages API, made by running the same `src/` code in Node.js with `tools/live_run.js`. Google services were fakes (mock environment); only the API call was real. The key came from an environment variable and is not stored anywhere in this repository. All messages are fictional.

- Date: 2026-10-28, 23:43:45 to 23:43:47 JST
- Model: `claude-haiku-4-5-20251001` (chosen from the models list returned by the API on the same date)
- Calls: 3 summary calls (plus 1 models-list call), all HTTP 200, 0 errors

| # | Time (JST) | Input (fictional) | Summary returned | Tokens in/out |
|---|---|---|---|---|
| 1 | 23:43:45 | サンプル商事の山田です。明日の打ち合わせは14時から15時に変更をお願いできますか。資料は前日までに送ります。（元の文の `[To:222]` は送る前に外した） | サンプル商事の山田が、明日の打ち合わせ時間を14時から15時への変更を依頼し、資料は前日までに送るとのこと。 | 78/55 |
| 2 | 23:43:46 | 請求書の件です。10月分は金額を修正したものを再発行しました。旧版は破棄してください。 | 10月分の請求書を金額修正して再発行したので、旧版は破棄するよう依頼している。 | 65/38 |
| 3 | 23:43:47 | 来週の納品ですが、部品の入荷が遅れていて、水曜から金曜にずれる見込みです。確定したらまた連絡します。 | 来週の納品予定が部品の遅延により水曜から金曜にずれる見込み。 | 79/34 |

Total tokens: 222 in, 127 out.

Cost estimate: at USD 1 per million input tokens and USD 5 per million output tokens (Haiku 4.5 list price), about USD 0.00086, roughly 0.13 yen at 150 yen per dollar. This is an estimate from the token counts, not a billed amount.
