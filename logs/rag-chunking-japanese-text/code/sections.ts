export type Section = { headings: string[]; body: string };

export function splitSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const headings: string[] = [];
  let body: string[] = [];
  let inFence = false;
  const flush = () => {
    const text = body.join("\n").trim();
    if (text !== "") sections.push({ headings: [...headings], body: text });
    body = [];
  };
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    const match = inFence ? null : /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      flush();
      headings.splice(match[1].length - 1);
      headings.push(match[2].trim());
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}
