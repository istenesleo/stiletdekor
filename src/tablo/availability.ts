/** The /tablo board is a design tool: dev sites, Previews and local dev only, never production. */
export const boardAvailable = (siteEnv: unknown): boolean => siteEnv !== 'production';
