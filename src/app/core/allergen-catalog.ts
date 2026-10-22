/**
 * Canonical allergens the app knows about. The first nine are the FDA "Big 9".
 *
 * - keywords: words that mean the item contains the allergen (matched on word boundaries, plurals allowed)
 * - caution: phrases that are usually safe but worth a second look (e.g. highly refined oils)
 * - exclude: phrases that look like a match but aren't (e.g. "cocoa butter" for milk)
 * - aliases: what users might type for this allergen
 */
export interface CatalogAllergen {
  key: string;
  label: string;
  emoji: string;
  big9: boolean;
  keywords: string[];
  caution?: string[];
  exclude?: string[];
  aliases: string[];
}

const WHEAT_KEYWORDS = [
  'wheat', 'flour', 'semolina', 'durum', 'spelt', 'farro', 'einkorn', 'emmer', 'kamut', 'couscous', 'bulgur',
  'seitan', 'breadcrumb', 'bread crumb', 'panko', 'crouton', 'bread', 'breaded', 'breading', 'bun', 'pita',
  'naan', 'croissant', 'graham',
];
const NON_WHEAT_FLOURS = [
  'rice flour', 'corn flour', 'almond flour', 'coconut flour', 'oat flour', 'chickpea flour', 'potato flour',
  'tapioca flour', 'cassava flour', 'buckwheat flour', 'soy flour', 'bean flour', 'rye flour', 'sorghum flour',
];

