import { buildMatcher, evaluateItem, evaluateRestaurant } from './allergen-matcher';
import { resolveAllergenKey } from './allergen-catalog';
import { MenuItem } from '../shared/models/menu-item.model';
import { Restaurant } from '../shared/models/restaurant.model';

function check(ingredients: string, ...allergens: string[]) {
  const item: MenuItem = { category: 'Test', name: 'Test item', ingredients };
  return evaluateItem(item, allergens.map(name => buildMatcher({ name })));
}

describe('allergen catalog', () => {
  it('resolves common names to catalog keys', () => {
    expect(resolveAllergenKey('Dairy')).toBe('milk');
    expect(resolveAllergenKey(' tree nuts ')).toBe('treenuts');
    expect(resolveAllergenKey('Peanuts')).toBe('peanut');
    expect(resolveAllergenKey('kiwi')).toBeUndefined();
  });
});

describe('evaluateItem', () => {
  it('finds milk derivatives the old matcher missed', () => {
    const result = check('Sugar, whey powder, salt', 'milk');
    expect(result.status).toBe('contains');
    expect(result.hits[0].terms).toEqual(['whey']);
  });

  it('does not flag eggplant for an egg allergy', () => {
    expect(check('Grilled eggplant, olive oil', 'egg').status).toBe('safe');
    expect(check('Whole eggs, vinegar', 'egg').status).toBe('contains');
  });

  it('ignores look-alike phrases', () => {
    expect(check('Cocoa butter, sugar', 'dairy').status).toBe('safe');
    expect(check('Coconut milk, curry paste', 'milk').status).toBe('safe');
    expect(check('Rice flour, water', 'wheat').status).toBe('safe');
    expect(check('Water chestnuts, bamboo shoots', 'tree nuts').status).toBe('safe');
    expect(check('Oyster mushrooms', 'shellfish').status).toBe('safe');
  });

  it('treats cross-contact statements as may-contain', () => {
    const result = check('Potatoes, canola oil. Produced in a facility where milk and sesame are present.', 'sesame');
    expect(result.status).toBe('may-contain');
    expect(result.hits[0].level).toBe('may-contain');
  });

  it('reports refined oils as a caution without failing the item', () => {
    const result = check('Chicken, soybean oil, salt', 'soy');
    expect(result.status).toBe('safe');
    expect(result.cautions[0].terms).toEqual(['soybean oil']);
    expect(check('Peanuts, peanut oil', 'peanut').cautions).toEqual([]);
  });

  it('matches custom allergens by name, including plurals', () => {
    expect(check('Kiwis, strawberries', 'kiwi').status).toBe('contains');
    expect(check('Banana', 'kiwi').status).toBe('safe');
  });

  it('counts wheat as gluten', () => {
    expect(check('Enriched wheat flour', 'gluten').status).toBe('contains');
    expect(check('Malted barley', 'gluten').status).toBe('contains');
    expect(check('Malted barley', 'wheat').status).toBe('safe');
  });

  it('highlights matched words in the ingredient text', () => {
    const result = check('Bun: wheat flour, butter', 'milk');
    expect(result.ingredientSegments).toEqual([
      { text: 'Bun: wheat flour, ' },
      { text: 'butter', level: 'contains' },
    ]);
  });

  describe('with structured allergen flags', () => {
    const waffle: MenuItem = { category: 'Breakfast', name: 'Waffle', contains: ['milk', 'egg', 'wheat'] };
    const fruit: MenuItem = { category: 'Sides', name: 'Fruit cup', contains: [] };

    it('uses the flags', () => {
      expect(evaluateItem(waffle, [buildMatcher({ name: 'dairy' })]).status).toBe('contains');
      expect(evaluateItem(fruit, [buildMatcher({ name: 'dairy' })]).status).toBe('safe');
    });

    it('is unknown for allergens the source does not track', () => {
      expect(evaluateItem(fruit, [buildMatcher({ name: 'shellfish' })], ['milk', 'egg']).status).toBe('unknown');
      expect(evaluateItem(fruit, [buildMatcher({ name: 'kiwi' })]).status).toBe('unknown');
    });

    it('flags gluten when the source flags wheat', () => {
      expect(evaluateItem(waffle, [buildMatcher({ name: 'gluten' })], ['wheat']).status).toBe('contains');
    });
  });

  it('is unknown when there is nothing to check', () => {
    const item: MenuItem = { category: 'Mains', name: 'Chef special' };
    expect(evaluateItem(item, [buildMatcher({ name: 'milk' })]).status).toBe('unknown');
  });
});

describe('evaluateRestaurant', () => {
  it('rates by share of safe items without mutating the input', () => {
    const restaurant: Restaurant = {
      id: 'r1', name: 'Test', keywords: [], source: 'curated',
      menu: [
        { category: 'A', name: 'Cheese pizza', ingredients: 'Wheat flour, mozzarella' },
        { category: 'A', name: 'Salad', ingredients: 'Lettuce, tomato' },
      ],
    };
    const rated = evaluateRestaurant(restaurant, [{ name: 'milk' }]);
    expect(rated.safetyRating).toBe(50);
    expect(rated.counts).toEqual({ 'safe': 1, 'may-contain': 0, 'contains': 1, 'unknown': 0 });
    expect(restaurant.menu[0].status).toBeUndefined();
  });
});
