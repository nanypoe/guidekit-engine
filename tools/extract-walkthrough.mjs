import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../SMT_SJ_Guia.txt", import.meta.url), "utf8");
const lines = source.split(/\r?\n/);
const headingPattern = /^Walkthrough:\s+(.+?)\s+\[([A-Z0-9_-]+)\]\s*$/;
const sections = [];

for (let index = 0; index < lines.length; index += 1) {
  const match = lines[index].trim().match(headingPattern);
  if (!match) continue;
  let end = lines.length;
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    if (headingPattern.test(lines[cursor].trim())) {
      end = cursor;
      break;
    }
  }
  const body = lines.slice(index + 1, end).join("\n").trim();
  sections.push({
    id: match[2].toLowerCase().replace(/_/g, "-"),
    title: match[1].trim(),
    sourceAnchor: match[2],
    sourceLine: index + 1,
    body,
    status: "needs-review"
  });
}

console.log(JSON.stringify({
  source: "SMT_SJ_Guia.txt",
  extractedAt: new Date().toISOString(),
  warning: "Borrador de migración: revisar atribución, idioma, tablas ASCII y pasos antes de publicar.",
  sections
}, null, 2));
