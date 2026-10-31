const FENCE = /```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/;

export function extractJson(text: string): string {
  const fenced = FENCE.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[{[]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start === -1 || end < start) {
    return body.trim();
  }
  return body.slice(start, end + 1);
}

export function parseLlmJson(text: string): unknown {
  return JSON.parse(extractJson(text));
}
