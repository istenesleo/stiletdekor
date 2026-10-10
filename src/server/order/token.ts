// The secret of an order's status page (/rendeles/<token>): 128 random bits, base64url without padding.
const STATUS_TOKEN = /^[A-Za-z0-9_-]{22}$/;

export function newStatusToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const isStatusToken = (value: unknown): value is string => typeof value === 'string' && STATUS_TOKEN.test(value);

export const statusPath = (token: string): string => `/rendeles/${token}`;
