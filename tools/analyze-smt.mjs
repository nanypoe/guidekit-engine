import fs from "node:fs/promises";

const sourcePath = new URL("../SMT_SJ_Guia.txt", import.meta.url);
const source = await fs.readFile(sourcePath, "utf8");
const lines = source.split(/\r?\n/);
const headings = lines
  .map((line, lineNumber) => ({ lineNumber: lineNumber + 1, text: line.trim() }))
  .filter(({ text }) => text && (
    /^[-=*_]{3,}$/.test(text)
    || /^(?:[A-Z][A-Z0-9 '&/:-]{4,}|Chapter|FAQ|Walkthrough|Appendix)/.test(text)
  ));
const tables = lines.filter((line) => /\|.*\|/.test(line)).length;
const asciiBlocks = lines.filter((line) => /[+|]/.test(line)).length;

console.log(JSON.stringify({
  source: "SMT_SJ_Guia.txt",
  lines: lines.length,
  headings: headings.slice(0, 100),
  approximateTables: tables,
  asciiMapOrTableLines: asciiBlocks,
  nextMigrationTargets: [
    "chapter and area hierarchy",
    "enemy and demon records",
    "weakness tables",
    "walkthrough steps",
    "maps and coordinate markers"
  ]
}, null, 2));
