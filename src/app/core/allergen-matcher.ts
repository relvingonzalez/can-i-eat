import { ALLERGEN_CATALOG, catalogEntry, resolveAllergenKey } from './allergen-catalog';
import { Allergen } from '../shared/models/allergen.model';
import { AllergenHit, MenuItem, SafetyStatus, TextSegment } from '../shared/models/menu-item.model';
import { Restaurant } from '../shared/models/restaurant.model';

const BIG_9 = ALLERGEN_CATALOG.filter(a => a.big9).map(a => a.key);

/** Sentences containing one of these phrases describe cross-contact, not ingredients. */
const MAY_CONTAIN_TRIGGER = /may contain|may be present|(produced|processed|manufactured|made|prepared) in a (facility|kitchen)|shared (equipment|fryer|fryers|line|facility|surface)|same (line|equipment|fryer)|cross[- ]?(contact|contamination)|traces? of/i;

interface Matcher {
  allergen: Allergen;
  key?: string;
  keywords: RegExp;
  caution?: RegExp;
  exclude?: RegExp;
}

interface Range {
  start: number;
  end: number;
}

interface TextScan {
  contains: string[];
  mayContain: string[];
  caution: string[];
  ranges: (Range & { level: 'contains' | 'may-contain' })[];
}

export interface ItemEvaluation {
  status: SafetyStatus;
  hits: AllergenHit[];
  cautions: AllergenHit[];
  ingredientSegments: TextSegment[];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** One regex matching any of the terms on word boundaries, allowing simple plurals and flexible spacing. */
function termsRegex(terms: string[]): RegExp | undefined {
  if (!terms.length) {
    return undefined;
  }
  const alternatives = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(term => escapeRegExp(term.toLowerCase()).replace(/\s+/g, '[\\s-]+'));
  return new RegExp(`\\b(?:${alternatives.join('|')})(?:e?s)?\\b`, 'gi');
}

function rangesOf(regex: RegExp | undefined, text: string): (Range & { match: string })[] {
  if (!regex) {
    return [];
  }
  return [...text.matchAll(regex)].map(m => ({ start: m.index!, end: m.index! + m[0].length, match: m[0] }));
}

function overlaps(range: Range, others: Range[]): boolean {
  return others.some(o => range.start < o.end && o.start < range.end);
}

function mayContainRanges(text: string): Range[] {
  return [...text.matchAll(/[^.;\n*]+/g)]
    .filter(m => MAY_CONTAIN_TRIGGER.test(m[0]))
    .map(m => ({ start: m.index!, end: m.index! + m[0].length }));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildMatcher(allergen: Allergen): Matcher {
  const key = resolveAllergenKey(allergen.name);
  const entry = key ? catalogEntry(key) : undefined;
  if (!entry) {
    return { allergen, keywords: termsRegex([allergen.name.trim()])! };
  }
  return {
    allergen,
    key,
    keywords: termsRegex(entry.keywords)!,
    caution: termsRegex(entry.caution || []),
    exclude: termsRegex(entry.exclude || []),
  };
}

export function scanText(matcher: Matcher, text: string, mayRanges = mayContainRanges(text)): TextScan {
  const excluded = rangesOf(matcher.exclude, text);
  const cautions = rangesOf(matcher.caution, text).filter(r => !overlaps(r, excluded));
  const scan: TextScan = { contains: [], mayContain: [], caution: cautions.map(c => c.match.toLowerCase()), ranges: [] };

  for (const hit of rangesOf(matcher.keywords, text)) {
    if (overlaps(hit, excluded) || overlaps(hit, cautions)) {
      continue;
    }
    const level = overlaps(hit, mayRanges) ? 'may-contain' : 'contains';
    (level === 'contains' ? scan.contains : scan.mayContain).push(hit.match.toLowerCase());
    scan.ranges.push({ start: hit.start, end: hit.end, level });
  }
  return scan;
}

/** Splits text into plain and highlighted segments. "contains" wins over "may-contain" where they overlap. */
export function toSegments(text: string, ranges: TextScan['ranges']): TextSegment[] {
  if (!ranges.length) {
    return [{ text }];
  }
  const levels: (TextSegment['level'] | undefined)[] = new Array(text.length);
  for (const r of ranges) {
    for (let i = r.start; i < r.end; i++) {
      if (levels[i] !== 'contains') {
        levels[i] = r.level;
      }
    }
  }
  const segments: TextSegment[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = segments[segments.length - 1];
    if (last && last.level === levels[i]) {
      last.text += text[i];
    } else {
      segments.push(levels[i] ? { text: text[i], level: levels[i] } : { text: text[i] });
    }
  }
  return segments;
}

export function evaluateItem(item: MenuItem, matchers: Matcher[], covers: string[] = BIG_9): ItemEvaluation {
  const ingredients = (item.ingredients || '').trim();
  const hasStructured = Array.isArray(item.contains);
  // Without an ingredient list, the item name is the only text we can check.
  const text = ingredients || item.name || '';
  const mayRanges = mayContainRanges(text);
  const hits: AllergenHit[] = [];
  const mayHits: AllergenHit[] = [];
  const cautions: AllergenHit[] = [];
  const allRanges: TextScan['ranges'] = [];
  let unknown = false;

  for (const matcher of matchers) {
    const name = matcher.allergen.name;
    const containsTerms: string[] = [];
    const mayTerms: string[] = [];

    if (matcher.key && hasStructured) {
      const contains = item.contains || [];
      const mayContain = item.mayContain || [];
      const label = catalogEntry(matcher.key)!.label.toLowerCase();
      if (contains.includes(matcher.key)) containsTerms.push(label);
      if (mayContain.includes(matcher.key)) mayTerms.push(label);
      // Wheat always means gluten; gluten may come from barley or rye, so only "may" for wheat allergies.
      if (matcher.key === 'gluten' && contains.includes('wheat')) containsTerms.push('wheat');
      if (matcher.key === 'gluten' && mayContain.includes('wheat')) mayTerms.push('wheat');
      if (matcher.key === 'wheat' && contains.includes('gluten')) mayTerms.push('gluten');
    }

    const scan = scanText(matcher, text, mayRanges);
    containsTerms.push(...scan.contains);
    mayTerms.push(...scan.mayContain);
    allRanges.push(...scan.ranges);
    if (containsTerms.length) {
      hits.push({ allergen: name, terms: unique(containsTerms), level: 'contains' });
    } else if (mayTerms.length) {
      mayHits.push({ allergen: name, terms: unique(mayTerms), level: 'may-contain' });
    } else {
      // Only worth mentioning when nothing else gave the allergen away.
      if (scan.caution.length) {
        cautions.push({ allergen: name, terms: unique(scan.caution) });
      }
      if (!ingredients) {
        // Structured flags only vouch for the allergens the source tracks.
        const vouched = hasStructured && !!matcher.key && covers.includes(matcher.key);
        unknown = unknown || !vouched;
      }
    }
  }

  const status: SafetyStatus = hits.length ? 'contains' : mayHits.length ? 'may-contain' : unknown ? 'unknown' : 'safe';
  return {
    status,
    hits: [...hits, ...mayHits],
    cautions,
    ingredientSegments: ingredients ? toSegments(ingredients, allRanges) : [],
  };
}

export function evaluateRestaurant(restaurant: Restaurant, allergens: Allergen[]): Restaurant {
  const matchers = allergens.map(buildMatcher);
  const counts = { 'safe': 0, 'may-contain': 0, 'contains': 0, 'unknown': 0 };
  const menu = (restaurant.menu || []).map(item => {
    const evaluation = evaluateItem(item, matchers, restaurant.covers);
    counts[evaluation.status]++;
    return { ...item, ...evaluation };
  });
  const safetyRating = menu.length ? Math.round((counts.safe / menu.length) * 100) : 0;
  return { ...restaurant, menu, counts, safetyRating };
}
