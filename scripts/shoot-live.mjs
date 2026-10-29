// Screenshot the live profile page in a real browser with the colour scheme
// emulated, so the published README is checked the way a visitor sees it.
//
//   usage: node scripts/shoot-live.mjs [--dark|--light]

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SHOTS = path.join(ROOT, ".taste-skill", "shots");
const PORT = 9334;

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
    "--user-data-dir=" + path.join(ROOT, ".taste-skill", ".chrome-live"),
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
  await send("Page.navigate", { url: "https://github.com/Chasen-Liao" });
  // Give the browser time to lay out and pick the sources.
  await sleep(6000);

  // Report which source each panel actually loaded.
  const probe = await send("Runtime.evaluate", {
    expression: `JSON.stringify([...document.querySelectorAll('.markdown-body picture')].map(p => {
      const img = p.querySelector('img');
      const chosen = [...p.querySelectorAll('source')].find(s => s.media && matchMedia(s.media).matches);
      return (chosen ? chosen.srcset : img.src).split('/').pop();
    }))`,
    returnByValue: true,
  });
  console.log(`${name} picks: ${probe.result.value}`);

  const metrics = await send("Page.getLayoutMetrics");
  const full = metrics.cssContentSize ?? metrics.contentSize;
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: Math.min(full.height, 4000), scale: 1 },
  });
  const out = path.join(SHOTS, name);
  fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(`shot ${name}  ${width}x${Math.min(full.height, 4000)}`);
};

await shoot("dark", 1100, 1200, "live-dark-desktop.png");
await shoot("light", 1100, 1200, "live-light-desktop.png");

cleanup();
console.log("screenshots in " + SHOTS);
