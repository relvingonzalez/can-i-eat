import { Subject, Observable } from 'rxjs';
import { takeUntil, mergeMap, tap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';

import { Allergen } from '../shared/models/allergen.model';
import { Restaurant } from '../shared/models/restaurant.model';
import { RestaurantService } from '../core/restaurant.service';
import { AllergenService } from '../core/allergen.service';
import { NgIf, AsyncPipe, NgForOf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestaurantComponent } from '../restaurant/restaurant.component';
import { RestaurantSearchComponent } from '../restaurant-search/restaurant-search.component';

@Component({
  standalone: true,
  selector: 'app-restaurants',
  templateUrl: './restaurants.component.html',
  styleUrls: ['./restaurants.component.scss'],
  imports: [MatProgressSpinnerModule, RestaurantComponent, RestaurantSearchComponent, NgIf, AsyncPipe, NgForOf]

})
export class RestaurantsComponent implements OnInit {
	private ngUnsubscribe = new Subject();
	allergens: Allergen[];
	favoriteRestaurants: Restaurant[];
	loading = false;

  constructor(private restaurantService: RestaurantService, private allergenService: AllergenService) { }

	ngOnInit() {
		this.getFavoriteRestaurants()
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe(favoriteRestaurants => {
				this.favoriteRestaurants = favoriteRestaurants;
			})
	}

	private getFavoriteRestaurants(): Observable<Restaurant[]> {
    this.loading = true;
		return this.allergenService.data$.pipe(
			mergeMap(allergens => {
				this.allergens = allergens;
				return this.restaurantService.getFavoriteRestaurants()
			}),
			mergeMap(favoriteRestaurants => {
        return this.restaurantService.matchAndReturnRestaurants(favoriteRestaurants, this.allergens)
      }),
      tap(() => {
        this.loading = false;
      })
		)
	}

	ngOnDestroy() {
	  this.ngUnsubscribe.next(true);
	  this.ngUnsubscribe.complete();
	}
}
