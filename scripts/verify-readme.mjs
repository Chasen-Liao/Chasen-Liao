// Verify the theme-aware README in a real browser.
//
// Checks, for each colour scheme and width:
//   1. which file each <picture> actually loaded (currentSrc),
//   2. the panel geometry, so the sheet reads as one continuous column.
//
//   usage: node scripts/verify-readme.mjs

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PREVIEW = path.join(ROOT, ".taste-skill", "preview");
const PORT = 9334;

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error("no Chrome/Edge found");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=" + path.join(ROOT, ".taste-skill", ".chrome-verify"),
    "about:blank",
  ],
  { stdio: "ignore" },
);
const cleanup = () => {
  try {
    chrome.kill();
  } catch {}
};
process.on("exit", cleanup);

let target = null;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(300);
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    target = (await res.json()).find((t) => t.type === "page");
  } catch {}
}
if (!target) {
  cleanup();
  throw new Error("chrome debug endpoint never came up");
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const data = JSON.parse(ev.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");

const url = "file:///" + path.join(PREVIEW, "readme.html").replace(/\\/g, "/");

const probe = async (scheme, width, reducedMotion = false) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: scheme },
      { name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" },
    ],
  });
  await send("Page.navigate", { url });
  await sleep(2500);

  const { result } = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const imgs = [...document.querySelectorAll('img')];
      const rects = imgs.map((i) => {
        const r = i.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) };
      });
      const gaps = [];
      for (let i = 1; i < rects.length; i++) gaps.push(rects[i].top - rects[i-1].bottom);
      return {
        picked: imgs.map((i) => i.currentSrc.split('/').slice(-2).join('/')),
        rects,
        gaps,
        canvas: getComputedStyle(document.body).backgroundColor,
        broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
      };
    })()`,
  });
  return result.value;
};

for (const scheme of ["light", "dark"]) {
  for (const [label, width] of [["desktop", 1100], ["mobile", 420]]) {
    const r = await probe(scheme, width);
    console.log(`\n=== ${scheme} / ${label} (${width}px)  canvas=${r.canvas}  broken=${r.broken}`);
    r.picked.forEach((p, i) => console.log(`  [${i}] ${p}   h=${r.rects[i].h}`));
    console.log(`  gaps between panels: ${r.gaps.join(", ")}`);
  }
}

// Reduced motion must land on the still poster, never the animation.
for (const scheme of ["light", "dark"]) {
  const r = await probe(scheme, 1100, true);
  console.log(`\n=== ${scheme} / reduced-motion (1100px)  broken=${r.broken}`);
  console.log(`  opening picked: ${r.picked[0]}`);
}

cleanup();
