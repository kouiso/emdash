// モデルの出力の形を手で作った見本です。実際のモデルの出力ではありません。
export const samples = {
  fenced: '```json\n{"category": "billing", "priority": 1}\n```',
  preamble: '分類結果は次のとおりです。\n{"category": "billing", "priority": 1}',
  trailing: '{"category": "billing", "priority": 1}\n以上です。',
  truncated: '{"category": "billing", "summary": "請求額が二重に',
};
