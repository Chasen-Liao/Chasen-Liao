// Build the dark-theme opening: animation + still poster.
//
// The dark cut follows the light cut's recipe exactly, so the two read the
// same way side by side:
//
//   Remotion -> mp4 (96 frames, 30fps)
//            -> ffmpeg lossless animated WebP at the delivery size
//            -> sharp WebP (quality 86, effort 4, mixed, loop 1,
//               last frame held 1800ms)
//
//   Remotion still (frame 95) -> png -> sharp WebP poster
//
// The theme itself lives in motion/profile-opening/src/Opening.tsx; this
// script only produces the media.
//
//   usage: node scripts/render-dark-opening.mjs

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "file:///C:/Users/admin/AppData/Local/OpenAI/Codex/runtimes/cua_node/1fb7137c46617d50/bin/node_modules/sharp/dist/index.mjs";

const ROOT = process.cwd();
const MOTION = path.join(ROOT, "motion", "profile-opening");
const OUT = path.join(ROOT, "assets", "profile-v3", "dark");
// Intermediates live under the ignored .taste-skill folder.
const WORK = path.join(ROOT, ".taste-skill", "dark");

const FFMPEG = path.join(MOTION, "node_modules", "ffmpeg-static", "ffmpeg.exe");
// The Remotion CLI is a JS entry point, so it needs the node interpreter: the
// .cmd shim splits arguments on spaces, which breaks the browser path.
const REMOTION = path.join(MOTION, "node_modules", "@remotion", "cli", "remotion-cli.js");

// Reuse the browser already on this machine instead of downloading one.
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

// 96 frames at 30fps, exactly like the light composition.
const FRAMES = 96;
const FPS = 30;

const TARGETS = [
  {
    id: "ProfileOpeningDark",
    name: "opening-dark",
    width: 1200,
    height: 480,
  },
  {
    id: "ProfileOpeningMobileDark",
    name: "opening-mobile-dark",
    width: 810,
    height: 480,
  },
];

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(WORK, { recursive: true });

const run = (cmd, args, cwd = ROOT) => {
  console.log(`\n$ ${path.basename(cmd)} ${args.slice(0, 4).join(" ")} ...`);
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
};

const remotion = (args) => run(process.execPath, [REMOTION, ...args], MOTION);
const browserArgs = CHROME ? ["--browser-executable", CHROME] : [];

for (const t of TARGETS) {
  const mp4 = path.join(WORK, `${t.name}.mp4`);
  const raw = path.join(WORK, `${t.name}-raw.webp`);
  const posterPng = path.join(WORK, `${t.name}-poster.png`);

  // 1. Render the composition.
  remotion(["render", "src/index.ts", t.id, mp4, "--codec", "h264", ...browserArgs]);

  // 2. Export the finished frame as the still poster.
  remotion([
    "still",
    "src/index.ts",
    t.id,
    posterPng,
    "--frame",
    String(FRAMES - 1),
    ...browserArgs,
  ]);

  // 3. Lossless animated WebP, the raw the light cut was encoded from.
  run(FFMPEG, [
    "-y",
    "-i",
    mp4,
    "-vf",
    `scale=${t.width}:${t.height}:flags=lanczos`,
    "-r",
    String(FPS),
    "-frames:v",
    String(FRAMES),
    "-c:v",
    "libwebp_anim",
    "-loop",
    "0",
    "-lossless",
    "1",
    "-compression_level",
    "6",
    "-q:v",
    "100",
    "-an",
    raw,
  ]);

  // 4. Re-encode to the delivery format: smaller, plays once, holds the last
  //    frame so the wordmark stays put.
  const buffer = await sharp(raw, { animated: true }).toBuffer();
  const meta = await sharp(buffer, { animated: true }).metadata();
  const delay = meta.delay.slice();
  delay[delay.length - 1] += 1800;
  const target = path.join(OUT, `${t.name}.webp`);
  await sharp(buffer, { animated: true })
    .webp({ quality: 86, effort: 4, mixed: true, loop: 1, delay })
    .toFile(target);

  // 5. Poster.
  const posterTarget = path.join(OUT, `${t.name}-poster.webp`);
  await sharp(posterPng)
    .resize(t.width, t.height, { fit: "fill", kernel: "lanczos3" })
    .webp({ quality: 92 })
    .toFile(posterTarget);

  const written = await sharp(target, { animated: true }).metadata();
  console.log({
    animation: path.relative(ROOT, target),
    kb: Math.round(fs.statSync(target).size / 1024),
    frames: written.pages,
    motionMs: written.delay.reduce((a, b) => a + b, 0),
    holdMs: 1800,
    poster: path.relative(ROOT, posterTarget),
    posterKb: Math.round(fs.statSync(posterTarget).size / 1024),
  });
}

console.log("\nDark opening deliverables written to " + OUT);
