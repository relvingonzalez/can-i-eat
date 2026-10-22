import { MenuItem } from './menu-item.model';

/**
 * official:  scraped from the restaurant's own allergen/ingredient pages
 * curated:   entered by hand by the app maintainer
 * community: submitted by a user and approved by the maintainer
 */
export type RestaurantSource = 'official' | 'curated' | 'community';

export interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  cuisine?: string;
  keywords: string[];
  menu: MenuItem[];
  source: RestaurantSource;
  sourceUrl?: string;
  /** ISO date (YYYY-MM-DD) the data was last checked against the source. */
  lastVerified?: string;
  /** Catalog allergen keys the source tracks. Allergens outside this list are reported as unknown when an item has no ingredient text. */
  covers?: string[];
  /** Notes from the restaurant itself, e.g. "kitchens are not allergen-free". */
  notes?: string[];
  city?: string;

  // Computed against the active profile's allergens.
  favorite?: boolean;
  safetyRating?: number;
  counts?: Record<'safe' | 'may-contain' | 'contains' | 'unknown', number>;
}
