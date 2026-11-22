// Generate the Risograph x Swiss Atelier SVG plate set (light & dark themes)
// for Chasen's GitHub Profile README.
//
// Usage: node scripts/build-atelier.mjs

import fs from "node:fs";
import path from "node:path";

const OUT_LIGHT = "assets/atelier";
const OUT_DARK = path.join(OUT_LIGHT, "dark");
const PI_PNG = "assets/profile/pi-desktop.png";

const MONO = "'Cascadia Mono','SFMono-Regular',Consolas,'Liberation Mono',monospace";
const SERIF = "Georgia,'Times New Roman','Noto Serif SC',serif";
const SANS = "'PingFang SC','Microsoft YaHei','Noto Sans SC','Segoe UI',sans-serif";

// Exact 5-line ASCII signature preserved verbatim from assets/profile-clean/opening.svg
const ASCII_LINES = [
  "   ____   _                                   ",
  "  / ___| | |__    __ _   ___    ___   _ __    ",
  " | |     | '_ \\  / _` | / __|  / _ \\ | '_ \\   ",
  " | |___  | | | || (_| | \\__ \\ |  __/ | | | |  ",
  "  \\____| |_| |_| \\__,_| |___/  \\___| |_| |_|  ",
];

const THEMES = {
  light: {
    name: "light",
    bg: "#F7F3EB",
    surface: "#EFE9DC",
    artBg: "#F2ECE0",
    ink: "#161412",
    inkSoft: "#3B352F",
    muted: "#635C53",
    faint: "#8A8175",
    border: "#181614",
    rule: "#D5CDC0",
    risoRed: "#D94426",
    risoBlue: "#1D4E89",
    risoGold: "#B87D24",
    risoRedSoft: "rgba(217,68,38,0.13)",
    risoBlueSoft: "rgba(29,78,137,0.11)",
    risoGoldSoft: "rgba(184,125,36,0.14)",
    dot: "rgba(22,20,18,0.08)",
    badgeBg: "#E6DFD1",
    frameShadow: "#D8CFC1",
  },
  dark: {
    name: "dark",
    bg: "#13110F",
    surface: "#1B1815",
    artBg: "#181512",
    ink: "#F4EDE2",
    inkSoft: "#D5CCC0",
    muted: "#A89E90",
    faint: "#7A7165",
    border: "#3D362E",
    rule: "#2A2520",
    risoRed: "#F26444",
    risoBlue: "#5B9BF0",
    risoGold: "#E2AD52",
    risoRedSoft: "rgba(242,100,68,0.16)",
    risoBlueSoft: "rgba(91,155,240,0.15)",
    risoGoldSoft: "rgba(226,173,82,0.16)",
    dot: "rgba(244,237,226,0.075)",
    badgeBg: "#24201B",
    frameShadow: "#0A0908",
  },
};

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const sharedCss = (t) => `
  .pulse { animation: pulse 3.2s ease-in-out infinite; }
  .spin-slow { transform-box: fill-box; transform-origin: center; animation: spin 46s linear infinite; }
  .spin-rev { transform-box: fill-box; transform-origin: center; animation: spinRev 64s linear infinite; }
  .scan-y { animation: scanY 5.2s ease-in-out infinite; }
  .flow-x { stroke-dasharray: 6 7; animation: flowX 4s linear infinite; }
  @keyframes pulse { 0%, 100% { opacity: 0.42; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.06); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes spinRev { to { transform: rotate(-360deg); } }
  @keyframes scanY { 0%, 100% { transform: translateY(0px); opacity: 0.35; } 50% { transform: translateY(82px); opacity: 0.85; } }
  @keyframes flowX { to { stroke-dashoffset: -26; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

const wrapSvg = ({ w, h, title, defs = "", body, theme }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t"><title id="t">${esc(title)}</title><defs>${defs}</defs><style>${sharedCss(theme)}</style>${body}</svg>`;

const dotPattern = (id, dotColor, spacing = 22) =>
  `<pattern id="${id}" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse"><circle cx="${spacing / 2}" cy="${spacing / 2}" r="1" fill="${dotColor}"/></pattern>`;

const halftonePattern = (id, color, spacing = 10, r = 1.8) =>
  `<pattern id="${id}" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><circle cx="${spacing / 2}" cy="${spacing / 2}" r="${r}" fill="${color}"/></pattern>`;

// Printer crop & registration marks around a frame
const regMarks = (x, y, w, h, color, len = 10) => {
  const r = x + w;
  const b = y + h;
  return `<g stroke="${color}" stroke-width="1" fill="none" opacity="0.65">
    <path d="M${x} ${y + len}V${y}H${x + len}M${r - len} ${y}H${r}V${y + len}M${x} ${b - len}V${b}H${x + len}M${r - len} ${b}H${r}V${b - len}"/>
  </g>`;
};

// Minimalist Chinese/Atelier vermilion chop seal
const chopSeal = (x, y, size, t) => {
  const half = size / 2;
  return `<g transform="translate(${x} ${y})">
    <rect x="0" y="0" width="${size}" height="${size}" rx="4" fill="none" stroke="${t.risoRed}" stroke-width="1.8"/>
    <rect x="3.5" y="3.5" width="${size - 7}" height="${size - 7}" rx="2" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="0.7" opacity="0.85"/>
    <path d="M${half} 6V${size - 6}M6 ${half}H${size - 6}" stroke="${t.risoRed}" stroke-width="0.7" opacity="0.35"/>
    <text x="${half}" y="${half - 3.5}" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1" fill="${t.risoRed}">CL</text>
    <text x="${half}" y="${half + 11.5}" text-anchor="middle" font-family="${SANS}" font-size="10.5" font-weight="700" fill="${t.risoRed}">造物</text>
  </g>`;
};