export const ALLERGEN_CATALOG: CatalogAllergen[] = [
  {
    key: 'milk', label: 'Milk', emoji: '🥛', big9: true,
    aliases: ['milk', 'dairy', 'lactose', 'casein', 'whey', 'cheese', 'cows milk'],
    keywords: [
      'milk', 'dairy', 'cheese', 'butter', 'buttermilk', 'cream', 'whey', 'casein', 'caseinate', 'lactose',
      'lactalbumin', 'ghee', 'yogurt', 'yoghurt', 'kefir', 'curd', 'custard', 'ricotta', 'mozzarella', 'parmesan',
      'cheddar', 'feta', 'mascarpone', 'queso', 'crema', 'half and half', 'milkfat', 'paneer', 'brie', 'gouda',
      'provolone', 'asiago', 'romano', 'alfredo',
    ],
    exclude: [
      'cocoa butter', 'peanut butter', 'nut butter', 'almond butter', 'cashew butter', 'apple butter',
      'shea butter', 'sunflower butter', 'seed butter', 'coconut milk', 'coconut cream', 'almond milk',
      'oat milk', 'soy milk', 'rice milk', 'cashew milk', 'cream of tartar',
    ],
  },
  {
    key: 'egg', label: 'Egg', emoji: '🥚', big9: true,
    aliases: ['egg', 'eggs'],
    keywords: ['egg', 'yolk', 'albumen', 'albumin', 'ovalbumin', 'lysozyme', 'mayonnaise', 'mayo', 'meringue', 'aioli'],
  },
  {
    key: 'fish', label: 'Fish', emoji: '🐟', big9: true,
    aliases: ['fish'],
    keywords: [
      'fish', 'anchovy', 'anchovies', 'salmon', 'tuna', 'cod', 'pollock', 'tilapia', 'halibut', 'trout', 'mahi',
      'sardine', 'mackerel', 'catfish', 'snapper', 'swordfish', 'haddock', 'flounder', 'bass', 'worcestershire',
      'surimi', 'bonito', 'dashi',
    ],
  },
  {
    key: 'shellfish', label: 'Shellfish', emoji: '🦐', big9: true,
    aliases: ['shellfish', 'crustacean', 'crustaceans', 'mollusc', 'molluscs', 'mollusk', 'mollusks', 'seafood'],
    keywords: [
      'shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'crawfish', 'crayfish', 'langoustine', 'scallop', 'clam',
      'mussel', 'oyster', 'crustacean', 'mollusk', 'mollusc', 'squid', 'calamari', 'octopus', 'krill',
    ],
    exclude: ['oyster mushroom'],
  },
  {
    key: 'treenuts', label: 'Tree nuts', emoji: '🌰', big9: true,
    aliases: ['tree nut', 'tree nuts', 'treenuts', 'nut', 'nuts'],
    keywords: [
      'tree nut', 'nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'filbert', 'macadamia',
      'brazil nut', 'pine nut', 'pignoli', 'chestnut', 'praline', 'marzipan', 'nougat', 'gianduja',
    ],
    exclude: ['water chestnut'],
  },
  {
    key: 'peanut', label: 'Peanut', emoji: '🥜', big9: true,
    aliases: ['peanut', 'peanuts', 'groundnut'],
    keywords: ['peanut', 'groundnut', 'arachis'],
    caution: ['peanut oil'],
  },
  {
    key: 'wheat', label: 'Wheat', emoji: '🌾', big9: true,
    aliases: ['wheat'],
    keywords: WHEAT_KEYWORDS,
    exclude: NON_WHEAT_FLOURS,
  },
  {
    key: 'soy', label: 'Soy', emoji: '🫘', big9: true,
    aliases: ['soy', 'soya', 'soybean', 'soybeans'],
    keywords: ['soy', 'soya', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh', 'tamari', 'shoyu', 'natto'],
    caution: ['soybean oil', 'soy lecithin', 'soya lecithin'],
  },
  {
    key: 'sesame', label: 'Sesame', emoji: '🌱', big9: true,
    aliases: ['sesame', 'sesame seed', 'sesame seeds'],
    keywords: ['sesame', 'tahini', 'benne', 'gomashio', 'gomasio', 'halvah', 'halva', 'zaatar', "za'atar"],
  },
  {
    key: 'gluten', label: 'Gluten', emoji: '🍞', big9: false,
    aliases: ['gluten', 'celiac', 'coeliac'],
    keywords: ['gluten', ...WHEAT_KEYWORDS, 'barley', 'rye', 'malt', 'malted', 'triticale', "brewer's yeast", 'beer'],
    exclude: ['gluten-free', 'gluten free', ...NON_WHEAT_FLOURS.filter(f => f !== 'rye flour')],
  },
  {
    key: 'mustard', label: 'Mustard', emoji: '🟡', big9: false,
    aliases: ['mustard'],
    keywords: ['mustard'],
  },
  {
    key: 'celery', label: 'Celery', emoji: '🥬', big9: false,
    aliases: ['celery'],
    keywords: ['celery', 'celeriac'],
  },
  {
    key: 'lupin', label: 'Lupin', emoji: '🌼', big9: false,
    aliases: ['lupin', 'lupine'],
    keywords: ['lupin', 'lupine'],
  },
  {
    key: 'sulfites', label: 'Sulfites', emoji: '🍷', big9: false,
    aliases: ['sulfite', 'sulfites', 'sulphite', 'sulphites'],
    keywords: ['sulfite', 'sulphite', 'bisulfite', 'bisulphite', 'metabisulfite', 'metabisulphite', 'sulfur dioxide', 'sulphur dioxide'],
  },
  {
    key: 'corn', label: 'Corn', emoji: '🌽', big9: false,
    aliases: ['corn', 'maize'],
    keywords: ['corn', 'maize', 'cornstarch', 'cornmeal', 'popcorn', 'polenta', 'grits', 'hominy', 'masa'],
  },
];

const CATALOG_BY_KEY = new Map(ALLERGEN_CATALOG.map(a => [a.key, a]));

export function catalogEntry(key: string): CatalogAllergen | undefined {
  return CATALOG_BY_KEY.get(key);
}

/** Maps whatever the user typed ("Dairy", "tree nuts") to a catalog key, or undefined for custom allergens. */
export function resolveAllergenKey(name: string): string | undefined {
  const normalized = name.trim().toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
  return ALLERGEN_CATALOG.find(a => a.key === normalized || a.aliases.includes(normalized))?.key;
}

/** Allergens that also count as a match for the given key (wheat implies gluten and the other way round). */
export const IMPLIED_BY: Record<string, string[]> = {
  gluten: ['wheat'],
  wheat: ['gluten'],
};
