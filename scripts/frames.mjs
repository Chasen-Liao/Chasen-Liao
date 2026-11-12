// Extract single frames from an animated WebP and report the mean brightness
// of the upper band, so the light and dark openings can be compared frame by
// frame instead of guessing from a screenshot.
//
//   usage: node scripts/frames.mjs <webp> [frameIndex...]

import sharp from "file:///C:/Users/admin/AppData/Local/OpenAI/Codex/runtimes/cua_node/1fb7137c46617d50/bin/node_modules/sharp/dist/index.mjs";

const [file, ...rest] = process.argv.slice(2);
const wanted = rest.length ? rest.map(Number) : [0, 1, 2, 4, 6, 8, 12, 20];

const img = sharp(file, { animated: true });
const meta = await img.metadata();
const pageH = meta.pageHeight ?? meta.height;
const frames = meta.pages ?? 1;
console.log(`${file}\n  ${meta.width}x${meta.height}  ${frames} frames  pageHeight=${pageH}`);

for (const f of wanted) {
  if (f >= frames) continue;
  const raw = await sharp(file, { page: f })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const top = sharp(raw.data, { raw: raw.info }).extract({
    left: 0,
    top: 0,
    width: raw.info.width,
    height: Math.round(raw.info.height * 0.45),
  });
  const { data } = await top.raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += raw.info.channels) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  console.log(
    `  frame ${String(f).padStart(3)}  mean(top 45%) = ${(sum / (data.length / raw.info.channels)).toFixed(2)}`,
  );
}
