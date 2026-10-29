// Build a local preview of the real README.md inside GitHub's own markdown
// stylesheet, so the theme-aware <picture> panels can be checked the way a
// visitor actually sees them.
//
// The preview forces one colour scheme per file, because a headless browser
// cannot switch the OS preference from the command line.
//
//   usage: node scripts/build-preview.mjs

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, ".taste-skill", "preview");
const CSS = path.join(ROOT, ".taste-skill", "github-markdown.css");
const README = path.join(ROOT, "README.md");

const readme = fs.readFileSync(README, "utf8");

const page = (scheme) => {
  // The CSS file itself reacts to the real media query, so force it for the
  // preview and let every panel keep its own <source> logic.
  const force = scheme === "dark"
    ? `@media (prefers-color-scheme: dark) { }`
    : "";

  return `<!doctype html>
<html lang="zh-CN" data-color-mode="${scheme}" data-light-theme="light" data-dark-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>README preview — ${scheme}</title>
<link rel="stylesheet" href="../github-markdown.css">
<style>
  html { color-scheme: ${scheme}; }
  body { margin: 0; background: ${scheme === "dark" ? "#0d1117" : "#ffffff"}; }
  .markdown-body { max-width: 1012px; margin: 24px auto; padding: 32px; box-sizing: border-box; }
  @media (max-width: 767px) { .markdown-body { margin: 0 auto; padding: 16px; } }
  ${force}
</style>
</head>
<body>
<main class="markdown-body">
${readme}
</main>
</body>
</html>`;
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "light.html"), page("light"));
fs.writeFileSync(path.join(OUT, "dark.html"), page("dark"));

// A single page that keeps the real media queries: the browser decides which
// source each <picture> picks, and the emulated scheme drives the stylesheet.
// <base> points at the repository root because README.md references assets
// with repository-relative paths.
fs.writeFileSync(
  path.join(OUT, "readme.html"),
  `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base href="../../">
<title>README preview</title>
<link rel="stylesheet" href=".taste-skill/github-markdown.css">
<style>
  body { margin: 0; }
  .markdown-body { max-width: 1012px; margin: 24px auto; padding: 32px; box-sizing: border-box; }
  @media (max-width: 767px) { .markdown-body { margin: 0 auto; padding: 16px; } }
</style>
</head>
<body>
<main class="markdown-body">
${readme}
</main>
</body>
</html>`,
);

console.log("preview written to " + OUT);
