import { cleanText, dedupeItems, fetchDom, labelToKeys } from '../lib.mjs';

const SOURCE_URL = 'https://www.in-n-out.com/menu/nutrition-info';

function categoryFor(name) {
  if (/burger|double|cheese|3x3|4x4|protein style|grilled cheese/i.test(name)) return 'Burgers';
  if (/fries/i.test(name)) return 'Fries';
  if (/shake/i.test(name)) return 'Shakes';
  return 'Drinks & extras';
}

/** "Allergen: Wheat (Gluten)" / "Allergens: Milk, Soy" -> ['wheat', 'gluten', 'milk', 'soy'] */
function declaredAllergens(text) {
  const keys = new Set();
  for (const m of text.matchAll(/Allergens?:\s*([^.*\n]+?)(?=\s+[A-Z][a-z]+\s*[:*]|\s*[*\n]|\s*$|\.\s)/g)) {
    m[1].split(/,|\band\b/).forEach(label => labelToKeys(label.trim()).forEach(k => keys.add(k)));
  }
  return [...keys];
}

function ingredientText($, el) {
  return $(el).find('p').map((_, p) => cleanText($(p).text())).get()
    .filter(text => text && !/^Ingredients$/i.test(text) && !/proud of the quality/i.test(text))
    .join('\n');
}

export default {
  id: 'chain-in-n-out',
  name: 'In-N-Out Burger',
  website: 'https://www.in-n-out.com',
  cuisine: 'Burgers',
  keywords: ['in-n-out', 'in n out', 'innout', 'burger', 'burgers', 'fries', 'shakes', 'fast food'],
  sourceUrl: SOURCE_URL,
  // Supersedes the hand-entered "In n Out" restaurant in restaurants.json (old favorites keep working).
  replaces: ['UHdgmxdFk67yHsNdxYCd'],

  async scrape() {
    const $ = await fetchDom(SOURCE_URL);
    const items = [];

    $('#nutrition-accordion > .nutrition-header').each((_, header) => {
      const panel = $(header).next('.js-accordion__panel');
      const name = cleanText(panel.find('header h2').first().text()) || cleanText($(header).text());
      const category = categoryFor(name);

      const ingredients = ingredientText($, panel.find('.js-accordion__panel.ingredients').first());
      if (ingredients) {
        items.push({ category, name, ingredients, contains: declaredAllergens(ingredients) });
      }

      // Variants such as "With mustard & ketchup instead of spread" have their own ingredient list.
      panel.find('.nutrition-extra-ingredients').each((_, extra) => {
        const variant = cleanText($(extra).prev('.js-accordion__header').text());
        const text = ingredientText($, $(extra).find('.ingredients'));
        if (variant && text) {
          items.push({ category, name: `${name} — ${variant}`, ingredients: text, contains: declaredAllergens(text) });
        }
      });
    });

    return {
      logo: 'https://www.in-n-out.com/ResourcePackages/INNOUT/content/images/logo-2021.svg?package=INNOUT',
      covers: ['milk', 'egg', 'fish', 'shellfish', 'treenuts', 'peanut', 'wheat', 'soy', 'sesame'],
      notes: [],
      menu: dedupeItems(items),
    };
  },
};
