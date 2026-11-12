// Verify the theme-aware README the way a visitor sees it.
//
// The real README.md is rendered inside GitHub's own markdown stylesheet in a
// real browser, with prefers-color-scheme emulated, so the browser itself
// decides which <source> each <picture> picks. Screenshots are written for
// both schemes at desktop and phone width.
//
//   usage: node scripts/shoot-preview.mjs

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PREVIEW = path.join(ROOT, ".taste-skill", "preview");
const SHOTS = path.join(ROOT, ".taste-skill", "shots");
const PORT = 9333;

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error("no Chrome/Edge found");

fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=" + path.join(ROOT, ".taste-skill", ".chrome-profile"),
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

// Wait for the debugging endpoint.
let target = null;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(300);
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const list = await res.json();
    target = list.find((t) => t.type === "page");
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

const shoot = async (scheme, width, height, name) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: scheme }],
  });
  await send("Page.navigate", { url });
  // Give the browser time to lay out and pick the sources.
  await sleep(2500);

  const metrics = await send("Page.getLayoutMetrics");
  const full = metrics.cssContentSize ?? metrics.contentSize;
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: Math.min(full.height, 6000), scale: 1 },
  });
  const out = path.join(SHOTS, name);
  fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(`shot ${name}  ${width}x${Math.min(full.height, 6000)}`);
};

await shoot("light", 1100, 1200, "readme-light-desktop.png");
await shoot("dark", 1100, 1200, "readme-dark-desktop.png");
await shoot("light", 420, 900, "readme-light-mobile.png");
await shoot("dark", 420, 900, "readme-dark-mobile.png");

cleanup();
console.log("screenshots in " + SHOTS);
