// After `astro build`: the JavaScript each prerendered page loads up front (its scripts and islands, with everything
// they import statically), gzipped, against the frame spec's budgets
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 5.). A dynamic import() loads later, on
// demand (the file analyzer), so it does not count. Exits with 1 when a page is over its budget.
// Server-rendered pages are not in dist/client; their scripts are the same small ones (the header's count, the quote
// wizard's 1–2 KB).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const BUDGETS = [
  { pattern: /^\/(webshop\/[^/]+|kosar|penztar)\/$/, limitKb: 130, label: 'webshop eszközoldal' },
  { pattern: /./, limitKb: 5, label: 'tartalmi oldal' },
];

const DATA_TYPES = /\btype="application\/(?:ld\+)?json"/;

/** The scripts a page loads (by URL or inline) and its islands' component and renderer modules. */
export function pageEntries(html) {
  const urls = new Set();
  const inline = [];
  for (const [, attrs, code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (DATA_TYPES.test(attrs)) continue;
    const src = /\bsrc="([^"]+)"/.exec(attrs)?.[1];
    if (src) urls.add(src);
    else if (code.trim()) inline.push(code);
  }
  for (const [, url] of html.matchAll(/\b(?:component-url|renderer-url)="([^"]+)"/g)) urls.add(url);
  return { urls: [...urls], inline };
}

/** The static imports of a built module: import … from "x", import "x", export … from "x". */
export function staticImports(code) {
  const found = new Set();
  for (const [, spec] of code.matchAll(/\b(?:import|export)\s*(?:[\w$*{}\s,]+?\s*from\s*)?["']([^"']+)["']/g)) found.add(spec);
  return [...found];
}

/** Gzipped bytes of the JavaScript a page loads up front; `readModule` gives a module's code by URL, or null. */
export function pageJsBytes(html, readModule) {
  const { urls, inline } = pageEntries(html);
  const seen = new Set();
  let bytes = 0;
  const visit = (url) => {
    if (/^https?:/.test(url) || seen.has(url)) return;
    seen.add(url);
    const code = readModule(url);
    if (code === null) return;
    bytes += gzipSync(code).length;
    for (const spec of staticImports(code)) visit(spec.startsWith('.') ? posix.resolve(posix.dirname(url), spec) : spec);
  };
  for (const code of inline) {
    bytes += gzipSync(code).length;
    for (const spec of staticImports(code)) visit(spec.startsWith('.') ? posix.resolve('/', spec) : spec);
  }
  urls.forEach(visit);
  return bytes;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

export function checkBudgets(clientDir) {
  const read = (url) => {
    const file = join(clientDir, ...url.split('/').filter(Boolean));
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  return htmlFiles(clientDir).map((file) => {
    const page = `/${relative(clientDir, file).split(sep).join('/')}`.replace(/index\.html$/, '').replace(/\.html$/, '');
    const budget = BUDGETS.find((b) => b.pattern.test(page));
    const kb = pageJsBytes(readFileSync(file, 'utf8'), read) / 1024;
    return { page, kb, limitKb: budget.limitKb, label: budget.label, ok: kb <= budget.limitKb };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = checkBudgets(fileURLToPath(new URL('../dist/client/', import.meta.url)));
  for (const r of results) {
    console.log(`${r.ok ? 'ok ' : 'TÚL'}  ${r.page.padEnd(28)} ${r.kb.toFixed(1).padStart(6)} KB / ${r.limitKb} KB (${r.label})`);
  }
  if (results.some((r) => !r.ok)) {
    console.error('Egy vagy több oldal JavaScriptje túllépi a keretet (működési elvek, 5. fejezet).');
    process.exit(1);
  }
}