// Render the exact 5-line ASCII signature with subtle Risograph offset plates
const asciiBlock = ({ cx, y0, lineStep, fontSize, t }) => {
  const renderLayer = (dx, dy, fill, opacity) => {
    const tspans = ASCII_LINES.map(
      (line, i) => `<tspan x="${cx + dx}" y="${y0 + dy + i * lineStep}">${esc(line)}</tspan>`
    ).join("");
    return `<text xml:space="preserve" text-anchor="middle" font-family="${MONO}" font-size="${fontSize}" font-weight="700" fill="${fill}" opacity="${opacity}">${tspans}</text>`;
  };
  return [
    renderLayer(2.6, 1.8, t.risoRed, 0.24),
    renderLayer(-2.2, -1.2, t.risoBlue, 0.2),
    renderLayer(0, 0, t.ink, 1),
  ].join("");
};

// ---------------------------------------------------------------------------
// PLATE 00: HERO POSTER (Desktop 1200x470 & Mobile 640x540)
// ---------------------------------------------------------------------------
function buildHeroDesktop(t) {
  const w = 1200;
  const h = 470;
  const defs = [
    dotPattern("h-dots", t.dot, 24),
    halftonePattern("h-tone", t.risoRed, 9, 1.7),
    `<clipPath id="h-clip"><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6"/></clipPath>`,
  ].join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
    <g clip-path="url(#h-clip)">
      <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="url(#h-dots)"/>
      <!-- Architectural blueprint framing lines -->
      <line x1="6" y1="68" x2="${w - 6}" y2="68" stroke="${t.rule}" stroke-width="1"/>
      <line x1="6" y1="354" x2="${w - 6}" y2="354" stroke="${t.rule}" stroke-width="1"/>
      <line x1="600" y1="354" x2="600" y2="${h - 6}" stroke="${t.rule}" stroke-width="1"/>
      <line x1="215" y1="68" x2="215" y2="354" stroke="${t.rule}" stroke-width="0.8" stroke-dasharray="3 5"/>
      <line x1="985" y1="68" x2="985" y2="354" stroke="${t.rule}" stroke-width="0.8" stroke-dasharray="3 5"/>

      <!-- Risograph offset sun + halftone texture + orbital compass behind signature -->
      <g transform="translate(835 208)">
        <circle r="118" fill="${t.risoRedSoft}"/>
        <circle r="118" fill="url(#h-tone)" opacity="0.24"/>
        <circle cx="-8" cy="6" r="118" fill="none" stroke="${t.risoRed}" stroke-width="1" opacity="0.45"/>
        <g class="spin-slow">
          <circle r="154" fill="none" stroke="${t.risoBlue}" stroke-width="1.1" stroke-dasharray="6 9" opacity="0.48"/>
          <circle cx="0" cy="-154" r="3.5" fill="${t.risoBlue}" opacity="0.75"/>
          <circle cx="154" cy="0" r="2.5" fill="${t.risoRed}" opacity="0.75"/>
        </g>
        <g class="spin-rev">
          <circle r="184" fill="none" stroke="${t.rule}" stroke-width="1" stroke-dasharray="2 12"/>
        </g>
      </g>

      <!-- Subtle left blueprint coordinate crosshairs -->
      <g stroke="${t.risoBlue}" stroke-width="0.9" opacity="0.28" fill="none">
        <circle cx="145" cy="212" r="54"/>
        <path d="M80 212H210M145 147V277"/>
      </g>
    </g>

    ${regMarks(18, 18, w - 36, h - 36, t.faint, 9)}

    <!-- Top Exhibition Masthead -->
    <g font-family="${MONO}" font-size="12" letter-spacing="2">
      <rect x="44" y="29" width="8" height="8" fill="${t.risoRed}"/>
      <text x="64" y="38" fill="${t.ink}" font-weight="700">EXHIBITION NO. 01</text>
      <text x="234" y="38" fill="${t.muted}">CHASEN ATELIER  ·  RISO-EDITION</text>
      <text x="904" y="38" text-anchor="end" fill="${t.muted}">GUANGZHOU / SHENZHEN</text>
      <circle cx="932" cy="34" r="4.5" fill="${t.risoRed}" class="pulse" style="transform-box:fill-box;transform-origin:center;"/>
      <text x="1154" y="38" text-anchor="end" fill="${t.ink}" font-weight="600">ARCHIVE · 2026</text>
    </g>

    <!-- Preserved Chasen ASCII Signature as centerpiece -->
    ${asciiBlock({ cx: 598, y0: 150, lineStep: 30, fontSize: 27, t })}
    <text x="600" y="322" text-anchor="middle" font-family="${MONO}" font-size="11.5" letter-spacing="4.5" fill="${t.muted}">AI PRODUCT MANAGER  ×  AGENT ENGINEER</text>

    <!-- Vermilion Chop Seal on right margin -->
    ${chopSeal(1088, 184, 48, t)}

    <!-- Bottom Curatorial Statement (2 Columns) -->
    <text x="46" y="392" font-family="${SANS}" font-size="21" font-weight="700" fill="${t.ink}">把想法锻造成真实产品与工具。</text>
    <text x="46" y="424" font-family="${SANS}" font-size="14.5" fill="${t.muted}">聚焦 Agent 工作流、桌面端体验与 Context Engineering，在实测与开源中持续交付。</text>

    <text x="1154" y="391" text-anchor="end" font-family="${SERIF}" font-size="16" font-style="italic" fill="${t.inkSoft}">“When wits fall short, repetition is the key to triumph.”</text>
    <g font-family="${MONO}" font-size="11.5" letter-spacing="1.6" fill="${t.risoBlue}">
      <text x="1154" y="424" text-anchor="end">AGENTS  ·  ELECTRON  ·  SKILLS  ·  RAG</text>
    </g>
  `;
  return wrapSvg({ w, h, title: "Chasen Atelier — ASCII 艺术签名与个人展览封面", defs, body, theme: t });
}

function buildHeroMobile(t) {
  const w = 640;
  const h = 540;
  const defs = [
    dotPattern("hm-dots", t.dot, 20),
    halftonePattern("hm-tone", t.risoRed, 8, 1.5),
    `<clipPath id="hm-clip"><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6"/></clipPath>`,
  ].join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
    <g clip-path="url(#hm-clip)">
      <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="url(#hm-dots)"/>
      <line x1="6" y1="62" x2="${w - 6}" y2="62" stroke="${t.rule}" stroke-width="1"/>
      <line x1="6" y1="344" x2="${w - 6}" y2="344" stroke="${t.rule}" stroke-width="1"/>

      <g transform="translate(380 198)">
        <circle r="102" fill="${t.risoRedSoft}"/>
        <circle r="102" fill="url(#hm-tone)" opacity="0.22"/>
        <g class="spin-slow">
          <circle r="134" fill="none" stroke="${t.risoBlue}" stroke-width="1.1" stroke-dasharray="5 8" opacity="0.45"/>
        </g>
      </g>
    </g>

    ${regMarks(16, 16, w - 32, h - 32, t.faint, 8)}

    <g font-family="${MONO}" font-size="12" letter-spacing="1.6">
      <rect x="30" y="27" width="8" height="8" fill="${t.risoRed}"/>
      <text x="48" y="36" fill="${t.ink}" font-weight="700">EXHIBITION NO. 01</text>
      <circle cx="484" cy="32" r="4" fill="${t.risoRed}" class="pulse" style="transform-box:fill-box;transform-origin:center;"/>
      <text x="610" y="36" text-anchor="end" fill="${t.muted}">CHASEN · 2026</text>
    </g>

    ${asciiBlock({ cx: 320, y0: 144, lineStep: 23.5, fontSize: 18.5, t })}
    <text x="320" y="298" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="2.4" fill="${t.muted}">AI PRODUCT MANAGER × AGENT ENGINEER</text>

    <text x="30" y="388" font-family="${SANS}" font-size="22" font-weight="700" fill="${t.ink}">把想法锻造成真实产品与工具。</text>
    <text x="30" y="422" font-family="${SANS}" font-size="15" fill="${t.muted}">聚焦 Agent 工作流、桌面端与开源实践</text>
    <text x="30" y="448" font-family="${SANS}" font-size="15" fill="${t.muted}">关注广州 / 深圳校招机会</text>

    <text x="30" y="498" font-family="${SERIF}" font-size="13.5" font-style="italic" fill="${t.inkSoft}">“When wits fall short, repetition is the key.”</text>
    ${chopSeal(560, 462, 48, t)}
  `;
  return wrapSvg({ w, h, title: "Chasen Atelier — 移动端展览封面", defs, body, theme: t });
}

// ---------------------------------------------------------------------------
// PLATE 01: FLAGSHIP — PI AGENT DESKTOP (Desktop 1200x460 & Mobile 640x680)
// ---------------------------------------------------------------------------
function buildFlagshipDesktop(t, piB64) {
  const w = 1200;
  const h = 460;
  const defs = [
    dotPattern("fp-dots", t.dot, 18),
    `<clipPath id="fp-clip"><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6"/></clipPath>`,
  ].join("");

  const pills = ["Electron", "TypeScript", "React"];
  const pillEls = pills
    .map((label, idx) => {
      const px = 46 + idx * 102;
      return `<rect x="${px}" y="384" width="92" height="28" rx="4" fill="${t.badgeBg}" stroke="${t.rule}" stroke-width="1"/><text x="${px + 46}" y="402" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${t.inkSoft}">${label}</text>`;
    })
    .join("");

  const bullets = [
    { color: t.risoRed, text: "会话分叉与分支树导航，上下文分支随时回溯" },
    { color: t.risoBlue, text: "多模型热切换、Skills 面板与本地工作区浏览" },
    { color: t.risoGold, text: "面向 Windows · macOS · Linux 原生桌面运行" },
  ];
  const bulletEls = bullets
    .map((b, i) => {
      const by = 224 + i * 36;
      return `<polygon points="48,${by - 5} 54,${by} 48,${by + 5} 42,${by}" fill="${b.color}"/><text x="66" y="${by + 5}" font-family="${SANS}" font-size="15.5" fill="${t.inkSoft}">${esc(b.text)}</text>`;
    })
    .join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
    <g clip-path="url(#fp-clip)">
      <!-- Left info column -->
      <line x1="538" y1="6" x2="538" y2="${h - 6}" stroke="${t.rule}" stroke-width="1"/>
      <!-- Right gallery tray surface -->
      <rect x="539" y="7" width="${w - 546}" height="${h - 14}" fill="${t.surface}"/>
      <rect x="539" y="7" width="${w - 546}" height="${h - 14}" fill="url(#fp-dots)"/>
    </g>

    ${regMarks(18, 18, w - 36, h - 36, t.faint, 8)}

    <!-- Plate 01 Header -->
    <text x="44" y="84" font-family="${SERIF}" font-size="56" font-weight="700" fill="none" stroke="${t.risoRed}" stroke-width="1.4" opacity="0.85">01</text>
    <rect x="116" y="48" width="136" height="24" rx="3" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1"/>
    <text x="184" y="64" text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="700" letter-spacing="1.2" fill="${t.risoRed}">FLAGSHIP · ★ 340</text>
    <text x="498" y="64" text-anchor="end" font-family="${MONO}" font-size="11.5" letter-spacing="1.4" fill="${t.faint}">DESKTOP APP</text>

    <text x="44" y="136" font-family="${SERIF}" font-size="36" font-weight="700" fill="${t.ink}">Pi Agent Desktop</text>
    <text x="44" y="170" font-family="${SANS}" font-size="16.5" fill="${t.muted}">基于 pi-web 演进的 Pi 编程智能体桌面客户端</text>
    <line x1="44" y1="194" x2="498" y2="194" stroke="${t.rule}" stroke-width="1"/>

    ${bulletEls}

    <line x1="44" y1="362" x2="498" y2="362" stroke="${t.rule}" stroke-width="1"/>
    ${pillEls}
    <text x="498" y="402" text-anchor="end" font-family="${MONO}" font-size="12.5" font-weight="700" letter-spacing="1" fill="${t.risoRed}">EXPLORE REPO ↗</text>

    <!-- Right Gallery Framed Screenshot -->
    <g>
      <!-- Risograph offset plate backdrop -->
      <rect x="596" y="47" width="546" height="364" rx="4" fill="none" stroke="${t.risoRed}" stroke-width="1.2" opacity="0.55"/>
      <rect x="582" y="33" width="546" height="364" rx="4" fill="${t.frameShadow}"/>
      <!-- Cropped live workspace screenshot (exact 3:2 window crop) -->
      <svg x="582" y="33" width="546" height="364" viewBox="78 14 564 376">
        <image href="data:image/png;base64,${piB64}" width="720" height="405"/>
      </svg>
      <rect x="582" y="33" width="546" height="364" rx="4" fill="none" stroke="${t.border}" stroke-width="1.5"/>
      <!-- Corner calibration ticks on screenshot -->
      <path d="M574 33H580M582 25V31M1130 33H1136M1128 25V31" stroke="${t.risoBlue}" stroke-width="1.2"/>
    </g>
    <text x="582" y="430" font-family="${MONO}" font-size="11" letter-spacing="1.6" fill="${t.muted}">FIG. 01 — LIVE WORKSPACE · SESSION TREE &amp; SKILLS</text>
    <text x="1128" y="430" text-anchor="end" font-family="${MONO}" font-size="11" fill="${t.faint}">PI-AGENT-DESKTOP</text>
  `;
  return wrapSvg({
    w,
    h,
    title: "Plate 01 — Pi Agent Desktop：Pi 编程智能体开源桌面客户端",
    defs,
    body,
    theme: t,
  });
}

function buildFlagshipMobile(t, piB64) {
  const w = 640;
  const h = 736;
  const defs = [
    dotPattern("fpm-dots", t.dot, 18),
    `<clipPath id="fpm-clip"><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6"/></clipPath>`,
  ].join("");

  const pills = ["Electron", "TypeScript", "React"];
  const pillEls = pills
    .map((label, idx) => {
      const px = 30 + idx * 108;
      return `<rect x="${px}" y="672" width="98" height="30" rx="4" fill="${t.badgeBg}" stroke="${t.rule}" stroke-width="1"/><text x="${px + 49}" y="691" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${t.inkSoft}">${label}</text>`;
    })
    .join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
    <g clip-path="url(#fpm-clip)">
      <rect x="6" y="226" width="${w - 12}" height="422" fill="${t.surface}"/>
      <rect x="6" y="226" width="${w - 12}" height="422" fill="url(#fpm-dots)"/>
      <line x1="6" y1="226" x2="${w - 6}" y2="226" stroke="${t.rule}" stroke-width="1"/>
      <line x1="6" y1="648" x2="${w - 6}" y2="648" stroke="${t.rule}" stroke-width="1"/>
    </g>

    <text x="30" y="70" font-family="${SERIF}" font-size="44" font-weight="700" fill="none" stroke="${t.risoRed}" stroke-width="1.3">01</text>
    <rect x="92" y="40" width="148" height="24" rx="3" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1"/>
    <text x="166" y="56" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="700" fill="${t.risoRed}">FLAGSHIP · ★ 340</text>
    <text x="610" y="56" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.faint}">DESKTOP APP</text>

    <text x="30" y="118" font-family="${SERIF}" font-size="34" font-weight="700" fill="${t.ink}">Pi Agent Desktop</text>
    <text x="30" y="152" font-family="${SANS}" font-size="16.5" fill="${t.muted}">基于 Electron 的 Pi 编程智能体开源桌面客户端</text>
    <text x="30" y="186" font-family="${SANS}" font-size="15" fill="${t.inkSoft}">◆ 会话分叉导航 · 多模型切换 · Skills · 跨平台</text>

    <rect x="42" y="252" width="564" height="376" rx="4" fill="none" stroke="${t.risoRed}" stroke-width="1.2" opacity="0.55"/>
    <svg x="34" y="244" width="564" height="376" viewBox="78 14 564 376">
      <image href="data:image/png;base64,${piB64}" width="720" height="405"/>
    </svg>
    <rect x="34" y="244" width="564" height="376" rx="4" fill="none" stroke="${t.border}" stroke-width="1.5"/>
    <text x="34" y="638" font-family="${MONO}" font-size="11.5" fill="${t.muted}">FIG. 01 — LIVE WORKSPACE PREVIEW</text>

    ${pillEls}
    <text x="610" y="692" text-anchor="end" font-family="${MONO}" font-size="13.5" font-weight="700" fill="${t.risoRed}">EXPLORE ↗</text>
  `;
  return wrapSvg({
    w,
    h,
    title: "Plate 01 — Pi Agent Desktop（移动端）",
    defs,
    body,
    theme: t,
  });
}

// ---------------------------------------------------------------------------
// EXHIBITION INDEX DIVIDER (Desktop 1200x76 & Mobile 640x68)
// ---------------------------------------------------------------------------
function buildDivider(t) {
  const w = 1200;
  const h = 76;
  const body = `
    <line x1="6" y1="38" x2="1194" y2="38" stroke="${t.rule}" stroke-width="1"/>
    <rect x="6" y="16" width="446" height="44" fill="${t.bg}"/>
    <rect x="12" y="29" width="16" height="16" fill="${t.risoRed}"/>
    <polygon points="20,29 28,37 20,45 12,37" fill="${t.bg}"/>
    <text x="40" y="45" font-family="${MONO}" font-size="19" font-weight="700" letter-spacing="2" fill="${t.ink}">SELECTED WORKS</text>
    <text x="234" y="44" font-family="${SANS}" font-size="18" fill="${t.muted}">/  精选作品与实验</text>

    <polygon points="600,30 608,38 600,46 592,38" fill="${t.bg}" stroke="${t.risoRed}" stroke-width="1.5"/>

    <rect x="920" y="16" width="274" height="44" fill="${t.bg}"/>
    <text x="1190" y="44" text-anchor="end" font-family="${MONO}" font-size="16" letter-spacing="2" fill="${t.muted}">PLATES 02 — 07</text>
  `;
  return wrapSvg({ w, h, title: "精选作品与实验 — Plates 02-07", body, theme: t });
}

function buildDividerMobile(t) {
  const w = 640;
  const h = 68;
  const body = `
    <line x1="6" y1="34" x2="634" y2="34" stroke="${t.rule}" stroke-width="1"/>
    <rect x="6" y="12" width="388" height="44" fill="${t.bg}"/>
    <rect x="10" y="25" width="16" height="16" fill="${t.risoRed}"/>
    <polygon points="18,25 26,33 18,41 10,33" fill="${t.bg}"/>
    <text x="36" y="41" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="1.4" fill="${t.ink}">SELECTED WORKS</text>
    <text x="218" y="40" font-family="${SANS}" font-size="17" fill="${t.muted}">/  精选作品与实验</text>

    <rect x="478" y="12" width="156" height="44" fill="${t.bg}"/>
    <text x="630" y="40" text-anchor="end" font-family="${MONO}" font-size="15" letter-spacing="1.2" fill="${t.muted}">PLATES 02–07</text>
  `;
  return wrapSvg({ w, h, title: "精选作品与实验 — Plates 02-07（移动端）", body, theme: t });
}

// ---------------------------------------------------------------------------
// PLATES 02-07: SIX BESPOKE ART CARDS (560x360)
// ---------------------------------------------------------------------------
function cardShell({ plate, title, line1, line2, tags, stat, accent, art, t }) {
  const w = 560;
  const h = 360;
  const defs = [
    dotPattern(`cd-${plate}`, t.dot, 16),
    `<clipPath id="art-${plate}"><rect x="20" y="20" width="520" height="154" rx="4"/></clipPath>`,
  ].join("");

  const tagEls = tags
    .map((tg, idx) => {
      const tw = tg.length * 8.4 + 20;
      const tx = 20 + tags.slice(0, idx).reduce((acc, s) => acc + s.length * 8.4 + 28, 0);
      return `<rect x="${tx}" y="308" width="${tw}" height="24" rx="3" fill="${t.badgeBg}" stroke="${t.rule}" stroke-width="1"/><text x="${tx + tw / 2}" y="324" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${t.inkSoft}">${esc(tg)}</text>`;
    })
    .join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>

    <!-- Bespoke Art Window -->
    <rect x="20" y="20" width="520" height="154" rx="4" fill="${t.artBg}" stroke="${t.rule}" stroke-width="1"/>
    <g clip-path="url(#art-${plate})">
      <rect x="20" y="20" width="520" height="154" fill="url(#cd-${plate})"/>
      ${art}
    </g>
    <!-- Plate index tag in art window corner -->
    <rect x="30" y="28" width="84" height="22" rx="2" fill="${t.bg}" stroke="${t.rule}" stroke-width="1"/>
    <text x="72" y="43" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="1.2" fill="${accent}">PLATE ${plate}</text>

    <!-- Editorial Title + Action Arrow -->
    <text x="22" y="216" font-family="${SERIF}" font-size="25" font-weight="700" fill="${t.ink}">${esc(title)}</text>
    <text x="536" y="214" text-anchor="end" font-family="${MONO}" font-size="18" font-weight="700" fill="${accent}">↗</text>

    <!-- Two-line Chinese description -->
    <text x="22" y="250" font-family="${SANS}" font-size="15" fill="${t.muted}">${esc(line1)}</text>
    <text x="22" y="276" font-family="${SANS}" font-size="15" fill="${t.muted}">${esc(line2)}</text>

    <line x1="20" y1="296" x2="540" y2="296" stroke="${t.rule}" stroke-width="1"/>
    ${tagEls}
    <text x="538" y="324" text-anchor="end" font-family="${MONO}" font-size="12" font-weight="700" fill="${accent}">${esc(stat)}</text>
  `;
  return wrapSvg({ w, h, title: `Plate ${plate} — ${title}`, defs, body, theme: t });
}

function buildCards(t) {
  return {
    "card-resume": cardShell({
      plate: "02",
      title: "Resume Skills",
      line1: "从真实经历提炼母版，按岗位 JD 定制改写，",
      line2: "内置 ATS 可读性体检与本地 Canvas 微调。",
      tags: ["AGENT SKILL", "JS"],
      stat: "★ 49",
      accent: t.risoRed,
      t,
      art: `
        <!-- Offset resume dossier sheets -->
        <rect x="268" y="36" width="128" height="128" rx="3" fill="${t.risoBlueSoft}" stroke="${t.risoBlue}" stroke-width="1"/>
        <rect x="248" y="28" width="132" height="136" rx="3" fill="${t.bg}" stroke="${t.border}" stroke-width="1.3"/>
        <rect x="262" y="42" width="54" height="8" rx="1" fill="${t.ink}"/>
        <rect x="262" y="56" width="88" height="4" rx="1" fill="${t.rule}"/>
        <rect x="262" y="72" width="102" height="6" rx="1" fill="${t.risoRedSoft}"/>
        <rect x="262" y="72" width="42" height="6" rx="1" fill="${t.risoRed}"/>
        <rect x="262" y="88" width="96" height="4" rx="1" fill="${t.rule}"/>
        <rect x="262" y="98" width="82" height="4" rx="1" fill="${t.rule}"/>
        <rect x="262" y="114" width="102" height="6" rx="1" fill="${t.risoBlueSoft}"/>
        <rect x="262" y="114" width="66" height="6" rx="1" fill="${t.risoBlue}"/>
        <rect x="262" y="130" width="90" height="4" rx="1" fill="${t.rule}"/>
        <rect x="262" y="140" width="60" height="4" rx="1" fill="${t.rule}"/>
        <!-- Animated ATS scan beam -->
        <line x1="234" y1="44" x2="404" y2="44" stroke="${t.risoRed}" stroke-width="2" class="scan-y"/>
        <!-- Match gauge -->
        <circle cx="464" cy="96" r="36" fill="none" stroke="${t.rule}" stroke-width="6"/>
        <circle cx="464" cy="96" r="36" fill="none" stroke="${t.risoRed}" stroke-width="6" stroke-dasharray="198 226" stroke-linecap="round" transform="rotate(-90 464 96)"/>
        <text x="464" y="101" text-anchor="middle" font-family="${MONO}" font-size="14" font-weight="700" fill="${t.ink}">ATS+</text>
        <text x="64" y="138" font-family="${MONO}" font-size="11" fill="${t.faint}">FACTS → JD MATCH</text>
      `,
    }),

    "card-skills": cardShell({
      plate: "03",
      title: "Chasen-Skills",
      line1: "日常自研 Agent 技能库：涵盖并行编排、",
      line2: "X 内容洞察、AI 热点雷达与个人 IP 视觉资产。",
      tags: ["SKILLS PACK", "PY"],
      stat: "★ 33",
      accent: t.risoBlue,
      t,
      art: `
        <!-- Bauhaus modular geometric skill constellation -->
        <path d="M126 112 C210 46, 300 156, 386 84 L468 118" fill="none" stroke="${t.risoBlue}" stroke-width="1.4" stroke-dasharray="4 5" opacity="0.65"/>
        <line x1="224" y1="74" x2="320" y2="128" stroke="${t.rule}" stroke-width="1.2"/>
        <circle cx="126" cy="112" r="24" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1.4"/>
        <circle cx="126" cy="112" r="6" fill="${t.risoRed}"/>
        <rect x="200" y="50" width="44" height="44" rx="4" fill="${t.bg}" stroke="${t.border}" stroke-width="1.4"/>
        <rect x="212" y="62" width="20" height="20" fill="${t.risoBlue}" opacity="0.85"/>
        <polygon points="320,96 346,122 320,148 294,122" fill="${t.risoGoldSoft}" stroke="${t.risoGold}" stroke-width="1.4"/>
        <circle cx="386" cy="84" r="22" fill="${t.bg}" stroke="${t.risoBlue}" stroke-width="1.5"/>
        <circle cx="386" cy="84" r="7" fill="${t.risoBlue}"/>
        <polygon points="468,94 489,106 489,130 468,142 447,130 447,106" fill="${t.risoBlueSoft}" stroke="${t.border}" stroke-width="1.3"/>
        <text x="126" y="154" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${t.faint}">SWARM</text>
        <text x="222" y="112" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${t.faint}">RADAR</text>
        <text x="386" y="124" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${t.faint}">X-INTEL</text>
        <text x="468" y="158" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${t.faint}">IP-PACK</text>
      `,
    }),

    "card-gap": cardShell({
      plate: "04",
      title: "GAP · Grokbot And Pi",
      line1: "通过 pi-task (RPC) 将 Pi 接入 Grok Bot，",
      line2: "支持 Webhook 异步唤醒与灾难删除保护。",
      tags: ["RPC BRIDGE", "JS"],
      stat: "★ 26",
      accent: t.risoGold,
      t,
      art: `
        <!-- Twin orbital nodes bridged by animated RPC track + safety shield -->
        <circle cx="132" cy="98" r="34" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
        <circle cx="132" cy="98" r="24" fill="${t.risoBlueSoft}" stroke="${t.risoBlue}" stroke-width="1"/>
        <text x="132" y="102" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="700" fill="${t.ink}">GROK</text>

        <circle cx="436" cy="98" r="34" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
        <circle cx="436" cy="98" r="24" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1"/>
        <text x="436" y="102" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="700" fill="${t.ink}">PI</text>

        <line x1="168" y1="88" x2="400" y2="88" stroke="${t.risoGold}" stroke-width="1.8" class="flow-x"/>
        <line x1="168" y1="108" x2="400" y2="108" stroke="${t.risoBlue}" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.65"/>

        <!-- Center RPC guard shield -->
        <polygon points="284,60 316,74 312,114 284,132 256,114 252,74" fill="${t.bg}" stroke="${t.risoGold}" stroke-width="1.8"/>
        <text x="284" y="101" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" fill="${t.ink}">RPC</text>
        <text x="284" y="156" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${t.faint}">WEBHOOK WAKE · DELETE GUARD</text>
      `,
    }),

    "card-ecc": cardShell({
      plate: "05",
      title: "Everything Claude Code",
      line1: "Everything Claude Code 中文实战手册，",
      line2: "持续沉淀跑通的配置工作流与踩坑复盘。",
      tags: ["HANDBOOK", "DOCS"],
      stat: "★ 16",
      accent: t.risoRed,
      t,
      art: `
        <!-- Open architectural codex / handbook with vermilion bookmark -->
        <g transform="translate(178 28)">
          <!-- Left page -->
          <path d="M10 14 L102 4 V104 L10 114 Z" fill="${t.bg}" stroke="${t.border}" stroke-width="1.4"/>
          <!-- Right page -->
          <path d="M102 4 L194 14 V114 L102 104 Z" fill="${t.surface}" stroke="${t.border}" stroke-width="1.4"/>
          <!-- Vermilion bookmark ribbon -->
          <path d="M148 9 V62 L158 52 L168 62 V11 Z" fill="${t.risoRed}" opacity="0.88"/>
          <!-- Text glyphs on pages -->
          <line x1="26" y1="32" x2="84" y2="26" stroke="${t.inkSoft}" stroke-width="2.5"/>
          <line x1="26" y1="46" x2="84" y2="40" stroke="${t.rule}" stroke-width="2"/>
          <line x1="26" y1="60" x2="72" y2="55" stroke="${t.rule}" stroke-width="2"/>
          <line x1="26" y1="74" x2="84" y2="68" stroke="${t.risoBlue}" stroke-width="2" opacity="0.7"/>
          <line x1="26" y1="88" x2="64" y2="84" stroke="${t.rule}" stroke-width="2"/>
          <text x="118" y="44" font-family="${MONO}" font-size="14" font-weight="700" fill="${t.ink}">/&gt;</text>
          <line x1="118" y1="76" x2="176" y2="82" stroke="${t.rule}" stroke-width="2"/>
          <line x1="118" y1="90" x2="164" y2="95" stroke="${t.rule}" stroke-width="2"/>
        </g>
        <text x="280" y="162" text-anchor="middle" font-family="${MONO}" font-size="10.5" letter-spacing="1.2" fill="${t.faint}">CLAUDE.MD · HOOKS · WORKFLOWS</text>
      `,
    }),

    "card-visualizer": cardShell({
      plate: "06",
      title: "Pi Visualizer",
      line1: "Pi Coding Agent 中文交互式架构教程，",
      line2: "含 6 章 14 课拆解与可视化源码速查表。",
      tags: ["INTERACTIVE", "TS"],
      stat: "★ 7 · NEW",
      accent: t.risoBlue,
      t,
      art: `
        <!-- Concentric prism loop & 6-chapter topology -->
        <g transform="translate(284 96)">
          <circle r="54" fill="none" stroke="${t.rule}" stroke-width="1"/>
          <circle r="38" fill="${t.risoBlueSoft}" stroke="${t.risoBlue}" stroke-width="1.3" stroke-dasharray="6 4" class="spin-slow"/>
          <circle r="18" fill="${t.bg}" stroke="${t.risoRed}" stroke-width="1.6"/>
          <text x="0" y="4" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="700" fill="${t.ink}">LOOP</text>
          <circle cx="-118" cy="-22" r="8" fill="${t.bg}" stroke="${t.risoBlue}" stroke-width="1.5"/>
          <circle cx="-118" cy="24" r="8" fill="${t.bg}" stroke="${t.risoGold}" stroke-width="1.5"/>
          <circle cx="118" cy="-22" r="8" fill="${t.bg}" stroke="${t.risoRed}" stroke-width="1.5"/>
          <circle cx="118" cy="24" r="8" fill="${t.bg}" stroke="${t.risoBlue}" stroke-width="1.5"/>
          <path d="M-110 -22 H-52 M-110 24 H-52 M52 -22 H110 M52 24 H110" stroke="${t.risoBlue}" stroke-width="1.1" opacity="0.65"/>
        </g>
        <text x="518" y="43" text-anchor="end" font-family="${MONO}" font-size="10.5" font-weight="700" fill="${t.risoBlue}">6 CHAPTERS · 14 LESSONS</text>
      `,
    }),

    "card-auto-compact": cardShell({
      plate: "07",
      title: "Pi Auto Compact",
      line1: "Pi 极简上下文压缩扩展，发送前按阈值预压缩，",
      line2: "并在每次工具调用前实时汇报上下文压力。",
      tags: ["PI EXTENSION", "TS"],
      stat: "★ 12",
      accent: t.risoRed,
      t,
      art: `
        <!-- Context window pressure meter -> 78% threshold -> ctx.compact() -> summary capsule -->
        <text x="194" y="50" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="700" fill="${t.risoRed}">78%</text>
        <rect x="58" y="64" width="174" height="72" rx="4" fill="${t.bg}" stroke="${t.border}" stroke-width="1.4"/>
        <!-- Filled context blocks up to threshold -->
        <rect x="65" y="72" width="28" height="56" rx="2" fill="${t.risoBlueSoft}" stroke="${t.risoBlue}" stroke-width="1"/>
        <rect x="97" y="72" width="28" height="56" rx="2" fill="${t.risoBlueSoft}" stroke="${t.risoBlue}" stroke-width="1"/>
        <rect x="129" y="72" width="28" height="56" rx="2" fill="${t.risoGoldSoft}" stroke="${t.risoGold}" stroke-width="1"/>
        <rect x="161" y="72" width="27" height="56" rx="2" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1"/>
        <!-- Threshold line + headroom space -->
        <line x1="194" y1="56" x2="194" y2="142" stroke="${t.risoRed}" stroke-width="2" stroke-dasharray="3 2"/>
        <polygon points="194,54 198,59 194,64 190,59" fill="${t.risoRed}"/>
        <text x="58" y="155" font-family="${MONO}" font-size="10" fill="${t.faint}">CONTEXT</text>
        <text x="232" y="155" text-anchor="end" font-family="${MONO}" font-size="10" fill="${t.faint}">HEADROOM</text>

        <!-- Compression transition -->
        <text x="295" y="74" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="600" fill="${t.inkSoft}">ctx.compact()</text>
        <line x1="244" y1="100" x2="342" y2="100" stroke="${t.risoRed}" stroke-width="1.6" class="flow-x"/>
        <path d="M270 86 L282 100 L270 114 M314 89 L324 100 L314 111" fill="none" stroke="${t.risoBlue}" stroke-width="1.3" opacity="0.8"/>

        <!-- Compacted summary capsule -->
        <rect x="364" y="75" width="134" height="58" rx="4" fill="${t.risoBlueSoft}" stroke="${t.risoBlue}" stroke-width="1"/>
        <rect x="356" y="68" width="134" height="58" rx="4" fill="${t.bg}" stroke="${t.border}" stroke-width="1.4"/>
        <rect x="370" y="82" width="54" height="6" rx="1" fill="${t.risoRed}"/>
        <rect x="370" y="96" width="102" height="4" rx="1" fill="${t.rule}"/>
        <rect x="370" y="106" width="84" height="4" rx="1" fill="${t.rule}"/>
        <text x="423" y="155" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${t.faint}">COMPACTED</text>
      `,
    }),
  };
}

// ---------------------------------------------------------------------------
// PLATE 08: COLOPHON & CONNECT (Desktop 1200x240 & Mobile 640x380)
// ---------------------------------------------------------------------------
function buildColophonDesktop(t) {
  const w = 1200;
  const h = 240;
  const defs = [dotPattern("col-dots", t.dot, 22)].join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="url(#col-dots)"/>
    <line x1="620" y1="28" x2="620" y2="${h - 28}" stroke="${t.rule}" stroke-width="1"/>

    <!-- Left: Craft & Stack -->
    <text x="44" y="48" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="2" fill="${t.risoBlue}">08  /  CRAFT &amp; STACK</text>
    <text x="44" y="88" font-family="${MONO}" font-size="13" fill="${t.faint}">FOCUS</text>
    <text x="128" y="88" font-family="${SANS}" font-size="15.5" font-weight="600" fill="${t.ink}">AI 产品设计  ·  Agent 工作流  ·  开发者工具</text>

    <text x="44" y="128" font-family="${MONO}" font-size="13" fill="${t.faint}">STACK</text>
    <text x="128" y="128" font-family="${MONO}" font-size="15" fill="${t.inkSoft}">TypeScript  ·  React  ·  Electron  ·  Python</text>

    <text x="44" y="168" font-family="${MONO}" font-size="13" fill="${t.faint}">NOTES</text>
    <text x="128" y="168" font-family="${SANS}" font-size="15" fill="${t.muted}">在 X 与个人博客持续分享 AI 工具实测和构建记录</text>

    <text x="44" y="206" font-family="${MONO}" font-size="11" letter-spacing="1.4" fill="${t.faint}">PRINTED IN HTML/SVG  ·  GITHUB.COM/CHASEN-LIAO</text>

    <!-- Right: Open to Connect -->
    <text x="662" y="48" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="2" fill="${t.risoRed}">OPEN TO CONNECT</text>
    <text x="662" y="92" font-family="${SERIF}" font-size="25" font-weight="700" fill="${t.ink}">AI 产品经理 &amp; Agent 工程师</text>
    <text x="662" y="128" font-family="${SANS}" font-size="15.5" fill="${t.muted}">关注广州 / 深圳的校招机会与开源项目合作</text>

    <rect x="662" y="156" width="268" height="40" rx="4" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1.2"/>
    <text x="796" y="181" text-anchor="middle" font-family="${MONO}" font-size="14.5" font-weight="700" fill="${t.risoRed}">2558891266@qq.com  ↗</text>

    ${chopSeal(1098, 146, 48, t)}
  `;
  return wrapSvg({ w, h, title: "Plate 08 — 技术栈与交流联系方式", defs, body, theme: t });
}

