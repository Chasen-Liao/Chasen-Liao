// Generate dark-theme variants of the profile-v3 SVG cards.
//
// The light cards are built from one five-colour system, so a dark variant is a
// pure palette swap. The sheet edge is deliberately NOT redrawn: the light
// cards carry no stroke, and adding one to the dark set would make the two
// themes structurally different. The dark sheet separates from GitHub's dark
// canvas by ground tone alone (#16130F against #0d1117).
//
//   usage: node scripts/build-dark-cards.mjs [--out <dir>] [--edges]

import fs from "node:fs";
import path from "node:path";

const SRC = "assets/profile-v3";

// Light -> dark palette. Applied in a single pass so a swapped value is never
// re-swapped.
const MAP = {
  "#F4EFE6": "#16130F", // paper ground -> warm charcoal
  "#1A1714": "#F4EFE6", // ink type -> paper type
  "#655D53": "#A8A093", // muted type -> light warm grey
  "#B8431A": "#E0682E", // rust accent -> brightened rust
};

// The grain is a texture, not type: on paper it darkens the sheet, so on
// charcoal it has to lighten it or it disappears.
const GRAIN = { from: "#847463", to: "#6F6555", opacityFrom: ".06", opacityTo: ".09" };

const EDGE = "#2E2921";

// Opt-in only. The sheet edge is a fallback for a flat canvas; the dark cards
// run against GitHub's own dark background, where the ground tone already
// draws the boundary.
const EDGE_ROLES = {
  "intro": { top: true, bottom: false },
  "contact": { top: false, bottom: true },
};

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 ? args[outIdx + 1] : path.join(SRC, "dark");
const WITH_EDGES = args.includes("--edges");

const swapPalette = (svg) =>
  svg.replace(/#[0-9a-fA-F]{6}/g, (hex) => {
    const key = hex.toUpperCase();
    return MAP[key] ?? hex;
  });

const swapGrain = (svg) =>
  svg
    .replace(
      new RegExp(`<g fill="${GRAIN.from}" opacity="${GRAIN.opacityFrom}">`, "g"),
      `<g fill="${GRAIN.to}" opacity="${GRAIN.opacityTo}">`,
    )
    // Any other grain tint left in the file.
    .replace(new RegExp(GRAIN.from, "g"), GRAIN.to);

const viewBoxOf = (svg) => {
  const m = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!m) return null;
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return { w, h };
};

// The sheet edge: a hairline inset by half a stroke so it stays inside the
// canvas. Drawn as one path so the whole outline is a single element.
const edgePath = (w, h, role) => {
  const seg = [`M0.5 0V${h}`, `M${w - 0.5} 0V${h}`];
  if (role?.top) seg.push(`M0 0.5H${w}`);
  if (role?.bottom) seg.push(`M0 ${h - 0.5}H${w}`);
  return seg.join("");
};

// Insert the edge directly after the grain sheet, so it sits above the ground
// fill but below the type.
const insertEdges = (svg, w, h, role) => {
  const grainAt = svg.indexOf('fill="url(#grain)"');
  if (grainAt < 0) throw new Error("no grain sheet");
  const end = svg.indexOf(">", grainAt) + 1;
  const edge = `<path d="${edgePath(w, h, role)}" fill="none" stroke="${EDGE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  return svg.slice(0, end) + edge + svg.slice(end);
};

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".svg"));
let count = 0;

for (const file of files) {
  const name = path.basename(file, ".svg");
  const light = fs.readFileSync(path.join(SRC, file), "utf8");
  const vb = viewBoxOf(light);
  if (!vb) throw new Error(`no viewBox in ${file}`);

  let dark = swapGrain(swapPalette(light));
  if (WITH_EDGES) dark = insertEdges(dark, vb.w, vb.h, EDGE_ROLES[name]);

  fs.writeFileSync(path.join(OUT, file), dark);
  count += 1;
  console.log(`${file.padEnd(26)} ${vb.w}x${vb.h}  -> ${path.join(OUT, file)}`);
}

console.log(`\n${count} dark card(s) written to ${OUT}`);
