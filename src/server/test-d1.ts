// A real, in-memory D1 for the store tests: wrangler's getPlatformProxy reads wrangler.jsonc and starts a local
// runtime; reset() drops every table and applies all migrations in migrations/, in order. Tests only.
import { readdirSync, readFileSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';

const MIGRATIONS = 'migrations';

function statements(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .flatMap((file) =>
      readFileSync(`${MIGRATIONS}/${file}`, 'utf8')
        .replace(/--[^\n]*/g, '')
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean),
    );
}

export async function testDatabase() {
  const proxy = await getPlatformProxy<Env>({ persist: false });
  const db = proxy.env.DB;
  return {
    db,
    async reset() {
      const { results } = await db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .all<{ name: string }>();
      for (const { name } of results.filter((t) => !t.name.startsWith('_cf_'))) {
        await db.prepare(`DROP TABLE IF EXISTS "${name}"`).run();
      }
      await db.batch(statements().map((statement) => db.prepare(statement)));
    },
    dispose: () => proxy.dispose(),
  };
}
