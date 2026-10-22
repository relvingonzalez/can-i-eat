import { cleanText, dedupeItems, fetchDom, findLogo, labelToKeys } from '../lib.mjs';

const SOURCE_URL = 'https://firstwatch.com/nutrition-and-allergens';

export default {
  id: 'chain-first-watch',
  name: 'First Watch',
  website: 'https://www.firstwatch.com',
  cuisine: 'Breakfast & brunch',
  keywords: ['first watch', 'breakfast', 'brunch', 'lunch', 'pancakes', 'eggs', 'cafe'],
  sourceUrl: SOURCE_URL,

  async scrape() {
    const $ = await fetchDom(SOURCE_URL);
    const items = [];

    // One table per menu section. Each item row is followed by an "Allergens: Egg, Milk, ..." row.
    $('table').each((_, table) => {
      const category = cleanText($(table).find('th').first().text()) || 'Menu';
      let current;
      $(table).find('tr').each((_, row) => {
        if ($(row).hasClass('allergens-row')) {
          if (current) {
            const list = cleanText($(row).find('.allergens-list').text());
            current.contains = [...new Set(list.split(',').flatMap(label => labelToKeys(label.trim())))];
          }
          return;
        }
        // The dish name is the row's first cell (a <th> on this site), followed by the nutrition numbers.
        const name = cleanText($(row).children('th, td').first().text());
        if (!name || $(row).find('th').length > 2) return; // skip the column header row
        // Items without an allergens row keep `contains` unset, so the app reports them as unknown.
        current = { category, name };
        items.push(current);
      });
    });

    const disclaimer = cleanText($('body').text()).match(/[^.]*cross-contact[^.]*\./i)?.[0];
    return {
      logo: findLogo($, SOURCE_URL),
      covers: ['milk', 'egg', 'fish', 'shellfish', 'treenuts', 'peanut', 'wheat', 'gluten', 'soy', 'sesame', 'mustard', 'celery'],
      notes: disclaimer ? [disclaimer] : [],
      menu: dedupeItems(items),
    };
  },
};
