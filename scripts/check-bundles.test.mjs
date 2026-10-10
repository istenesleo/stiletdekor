import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { BUDGETS, pageEntries, pageJsBytes, staticImports } from './check-bundles.mjs';

describe('check-bundles', () => {
  it('finds the scripts and islands of a page, but not data blocks', () => {
    const html =
      '<script type="module" src="/_astro/page.js"></script>' +
      '<astro-island component-url="/_astro/Cfg.js" renderer-url="/_astro/client.js"></astro-island>' +
      '<script>window.x=1</script><script type="application/ld+json">{}</script>' +
      '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>';
    expect(pageEntries(html)).toEqual({
      urls: ['/_astro/page.js', 'https://static.cloudflareinsights.com/beacon.min.js', '/_astro/Cfg.js', '/_astro/client.js'],
      inline: ['window.x=1'],
    });
  });

  it('follows static imports, not dynamic ones', () => {
    expect(staticImports('import{a as b}from"./x.js";import"./y.js";export*from"./z.js";const m=()=>import("./lazy.js")')).toEqual([
      './x.js',
      './y.js',
      './z.js',
    ]);
  });

  it('adds up the gzipped size of what a page loads up front', () => {
    const files = {
      '/_astro/page.js': 'import"./shared.js";console.log(1)',
      '/_astro/shared.js': 'export const a=1;const l=()=>import("./lazy.js")',
      '/_astro/lazy.js': 'x'.repeat(10000),
    };
    const read = (url) => files[url] ?? null;
    const expected = gzipSync(files['/_astro/page.js']).length + gzipSync(files['/_astro/shared.js']).length;
    expect(pageJsBytes('<script type="module" src="/_astro/page.js"></script>', read)).toBe(expected);
  });

  it('gives the shop tool pages 130 KB and every other page 5 KB', () => {
    const limit = (page) => BUDGETS.find((budget) => budget.pattern.test(page)).limitKb;
    expect([limit('/webshop/molino/'), limit('/kosar/'), limit('/penztar/')]).toEqual([130, 130, 130]);
    expect([limit('/webshop/'), limit('/404')]).toEqual([5, 5]);
  });
});
