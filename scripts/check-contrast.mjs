// Contrast check for the two palettes against their own grounds.
//
//   usage: node scripts/check-contrast.mjs

const srgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
};

const luminance = (hex) => {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const PALETTES = {
  light: {
    ground: "#F4EFE6",
    page: "#ffffff",
    items: { "ink headline": "#1A1714", "muted body": "#655D53", "rust accent": "#B8431A" },
  },
  dark: {
    ground: "#16130F",
    page: "#0d1117",
    items: { "paper headline": "#F4EFE6", "muted body": "#A8A093", "rust accent": "#E0682E" },
  },
};

let worst = Infinity;
for (const [name, p] of Object.entries(PALETTES)) {
  console.log(`\n=== ${name} (ground ${p.ground})`);
  console.log(`  ground vs GitHub page ${p.page}: ${ratio(p.ground, p.page).toFixed(2)}:1`);
  for (const [label, color] of Object.entries(p.items)) {
    const r = ratio(color, p.ground);
    worst = Math.min(worst, r);
    const large = r >= 3 ? "ok (large text)" : "LOW";
    console.log(`  ${label.padEnd(16)} ${color}  ${r.toFixed(2)}:1  ${large}`);
  }
}
console.log(`\nworst text ratio: ${worst.toFixed(2)}:1`);
