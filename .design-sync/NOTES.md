# Design sync notes: Stilet UI → Claude Design

## How this repo syncs

- Shape `package` (no Storybook). `npm run build:ui` (scripts/build-ui.mjs) builds `src/ui` into `dist-ui/`
  (gitignored): an ES module with React external, one stylesheet (Google Fonts `@import` for both directions,
  the tokens, the site's element base, every component's CSS) and declarations whose `@/…` paths are rewritten
  to relative ones. The converter reads `dist-ui/package.json` (`@stiletdekor/ui`), so `srcDir` in the config is
  relative to `dist-ui/`.
- One component per folder, `src/ui/<Name>/<Name>.tsx`: the converter finds each component's JSDoc by this
  layout. A second component in the same file would get the folder name as its group, so keep them apart.
- Groups come from the `@category` tag of each component's JSDoc: basics, forms, shop, quote, content.
- The README index the design agent reads keeps only the FIRST line of each component's JSDoc, and strips
  accented letters, quotes and `;` from it. Keep that line a short plain-English sentence; put Hungarian
  examples on the next line.
- Provider: `ThemeRoot` with `theme: "neon-muhely"`, so previews show direction A; the `ThemeRoot` previews show
  both. tokens.css repeats in each theme block every token any theme changes, so nested themes are safe.
- Previews (`.design-sync/previews/<Name>.tsx`): one `export const` per cell. The converter copies the
  `export const` bodies into `<Name>.prompt.md` as examples (an `export function` is not picked up), so keep
  sample data inside the export: the example then shows the prop shapes. Do not name an export after a global
  (`Error`).
- Fonts load from Google Fonts at runtime: `[FONT_REMOTE]` is expected. It also lists the fallback families of
  the token stacks (Oswald, Impact, Bodoni 72…); that is fine.

## Finishing the first upload

This cloud session (claude.ai/code) could not authorize DesignSync (`/design-login` needs an interactive
session). On a computer with Claude Code (Claude Desktop's Code tab, or `claude` in a terminal), in a clone of
this repo:

1. `npm ci`, then `/design-login` once.
2. `/design-sync`. The config has no `projectId` yet, so it runs as a first-time import into a new project.
   Config, previews and the conventions header are ready; all 45 components were graded good on 2026-10-07
   (grades are machine-local, so the run captures and grades them again).
3. The render check needs Playwright with Chromium; the skill asks before installing it.

## Local Windows machine (Claude Desktop, 2026-10-08)

- Playwright: a Chromium is cached in `%LOCALAPPDATA%\ms-playwright\chromium-1234`, which Playwright **1.62.0**
  pins (1.63.0 pins 1243, 1.64.0 pins 1248). Install `playwright@1.62.0` into `.ds-sync/` and nothing downloads.
- DesignSync needs `/design-login` once from an interactive `claude` terminal on this machine; the Desktop app's
  Code session cannot run it and reuses the authorization afterwards.
- Grading gotcha: `.sd-input` animates `border-color` (0.12s). A capture can land mid-transition and show an
  invalid field's border half red, half grey (seen on UnitField WithError). The live render is fully red; check
  with the served preview before calling it a bug.
- The repo lives in OneDrive. If a build fails with `EPERM … dist\client`, a leftover `wrangler dev` holds it:
  kill that process tree.

## Cloud container specifics

- Chromium reaches the web only through the agent proxy. The render check and captures ran with
  `DS_CHROMIUM_PATH` set to a wrapper script that adds `--proxy-server="$HTTPS_PROXY"` and
  `--ignore-certificate-errors-spki-list=<SPKI of /root/.ccr/agent-proxy-ca.crt>`, with Playwright 1.63
  installed in `.ds-sync/` and the cached Chromium in `/opt/pw-browsers/chromium-1194`. Not needed elsewhere.

## Known render warns

- None: the final validate rendered 45/45 previews cleanly.

## Re-sync risks

- Sample data in the previews mirrors `src/domain/catalog.ts` as of 2026-10-07 (MaterialPicker prices and data
  sheets, JobTypePicker names and texts, category from-prices). Update the previews when the catalog changes:
  the design agent copies them.
- Contacts and menus are defaults inside the components (`src/domain/company.ts`, `src/ui/navigation.ts`); the
  opening hours are still a placeholder.
- `[DTS_STYLE_SYSTEM]` drops React's HTML attributes from every `.d.ts`; the conventions header lists the
  pass-through attributes instead. A real prop that shares a name with an HTML attribute could vanish from a
  contract: check the `.d.ts` and use `dtsPropsFor` if so.
- Fonts depend on Google Fonts being reachable from Claude Design (the live site loads them the same way).