function buildColophonMobile(t) {
  const w = 640;
  const h = 380;
  const defs = [dotPattern("colm-dots", t.dot, 20)].join("");

  const body = `
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="6" fill="url(#colm-dots)"/>

    <text x="30" y="46" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1.8" fill="${t.risoBlue}">08  /  CRAFT &amp; STACK</text>
    <text x="30" y="82" font-family="${SANS}" font-size="16" font-weight="600" fill="${t.ink}">AI 产品设计 · Agent 工作流 · 开发者工具</text>
    <text x="30" y="112" font-family="${MONO}" font-size="14" fill="${t.inkSoft}">TypeScript · React · Electron · Python</text>
    <text x="30" y="142" font-family="${SANS}" font-size="14.5" fill="${t.muted}">在 X 与博客持续分享 AI 实测和构建记录</text>

    <line x1="30" y1="170" x2="610" y2="170" stroke="${t.rule}" stroke-width="1"/>

    <text x="30" y="206" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1.8" fill="${t.risoRed}">OPEN TO CONNECT</text>
    <text x="30" y="246" font-family="${SERIF}" font-size="25" font-weight="700" fill="${t.ink}">AI 产品经理 &amp; Agent 工程师</text>
    <text x="30" y="280" font-family="${SANS}" font-size="15.5" fill="${t.muted}">关注广州 / 深圳的校招机会与开源合作</text>

    <rect x="30" y="306" width="276" height="42" rx="4" fill="${t.risoRedSoft}" stroke="${t.risoRed}" stroke-width="1.2"/>
    <text x="168" y="332" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="700" fill="${t.risoRed}">2558891266@qq.com  ↗</text>
    ${chopSeal(558, 302, 48, t)}
  `;
  return wrapSvg({ w, h, title: "Plate 08 — 技术栈与交流联系方式（移动端）", defs, body, theme: t });
}

