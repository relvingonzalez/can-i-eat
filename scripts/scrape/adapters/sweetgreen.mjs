import { cleanText, dedupeItems, fetchDom, findLogo } from '../lib.mjs';

const SOURCE_URL = 'https://www.sweetgreen.com/nutrition/';

/** "Herby Medley<span>Select Boston locations only</span>" -> "Herby Medley (Select Boston locations only)" */
function nameWithAvailability($, el) {
  const copy = el.clone();
  const availability = cleanText(copy.find('.nutrition-availability').remove().text());
  const name = cleanText(copy.text());
  return availability ? `${name} (${availability})` : name;
}

export default {
  id: 'chain-sweetgreen',
  name: 'Sweetgreen',
  website: 'https://www.sweetgreen.com',
  cuisine: 'Salads & bowls',
  keywords: ['sweetgreen', 'salad', 'salads', 'bowls', 'healthy', 'vegetarian'],
  sourceUrl: SOURCE_URL,

  async scrape() {
    const $ = await fetchDom(SOURCE_URL);
    const items = [];

    // Menu items only publish a "Contains gluten?" column, so that's the only allergen they vouch for.
    $('section.nutrition-table-section').each((_, section) => {
      const category = cleanText($(section).find('h2, h3').first().text());
      $(section).find('tbody tr').each((_, row) => {
        const name = nameWithAvailability($, $(row).find('th[scope="row"]'));
        const gluten = cleanText($(row).find('td[data-label="Contains gluten?"]').text()).toLowerCase();
        if (name && (gluten === 'yes' || gluten === 'no')) {
          items.push({ category, name, contains: gluten === 'yes' ? ['gluten'] : [] });
        }
      });
    });

    // Individual ingredients (bases, toppings, dressings) come with full ingredient lists.
    $('section.nutrition-ingredients-group').each((_, group) => {
      const heading = cleanText($(group).find('h3').first().text()) || 'Bases & toppings';
      $(group).find('.nutrition-ingredients-list__item').each((_, entry) => {
        const name = nameWithAvailability($, $(entry).find('dt'));
        const text = cleanText($(entry).find('dd').text());
        const ingredients = /not available online/i.test(text) ? undefined : text;
        if (name) {
          items.push({ category: `Ingredients: ${heading}`, name, ingredients });
        }
      });
    });

    const notes = $('section.nutrition-section--allergens p')
      .map((_, p) => cleanText($(p).text()))
      .get()
      .filter(Boolean);

    return { logo: findLogo($, SOURCE_URL), covers: ['gluten'], notes, menu: dedupeItems(items) };
  },
};
