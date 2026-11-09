/**
 * Where this build thinks it lives, and whether it may be indexed.
 *
 * The site is deployed to a test URL before the real domain, so the
 * origin comes from the environment rather than being written in:
 * SITE_URL if set, else Netlify's own URL, else localhost.
 *
 * Indexing is opt-in. A test deploy that gets crawled competes with the
 * real site for the same words, so nothing is indexable until someone
 * sets INDEXABLE=true -- which is the switch to throw when the real
 * domain is connected, not before.
 */
const env = import.meta.env;

export const origin: string = (
  env.SITE_URL ??
  env.URL ??
  'http://localhost:4321'
).replace(/\/$/, '');

export const indexable: boolean = env.INDEXABLE === 'true';

/** An absolute URL for canonical, Open Graph and the sitemap. */
export const absolute = (path: string): string => new URL(path, origin + '/').href;

export const SITE_NAME = 'Penko Skumov';

/**
 * The opening sentence of a piece of content, for a meta description.
 * Nothing is written here that is not already on the page; where the
 * content has no prose, the caller falls back to the plain facts.
 */
export function firstSentence(text: string | null, limit = 155): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return undefined;
  const end = flat.search(/[.!?](\s|$)/);
  const sentence = end > 0 ? flat.slice(0, end + 1) : flat;
  return sentence.length > limit ? sentence.slice(0, limit - 1).trimEnd() + '…' : sentence;
}
