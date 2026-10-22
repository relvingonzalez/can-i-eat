import * as cheerio from 'cheerio';

const USER_AGENT = 'CanIEatBot/1.0 (personal allergy app; +https://github.com/relvingonzalez/can-i-eat)';

export async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' } });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  return res.text();
}

export async function fetchDom(url) {
  return cheerio.load(await fetchText(url));
}

export function slug(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');
}

export function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').replace(/\s+([,.;:)\]])/g, '$1').trim();
}

/** Labels restaurants use for allergens -> the app's catalog keys (see src/app/core/allergen-catalog.ts). */
const LABEL_TO_KEYS = [
  [/wheat\s*\(gluten\)|gluten\s*\(wheat\)/i, ['wheat', 'gluten']],
  [/^(milk|dairy)/i, ['milk']],
  [/^eggs?/i, ['egg']],
  [/^soy/i, ['soy']],
  [/^wheat/i, ['wheat']],
  [/^gluten/i, ['gluten']],
  [/^sesame/i, ['sesame']],
  [/^tree[\s-]?nuts?/i, ['treenuts']],
  [/^peanuts?/i, ['peanut']],
  [/^fish/i, ['fish']],
  [/^(shellfish|crustacean|mollus)/i, ['shellfish']],
  [/^mustard/i, ['mustard']],
];

export function labelToKeys(label) {
  const text = cleanText(label).replace(/\*+/g, '');
  return LABEL_TO_KEYS.find(([regex]) => regex.test(text))?.[1] || [];
}

export function absoluteUrl(href, base) {
  try {
    return href ? new URL(href, base).toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Best effort logo: apple-touch-icon, then og:image. */
export function findLogo($, base) {
  const href = $('link[rel="apple-touch-icon"]').attr('href') || $('meta[property="og:image"]').attr('content');
  return absoluteUrl(href, base);
}

export function dedupeItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const id = slug(`${item.category}-${item.name}`);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    item.id = id;
    return true;
  });
}
