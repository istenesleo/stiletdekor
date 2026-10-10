// What the site's forms share on the server: the trap field, the form token, the rate limiter, and the two
// messages that offer the phone instead.
import { COMPANY } from '@/domain/company';

/** A field people never see; bots fill it in. */
export const HONEYPOT_FIELD = 'honlap';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A UUID as text (upload ids, form tokens). */
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

/** A one-time form token (a UUID) as the form sent it. */
export const isFormToken = isUuid;

export const TOO_MANY_MESSAGE = `Túl sok kérés érkezett erről a címről. Kérjük, próbálja újra egy perc múlva, vagy hívjon: ${COMPANY.phone.display}.`;
export const SAVE_FAILED_MESSAGE = `Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: ${COMPANY.phone.display}.`;

/** Asks the rate limiter about this visitor; lets the request through when there is no limiter or it fails. */
export async function limiterAllows(limiter: Pick<RateLimit, 'limit'> | undefined, key: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    return (await limiter.limit({ key })).success;
  } catch (error) {
    console.error('A beküldési korlát nem elérhető:', error);
    return true;
  }
}
