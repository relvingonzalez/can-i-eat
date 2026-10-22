import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

import { AllergenService } from '../core/allergen.service';
import { RestaurantService, searchRestaurants } from '../core/restaurant.service';
import { RestaurantComponent } from '../restaurant/restaurant.component';
import { AllergenPickerComponent } from '../shared/components/allergen-picker.component';

type SortOrder = 'safest' | 'name';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.scss' ],
  imports: [
    AsyncPipe, FormsModule, RouterLink, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatProgressSpinnerModule, RestaurantComponent, AllergenPickerComponent,
  ],
})
export class DashboardComponent {
  readonly term$ = new BehaviorSubject('');
  readonly sort$ = new BehaviorSubject<SortOrder>('safest');
  /** Keeps the onboarding picker open after the first tap, until the user is done. */
  picking = false;

  readonly vm$ = combineLatest([
    this.restaurantService.restaurants$,
    this.allergenService.activeProfile$,
    this.term$.pipe(debounceTime(150), distinctUntilChanged(), startWith('')),
    this.sort$,
  ]).pipe(
    map(([restaurants, profile, term, sort]) => {
      const results = searchRestaurants(restaurants, term);
      return {
        profile,
        term,
        favorites: restaurants.filter(r => r.favorite),
        results: sort === 'name' ? [...results].sort((a, b) => a.name.localeCompare(b.name)) : results,
        total: restaurants.length,
        dishes: restaurants.reduce((sum, r) => sum + r.menu.length, 0),
        safeDishes: restaurants.reduce((sum, r) => sum + (r.counts?.safe || 0), 0),
      };
    })
  );

  constructor(private restaurantService: RestaurantService, private allergenService: AllergenService) {}
}
