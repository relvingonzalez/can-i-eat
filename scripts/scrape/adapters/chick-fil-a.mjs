import { cleanText, dedupeItems, fetchDom, findLogo, labelToKeys } from '../lib.mjs';

const SOURCE_URL = 'https://www.chick-fil-a.com/nutrition-allergens';

/** The allergen table is embedded as JSON (WordPress interactivity state) under tableData.allergens. */
function findAllergenTable(node) {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  if (node.tableData && Array.isArray(node.tableData.allergens)) {
    return node.tableData.allergens;
  }
  for (const value of Object.values(node)) {
    const found = findAllergenTable(value);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function toItem(category, entry) {
  const contains = [];
  for (const field of entry.fields || []) {
    if (field.value === '1') {
      contains.push(...labelToKeys(field.label));
    }
  }
  return { category, name: cleanText(entry.title), contains: [...new Set(contains)] };
}

export default {
  id: 'chain-chick-fil-a',
  name: 'Chick-fil-A',
  website: 'https://www.chick-fil-a.com',
  cuisine: 'Chicken',
  keywords: ['chick-fil-a', 'chick fil a', 'chicken', 'sandwich', 'nuggets', 'fast food'],
  sourceUrl: SOURCE_URL,

  async scrape() {
    const $ = await fetchDom(SOURCE_URL);
    let table;
    $('script[type="application/json"]').each((_, el) => {
      if (table) return;
      try {
        table = findAllergenTable(JSON.parse($(el).text()));
      } catch {
        // not JSON we care about
      }
    });
    if (!table) {
      throw new Error('allergen table JSON not found');
    }

    const items = [];
    const covers = new Set();
    for (const section of table) {
      for (const entry of section.items || []) {
        const entries = entry.sub_items?.length ? entry.sub_items : [entry];
        for (const sub of entries) {
          (sub.fields || []).forEach(f => labelToKeys(f.label).forEach(k => covers.add(k)));
          items.push(toItem(cleanText(section.menu), sub));
        }
      }
    }

    return {
      logo: findLogo($, SOURCE_URL),
      covers: [...covers],
      menu: dedupeItems(items),
    };
  },
};
