import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, NEVER, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
import { JSONSchema, StorageMap } from '@ngx-pwa/local-storage';

import { MenuItem } from '../shared/models/menu-item.model';
import { Restaurant } from '../shared/models/restaurant.model';
import { AllergenService } from './allergen.service';
import { evaluateRestaurant } from './allergen-matcher';
import { FirebaseService } from './firebase.service';
import { HelperFunctionsService } from './helper-functions.service';

type StaticRestaurant = Restaurant & { replaces?: string[] };

interface RestaurantFile {
  restaurants: StaticRestaurant[];
}

export interface DishResult {
  restaurant: Restaurant;
  item: MenuItem;
}

const favoriteIdsSchema = { type: 'array', items: { type: 'string' } } satisfies JSONSchema;
// Favorites used to be stored as whole restaurant objects.
const legacyFavoritesSchema = {
  type: 'array',
  items: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
} satisfies JSONSchema;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .replace(/(restaurants?|burgers?)$/, '');
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private favoriteIds = new BehaviorSubject<string[]>([]);

  /**
   * Restaurant data ships as static files in src/assets/data (see scripts/). Chains scraped from
   * official sources override hand-entered restaurants they replace. Loaded in the browser only,
   * so prerendered pages show a spinner instead of an empty list.
   */
  private staticRestaurants$: Observable<StaticRestaurant[]> = !isPlatformBrowser(inject(PLATFORM_ID)) ? NEVER : combineLatest([
    this.http.get<RestaurantFile>('assets/data/chains.json'),
    this.http.get<RestaurantFile>('assets/data/restaurants.json'),
  ]).pipe(
    map(([chains, curated]) => {
      const replaced = new Set(chains.restaurants.flatMap(r => r.replaces || []));
      return [...chains.restaurants, ...curated.restaurants.filter(r => !replaced.has(r.id))];
    }),
    catchError(this.helperFunctionsService.handleError('loadRestaurants', [] as StaticRestaurant[])),
    shareReplay(1)
  );

  private allRestaurants$: Observable<StaticRestaurant[]> = combineLatest([
    this.staticRestaurants$,
    this.firebaseService.approvedRestaurants().pipe(
      startWith([] as Restaurant[]),
      catchError(this.helperFunctionsService.handleError('approvedRestaurants', [] as Restaurant[]))
    ),
  ]).pipe(
    map(([known, community]) => [...known, ...community]),
    shareReplay(1)
  );

  /** Every restaurant, rated against the active profile, safest first. */
  readonly restaurants$: Observable<Restaurant[]> = combineLatest([
    this.allRestaurants$,
    this.allergenService.allergens$,
    this.favoriteIds,
  ]).pipe(
    map(([restaurants, allergens, favorites]) => restaurants
      .map(r => ({
        ...evaluateRestaurant(r, allergens),
        favorite: favorites.some(id => id === r.id || (r.replaces || []).includes(id)),
      }))
      .sort((a, b) => (b.safetyRating! - a.safetyRating!) || a.name.localeCompare(b.name))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private http: HttpClient,
    protected localStorage: StorageMap,
    private firebaseService: FirebaseService,
    private helperFunctionsService: HelperFunctionsService,
    private allergenService: AllergenService) {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    this.localStorage.get<string[]>('favoriteIds', favoriteIdsSchema).subscribe(ids => {
      if (ids) {
        this.favoriteIds.next(ids);
        return;
      }
      this.localStorage.get<{ id: string }[]>('favorites', legacyFavoritesSchema)
        .pipe(catchError(() => of(undefined)))
        .subscribe(legacy => this.saveFavorites((legacy || []).map(r => r.id)));
    });
  }

  private saveFavorites(ids: string[]): void {
    this.favoriteIds.next(ids);
    this.localStorage.set('favoriteIds', ids, favoriteIdsSchema).subscribe();
  }

  getRestaurant(id: string): Observable<Restaurant | undefined> {
    return this.restaurants$.pipe(
      map(restaurants => restaurants.find(r => r.id === id || ((r as StaticRestaurant).replaces || []).includes(id)))
    );
  }

  toggleFavorite(restaurant: Restaurant): void {
    const ids = this.favoriteIds.value;
    const aliases = [restaurant.id, ...((restaurant as StaticRestaurant).replaces || [])];
    this.saveFavorites(ids.some(id => aliases.includes(id))
      ? ids.filter(id => !aliases.includes(id))
      : [...ids, restaurant.id]);
  }

  /** Finds a known restaurant by name, e.g. to match places from a map search. */
  findByName(restaurants: Restaurant[], ...names: (string | undefined)[]): Restaurant | undefined {
    const wanted = names.filter((n): n is string => !!n).map(normalizeName).filter(n => n.length > 2);
    return restaurants.find(r => wanted.includes(normalizeName(r.name)));
  }

  menuByCategory(menu: MenuItem[] = []): Record<string, MenuItem[]> {
    return this.helperFunctionsService.groupBy(menu, m => m.category);
  }
}

export function searchRestaurants(restaurants: Restaurant[], term: string): Restaurant[] {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return restaurants;
  }
  return restaurants.filter(r => {
    const haystack = [r.name, r.cuisine, r.city, ...(r.keywords || [])].join(' ').toLowerCase();
    return words.every(word => haystack.includes(word));
  });
}

export function searchDishes(restaurants: Restaurant[], term: string, safeOnly: boolean, limit = 200): DishResult[] {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [];
  }
  const results: DishResult[] = [];
  for (const restaurant of restaurants) {
    for (const item of restaurant.menu) {
      if (safeOnly && item.status !== 'safe') {
        continue;
      }
      const haystack = `${item.name} ${item.category}`.toLowerCase();
      if (words.every(word => haystack.includes(word))) {
        results.push({ restaurant, item });
      }
    }
  }
  const rank = { 'safe': 0, 'may-contain': 1, 'unknown': 2, 'contains': 3 };
  return results.sort((a, b) => rank[a.item.status || 'unknown'] - rank[b.item.status || 'unknown']).slice(0, limit);
}
