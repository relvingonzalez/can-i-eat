import { cleanText, dedupeItems, fetchDom, findLogo, labelToKeys } from '../lib.mjs';

const SOURCE_URL = 'https://www.freddys.com/nutrition-and-allergens';

export default {
  id: 'chain-freddys',
  name: "Freddy's Frozen Custard & Steakburgers",
  website: 'https://www.freddys.com',
  cuisine: 'Burgers & frozen custard',
  keywords: ["freddy's", 'freddys', 'burger', 'steakburger', 'frozen custard', 'ice cream', 'hot dogs', 'fast food'],
  sourceUrl: SOURCE_URL,

  async scrape() {
    const $ = await fetchDom(SOURCE_URL);
    const items = [];
    const covers = new Set();
    let category = 'Menu';

    // Section headings and allergen items, in page order.
    $('h2, .paragraph--type--allergen-item').each((_, el) => {
      if (el.tagName === 'h2') {
        category = cleanText($(el).text());
        return;
      }
      const name = cleanText($(el).find('.field-item__field-menu-item').first().text());
      if (!name) return;
      const contains = new Set();
      // Each allergen is a field like .field__field-sesame with an icon--true / icon--false marker.
      $(el).find('.field[class*="field__field-"]').each((_, field) => {
        const label = cleanText($(field).children('div').first().text());
        const keys = labelToKeys(label);
        keys.forEach(k => covers.add(k));
        if ($(field).find('.icon--true').length) {
          keys.forEach(k => contains.add(k));
        }
      });
      items.push({ category, name, contains: [...contains] });
    });

    return { logo: findLogo($, SOURCE_URL), covers: [...covers], notes: [], menu: dedupeItems(items) };
  },
};