// ---------------------------------------------------------------------------
// BUILD ALL PLATES
// ---------------------------------------------------------------------------
const piB64 = fs.readFileSync(PI_PNG).toString("base64");
fs.mkdirSync(OUT_LIGHT, { recursive: true });
fs.mkdirSync(OUT_DARK, { recursive: true });

let total = 0;
for (const [scheme, theme] of Object.entries(THEMES)) {
  const dir = scheme === "dark" ? OUT_DARK : OUT_LIGHT;
  const outputs = {
    "hero.svg": buildHeroDesktop(theme),
    "hero-mobile.svg": buildHeroMobile(theme),
    "flagship-pi.svg": buildFlagshipDesktop(theme, piB64),
    "flagship-pi-mobile.svg": buildFlagshipMobile(theme, piB64),
    "divider-works.svg": buildDivider(theme),
    "divider-works-mobile.svg": buildDividerMobile(theme),
    "colophon.svg": buildColophonDesktop(theme),
    "colophon-mobile.svg": buildColophonMobile(theme),
  };
  for (const [name, svg] of Object.entries(buildCards(theme))) {
    outputs[`${name}.svg`] = svg;
  }
  for (const [filename, content] of Object.entries(outputs)) {
    fs.writeFileSync(path.join(dir, filename), content, "utf8");
    total += 1;
  }
}

console.log(`Generated ${total} Atelier SVG plates in ${OUT_LIGHT} and ${OUT_DARK}.`);
