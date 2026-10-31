// モデルの出力の形をまねて手で作った見本です。実際のモデルの出力ではありません。
export const samples: Record<string, string> = {
  ok: '{"category":"bug","priority":2,"summary":"ログインボタンを押しても反応しない","tags":["login","ui"]}',
  "wrong-type": '{"category":"bug","priority":"2","summary":"ログインボタンを押しても反応しない","tags":["login"]}',
  "bad-enum": '{"category":"Bug","priority":2,"summary":"ログインボタンを押しても反応しない","tags":["login"]}',
  "extra-key": '{"category":"billing","priority":1,"summary":"請求額が二重になっている","tags":[],"confidence":0.9}',
  many: '{"category":"other","priority":5,"tags":["login",3]}',
};
