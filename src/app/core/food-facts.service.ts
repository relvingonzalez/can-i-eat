import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MenuItem } from '../shared/models/menu-item.model';

export interface Product {
  code: string;
  name: string;
  brand?: string;
  image?: string;
  url: string;
  item: MenuItem;
  /** Catalog keys Open Food Facts reports on; others are unknown unless the ingredient text says otherwise. */
  covers: string[];
}

interface OffResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_small_url?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    allergens_tags?: string[];
    traces_tags?: string[];
  };
}

/** Open Food Facts allergen tags -> catalog keys. */
const OFF_TAGS: Record<string, string> = {
  'en:milk': 'milk',
  'en:eggs': 'egg',
  'en:fish': 'fish',
  'en:crustaceans': 'shellfish',
  'en:molluscs': 'shellfish',
  'en:nuts': 'treenuts',
  'en:peanuts': 'peanut',
  'en:gluten': 'gluten',
  'en:soybeans': 'soy',
  'en:sesame-seeds': 'sesame',
  'en:mustard': 'mustard',
  'en:celery': 'celery',
  'en:lupin': 'lupin',
  'en:sulphur-dioxide-and-sulphites': 'sulfites',
};

function toKeys(tags: string[] = []): string[] {
  return [...new Set(tags.map(tag => OFF_TAGS[tag]).filter(Boolean))];
}

/** Packaged food lookup via Open Food Facts: free, no key, open data (ODbL). */
@Injectable({
  providedIn: 'root'
})
export class FoodFactsService {
  constructor(private http: HttpClient) {}

  lookup(code: string): Observable<Product | undefined> {
    const fields = 'product_name,brands,image_front_small_url,ingredients_text,ingredients_text_en,allergens_tags,traces_tags';
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`;
    return this.http.get<OffResponse>(url).pipe(
      map(response => {
        const p = response.product;
        if (response.status !== 1 || !p) {
          return undefined;
        }
        const ingredients = p.ingredients_text_en || p.ingredients_text || '';
        const name = p.product_name || 'Unnamed product';
        return {
          code,
          name,
          brand: p.brands?.split(',')[0]?.trim(),
          image: p.image_front_small_url,
          url: `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
          covers: ingredients ? [...new Set(Object.values(OFF_TAGS))] : [],
          item: {
            category: 'Product',
            name,
            ingredients,
            contains: toKeys(p.allergens_tags),
            mayContain: toKeys(p.traces_tags),
          },
        };
      })
    );
  }
}
