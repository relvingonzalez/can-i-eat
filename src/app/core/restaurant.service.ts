
import { Injectable } from '@angular/core';
import { Observable, of, from, forkJoin } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap, mergeMap, filter, toArray } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { JSONSchema, StorageMap } from "@ngx-pwa/local-storage";

import { Allergen } from '../shared/models/allergen.model';
import { FavoriteRestaurant, Restaurant } from '../shared/models/restaurant.model';
import { MenuItem } from '../shared/models/menu-item.model';
import { Menu } from '../shared/models/menu.model';

import { HelperFunctionsService } from './helper-functions.service';
import { AllergenService } from './allergen.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      logo: { type: 'string' },
      safetyRating: { type: 'number' },
      keywords:{
        type: 'array',
        items: {
          type: 'string'
        }
      },
      menu: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    },
    required: ['name']
  }
} satisfies JSONSchema;

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {

  constructor(
    private http: HttpClient,
    private firebaseService: FirebaseService,
    protected localStorage: StorageMap,
    private helperFunctionsService: HelperFunctionsService,
    private allergenService: AllergenService) {
  }

  private restaurantsUrl = 'api/restaurants';  // URL to web api

  toggleFavoriteRestaurant(restaurant: Restaurant): Observable<FavoriteRestaurant> {
    return this.localStorage.get<FavoriteRestaurant[]>('favorites', schema)
      .pipe(
        map((favoriteRestaurants) => favoriteRestaurants || []),
        mergeMap((favoriteRestaurants) => {
          const restaurantIndex = favoriteRestaurants.findIndex(r => r.id === restaurant.id);
          restaurantIndex === -1 ? favoriteRestaurants.push(restaurant) : favoriteRestaurants.splice(restaurantIndex, 1);

          return this.localStorage.set('favorites', favoriteRestaurants)
            .pipe(map(() => restaurant));
        })
      );
  }

  findInFavorites(restaurant: Restaurant): Observable<FavoriteRestaurant | undefined> {
    return this.getFavoriteRestaurants()
      .pipe(
        map((favoriteRestaurants) => favoriteRestaurants.find(r => r.id === restaurant.id))
      );
  }

  getFavoriteRestaurants(): Observable<FavoriteRestaurant[]> {
    return this.localStorage.get<FavoriteRestaurant[]>('favorites', schema).pipe(
      map(favoriteRestaurants => favoriteRestaurants || [])
    )
  }

  getProblemIngredients(menu: MenuItem[], allergens: Allergen[]) : MenuItem[] {
    for(let menuItem of menu) {
      let ingredients = menuItem.ingredients.toLowerCase();
      menuItem.problemIngredients = this.allergenService.getProblemIngredients(allergens, ingredients);
    }

    return menu || [];
  }
  getSafetyRating(menu: MenuItem[]): number {
    const safeMenuItems = menu.filter(menuItem => !menuItem.problemIngredients);
    const safetyRating: number = Math.ceil((safeMenuItems.length/menu.length) * 100);
    return safetyRating;
  }

  processRestaurants(restaurants: Restaurant[], allergens: Allergen[] = []): Restaurant[] {
    let processedRestaurants = restaurants.map((restaurant) => {
        restaurant.menu = this.getProblemIngredients(restaurant.menu, allergens);
        restaurant.safetyRating = this.getSafetyRating(restaurant.menu);
        return restaurant;
    });

    return processedRestaurants.sort((a, b) => b.safetyRating - a.safetyRating);
  }

  getRestaurants(allergens: Allergen[]): Observable<Restaurant[]> {
    return this.firebaseService.GetRestaurantsList()
      .pipe(
        map((restaurants) =>  {
          return this.processRestaurants(restaurants, allergens);
        }),
        tap(() => this.helperFunctionsService.log('fetched restaurants')),
        catchError(this.helperFunctionsService.handleError('getRestaurant', []))
      );
  }

  getRestaurant(id: string, allergens: Allergen[] = []): Observable<Restaurant | undefined> {
    return this.firebaseService.GetRestaurant(id)
      .pipe(
        mergeMap((restaurant) => {
          console.log('got ', restaurant)
          return this.findInFavorites(restaurant)
            .pipe(
              map((favorite)=> {
                if (favorite) {
                  restaurant.favorite = true;
                }

                restaurant.menu = this.getProblemIngredients(restaurant.menu, allergens);
                restaurant.safetyRating = this.getSafetyRating(restaurant.menu);

                return restaurant;
              })
            )
        }),
        tap(() => this.helperFunctionsService.log('fetched restaurant')),
        catchError(this.helperFunctionsService.handleError('getRestaurant', undefined))
      );
  }

  menuByCategory(menu: MenuItem[] = []): Menu {
    return this.helperFunctionsService.groupBy(menu, m => m.category);
  }

  /** PUT: update the Restaurant on the server */
  updateRestaurant (restaurant: Restaurant): Observable<any> {
    return this.http.put(this.restaurantsUrl, restaurant, httpOptions).pipe(
      tap(() => this.helperFunctionsService.log(`updated restaurant id=${restaurant.id}`)),
      catchError(this.helperFunctionsService.handleError<any>('updateRestaurant'))
    );
  }

  /** POST: add a new Restaurant to the server */
  addRestaurant (restaurant: Restaurant): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.restaurantsUrl, restaurant, httpOptions).pipe(
      tap((restaurant: Restaurant) => this.helperFunctionsService.log(`added Restaurant w/ id=${restaurant.id}`)),
      catchError(this.helperFunctionsService.handleError<Restaurant>('addRestaurant'))
    );
  }

  /** DELETE: delete the restaurant from the server */
  deleteRestaurant (restaurant: Restaurant | number): Observable<Restaurant> {
    const id = typeof restaurant === 'number' ? restaurant : restaurant.id;
    const url = `${this.restaurantsUrl}/${id}`;

    return this.http.delete<Restaurant>(url, httpOptions).pipe(
      tap(() => this.helperFunctionsService.log(`deleted restaurant id=${id}`)),
      catchError(this.helperFunctionsService.handleError<Restaurant>('deleteRestaurant'))
    );
  }

  /* GET restaurants whose name contains search term */
  searchRestaurants(term: string, allergens: Allergen[]): Observable<Restaurant[]> {
    if (!term.trim()) {
      // if not search term, return empty hero array.
      return of([]);
    }
    return this.firebaseService.SearchRestaurants(term.trim()).pipe(
      map((restaurants) => {
        return this.processRestaurants(restaurants, allergens);
      }),
      tap(_ => this.helperFunctionsService.log(`found restaurants matching "${term}"`)),
      catchError(this.helperFunctionsService.handleError<Restaurant[]>('searchRestaurants', []))
    );
  }

  /* GET restaurants whose name is in provided restaurants this si of type any because the list could come from google*/
  matchAndReturnRestaurants(googleRestaurants: Restaurant[] | unknown[] = [], allergens: Allergen[] = []): Observable<Restaurant[]> {
    if(!googleRestaurants || !googleRestaurants.length) {
      return of([]);
    }
    return this.firebaseService.GetRestaurantsListByNames(googleRestaurants).pipe(
      map(restaurants => restaurants.filter(restaurant => restaurant)),
      map(restaurants => this.processRestaurants(restaurants, allergens)),
      tap(_ => this.helperFunctionsService.log('unable to contact db')),
      catchError(this.helperFunctionsService.handleError<Restaurant[]>('matchAndReturnRestaurants', []))
    );
  }
}
