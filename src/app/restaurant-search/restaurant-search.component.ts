import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap, takeUntil } from 'rxjs/operators';
import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

import { Allergen } from '../shared/models/allergen.model';
import { Restaurant } from '../shared/models/restaurant.model';
import { RestaurantService } from '../core/restaurant.service';
import { GoogleService } from '../core/google.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {RestaurantComponent} from '../restaurant/restaurant.component';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-restaurant-search',
  templateUrl: './restaurant-search.component.html',
  styleUrls: ['./restaurant-search.component.scss'],
  imports: [MatProgressSpinnerModule, MatInputModule, MatFormFieldModule, RestaurantComponent, NgIf, AsyncPipe, NgForOf]
})
export class RestaurantSearchComponent implements OnInit {
  @Input() allergens: Allergen[];
  restaurants$: Observable<Restaurant[]>;
  private ngUnsubscribe = new Subject();
  private restaurants = new Subject<any>();
  public searchInput: string;

  constructor(
    private restaurantService: RestaurantService,
    private googleService: GoogleService) {
  }

  // Push a search term into the observable stream.
  searchKeyword(term: string): void {
    this.restaurants.next({request: 'search', payload: term});
  }

  ngOnInit(): void {
		this.all();

    this.restaurants$ = this.restaurants.pipe(
      // wait 300ms after each keystroke before considering the term
      debounceTime(300),
      // ignore new term if same as previous term
      distinctUntilChanged(),
      // switch to new search observable each time the term changes
      switchMap((terms: any) => {
        switch(terms.request) {
          case 'search':
            return this.restaurantService.searchRestaurants(terms.payload.trim(), this.allergens);
          case 'match':
            return this.restaurantService.matchAndReturnRestaurants(terms.payload, this.allergens);
          default:
            return this.restaurantService.getRestaurants(this.allergens);
        }
      })
    );

    //this.restaurants.next({request: 'get', payload: ''});
  }

  ngOnChanges(changes: SimpleChanges): void{
    if(changes['allergens'] && changes['allergens']['previousValue']) {
      this.restaurants.next({request: 'get', payload: ''});
    }
  }

  all() {
    this.restaurants.next({request: 'get', payload: ''});
  }
  nearbyAndSafe(){
    const callback = (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        this.restaurants.next({request: 'match', payload: results});
      }
    }

    this.googleService.getNearbyRestaurants(callback)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }
}
