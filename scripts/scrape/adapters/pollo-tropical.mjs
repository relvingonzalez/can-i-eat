import { dedupeItems, fetchText } from '../lib.mjs';

const SOURCE_URL = 'https://www.pollotropical.com/nutrition';

/** Codes from the page's "Allergen key". */
const CODES = {
  D: ['milk'], E: ['egg'], W: ['wheat'], P: ['peanut'], S: ['soy'], F: ['fish'],
  SF: ['shellfish'], TN: ['treenuts'], G: ['gluten'], SE: ['sesame'],
};

export default {
  id: 'chain-pollo-tropical',
  name: 'Pollo Tropical',
  website: 'https://www.pollotropical.com',
  cuisine: 'Caribbean chicken',
  keywords: ['pollo tropical', 'chicken', 'caribbean', 'latin', 'rice', 'bowls', 'tropichop'],
  sourceUrl: SOURCE_URL,

  async scrape() {
    const html = await fetchText(SOURCE_URL);
    // The chart is an inline JS array: [name, category, ...nutrition, allergens ("D,E,W,G"), veg].
    const match = html.match(/var DATA = (\[[\s\S]*?\]);\s*\n/);
    if (!match) {
      throw new Error('nutrition DATA array not found');
    }
    const rows = JSON.parse(match[1].replace(/\/\/[^\n]*/g, '').replace(/,\s*\]/g, ']'));

    const items = rows.map(row => {
      const codes = String(row[13] || '').split(',').map(c => c.replace(/\*/g, '').trim().toUpperCase()).filter(Boolean);
      // An unexplained asterisk (e.g. "S*") is treated as contains, the cautious reading.
      return { category: row[1], name: row[0], contains: [...new Set(codes.flatMap(c => CODES[c] || []))] };
    });

    const logo = html.match(/<link[^>]+rel="apple-touch-icon"[^>]+href="([^"]+)"/)?.[1];
    return {
      logo: logo ? new URL(logo, SOURCE_URL).toString() : undefined,
      covers: ['milk', 'egg', 'wheat', 'peanut', 'soy', 'fish', 'shellfish', 'treenuts', 'gluten', 'sesame'],
      notes: [],
      menu: dedupeItems(items),
    };
  },
};
