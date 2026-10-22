import { cleanText, dedupeItems, fetchDom, findLogo, labelToKeys } from '../lib.mjs';

const SOURCE_URL = 'https://papajohns.com/allergens/papa-johns-allergen-guide.html';

export default {
  id: 'chain-papa-johns',
  name: "Papa John's",
  website: 'https://www.papajohns.com',
  cuisine: 'Pizza',
  keywords: ['papa johns', "papa john's", 'pizza', 'wings', 'delivery'],
  sourceUrl: SOURCE_URL,

  async scrape() {
    const $ = await fetchDom(SOURCE_URL);
    const table = $('table').first();
    // Header: Item | Peanut | Tree Nut | Egg | Milk | Wheat | Soy | Fish | Shellfish | Sesame
    const columnKeys = table.find('tr').first().find('th, td').map((_, c) => [labelToKeys(cleanText($(c).text()))]).get();
    if (columnKeys.length < 10) {
      throw new Error('allergen table header not found');
    }

    const items = [];
    let category = 'Menu';
    table.find('tr').slice(1).each((_, row) => {
      const cells = $(row).find('th, td');
      const name = cleanText(cells.first().text());
      if (!name) return;
      // Item rows start with a row header; category rows ("Crust Options") don't.
      if (cells.first().attr('scope') !== 'row') {
        category = name;
        return;
      }
      const contains = new Set();
      const mayContain = new Set();
      cells.slice(1).each((i, cell) => {
        const mark = cleanText($(cell).text());
        // ✔ = contains; * = made/stored in a facility with it; *** = same production line.
        const target = mark.includes('✔') ? contains : mark.includes('*') ? mayContain : undefined;
        columnKeys[i + 1]?.forEach(key => target?.add(key));
      });
      items.push({ category, name: name.replace(/\s*\*+$/, ''), contains: [...contains], mayContain: [...mayContain] });
    });

    // Footnotes like "* May be produced/stored in a facility that utilizes that allergen."
    const notes = cleanText($('body').text()).match(/\*+ ?May [^.]+\./g) || [];
    return {
      logo: findLogo($, SOURCE_URL),
      covers: ['peanut', 'treenuts', 'egg', 'milk', 'wheat', 'soy', 'fish', 'shellfish', 'sesame'],
      notes,
      menu: dedupeItems(items),
    };
  },
};
