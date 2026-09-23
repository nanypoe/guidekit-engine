import fs from "node:fs/promises";
import { validateGuide } from "../src/validation.js";

const root = new URL("..", import.meta.url);
const guidePath = process.argv[2] || "guides/smt-strange-journey.json";
const guide = JSON.parse(await fs.readFile(new URL(guidePath, root), "utf8"));
const result = validateGuide(guide);
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
