// Probe the horizontal colour transitions along a row of a screenshot, so the
// sheet edges can be compared between the banner and the cards.
//
//   usage: node scripts/probe-edges.mjs <png> <y> [xFrom] [xTo]

import sharp from "file:///C:/Users/admin/AppData/Local/OpenAI/Codex/runtimes/cua_node/1fb7137c46617d50/bin/node_modules/sharp/dist/index.mjs";

const [file, yArg, fromArg, toArg] = process.argv.slice(2);
const y = Number(yArg ?? 0);
const from = Number(fromArg ?? 0);
const to = Number(toArg ?? 99999);

const img = sharp(file);
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

const px = (x, yy) => {
  const o = (yy * info.width + x) * ch;
  return [data[o], data[o + 1], data[o + 2]];
};

const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

console.log(`${file}  ${info.width}x${info.height}  row y=${y}`);

let prev = null;
let start = from;
for (let x = from; x <= Math.min(to, info.width - 1); x++) {
  const c = hex(px(x, y));
  if (c !== prev) {
    if (prev !== null) console.log(`  x ${String(start).padStart(4)}..${String(x - 1).padStart(4)}  ${prev}`);
    prev = c;
    start = x;
  }
}
console.log(`  x ${String(start).padStart(4)}..${String(Math.min(to, info.width - 1)).padStart(4)}  ${prev}`);
