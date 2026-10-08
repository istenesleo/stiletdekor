// Pictures for the decision sheet: every option that names a tab (and, for the tablos, the part of it) gets a
// screenshot taken while the switcher file is built, so the sheet shows the designs themselves, also where scripts
// do not run (the OneDrive preview shows images). Taken with headless Chromium (playwright-core; the browser
// Playwright 1.62.0 pins, chromium-1234, or the installed Edge), at half scale, as JPEG.

import { mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** The screenshots to take, one per distinct tab and part, each with the options it serves ("hero/H2"). */
export function kepTerv(dontesek) {
  const felvetelek = new Map();
  for (const d of dontesek) {
    for (const o of d.opciok) {
      if (!o.kep) continue;
      const kulcs = `${o.kep.ful}|${o.kep.szelektor ?? ''}`;
      const felvetel = felvetelek.get(kulcs) ?? { kulcs, ful: o.kep.ful, szelektor: o.kep.szelektor ?? null, opciok: [] };
      felvetel.opciok.push(`${d.id}/${o.id}`);
      felvetelek.set(kulcs, felvetel);
    }
  }
  return [...felvetelek.values()];
}

const SZELESSEG = 1280;
const MAGASSAG = 860;

async function bongeszo() {
  const { chromium } = await import('playwright-core');
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: 'msedge' });
  }
}

/**
 * Takes the screenshots of `terv` from the tabs' documents (`dokumentumok`: tab id → HTML) and returns
 * option key ("hero/H2") → data URL. A screenshot that fails is reported and left out; its options show text only.
 */
export async function kepKeszites(terv, dokumentumok, { naplo = console.log } = {}) {
  const mappa = path.join(os.tmpdir(), 'stilet-latvanytervek-kepek');
  await rm(mappa, { recursive: true, force: true });
  await mkdir(mappa, { recursive: true });
  const kepek = new Map();
  const browser = await bongeszo();
  try {
    const context = await browser.newContext({
      viewport: { width: SZELESSEG, height: MAGASSAG },
      deviceScaleFactor: 0.5,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const fulek = [...new Set(terv.map((f) => f.ful))];
    for (const ful of fulek) {
      const html = dokumentumok.get(ful);
      if (!html) {
        naplo(`   ! nincs ilyen fül: ${ful}`);
        continue;
      }
      const fajl = path.join(mappa, `${ful}.html`);
      await writeFile(fajl, html, 'utf8');
      await page.goto(pathToFileURL(fajl).href, { waitUntil: 'load', timeout: 90_000 });
      if (html.includes('<x-dc')) {
        await page.waitForFunction(() => (document.getElementById('dc-root')?.childElementCount ?? 0) > 0, null, { timeout: 90_000 });
      }
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      for (const felvetel of terv.filter((f) => f.ful === ful)) {
        try {
          let clip = { x: 0, y: 0, width: SZELESSEG, height: MAGASSAG };
          if (felvetel.szelektor) {
            const elem = page.locator(felvetel.szelektor).first();
            await elem.waitFor({ state: 'attached', timeout: 30_000 });
            await elem.evaluate((el) => el.scrollIntoView({ block: 'start' }));
            await page.waitForTimeout(250);
            const doboz = await elem.boundingBox();
            if (!doboz) throw new Error('nem látszik');
            const x = Math.max(0, doboz.x);
            const y = Math.max(0, doboz.y);
            clip = { x, y, width: Math.min(doboz.width, SZELESSEG - x), height: Math.min(doboz.height, MAGASSAG - y) };
          } else {
            await page.evaluate(() => window.scrollTo(0, 0));
          }
          const kep = await page.screenshot({ type: 'jpeg', quality: 62, clip });
          const url = `data:image/jpeg;base64,${kep.toString('base64')}`;
          for (const opcio of felvetel.opciok) kepek.set(opcio, url);
          naplo(`   kép: ${ful}${felvetel.szelektor ?? ''} (${Math.round(kep.length / 1024)} kB)`);
        } catch (error) {
          naplo(`   ! a kép nem készült el: ${ful}${felvetel.szelektor ?? ''}: ${error.message}`);
        }
      }
    }
  } finally {
    await browser.close();
    await rm(mappa, { recursive: true, force: true });
  }
  return kepek;
}
