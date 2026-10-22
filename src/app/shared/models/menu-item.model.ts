export type SafetyStatus = 'safe' | 'may-contain' | 'contains' | 'unknown';

export interface AllergenHit {
  /** The allergen as the user named it, e.g. "dairy". */
  allergen: string;
  /** The words in the menu data that triggered it, e.g. ["whey", "butter"]. */
  terms: string[];
  level?: 'contains' | 'may-contain';
}

export interface TextSegment {
  text: string;
  level?: 'contains' | 'may-contain';
}

export interface MenuItem {
  id?: string;
  category: string;
  name: string;
  /** Free-text ingredient list as published by the restaurant. */
  ingredients?: string;
  /** Catalog allergen keys the source explicitly flags (e.g. "milk", "treenuts"). */
  contains?: string[];
  /** Catalog allergen keys the source flags as possible cross-contact. */
  mayContain?: string[];

  // Computed against the active profile's allergens.
  status?: SafetyStatus;
  hits?: AllergenHit[];
  cautions?: AllergenHit[];
  ingredientSegments?: TextSegment[];
}
