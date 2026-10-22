import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, KeyValuePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { AllergenService } from '../core/allergen.service';
import { catalogEntry, resolveAllergenKey } from '../core/allergen-catalog';
import { RestaurantService } from '../core/restaurant.service';
import { SafetyStatus } from '../shared/models/menu-item.model';
import { Restaurant } from '../shared/models/restaurant.model';
import { SOURCE_LABELS } from '../restaurant/restaurant.component';
import { IngredientTextComponent } from '../shared/components/ingredient-text.component';
import { RestaurantAvatarComponent } from '../shared/components/restaurant-avatar.component';
import { STATUS_LABELS, StatusPillComponent } from '../shared/components/status-pill.component';

type StatusFilter = SafetyStatus | 'all';

@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.scss'],
  imports: [
    AsyncPipe, KeyValuePipe, FormsModule, RouterLink, MatButtonModule, MatExpansionModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule, IngredientTextComponent, RestaurantAvatarComponent,
    StatusPillComponent,
  ],
})
export class RestaurantDetailComponent {
  readonly filter$ = new BehaviorSubject<StatusFilter>('all');
  readonly term$ = new BehaviorSubject('');
  readonly filters: StatusFilter[] = ['all', 'safe', 'may-contain', 'unknown', 'contains'];
  readonly filterLabels: Record<StatusFilter, string> = { all: 'All', ...STATUS_LABELS };
  readonly sourceLabels = SOURCE_LABELS;
  /** Keep menu categories in source order instead of KeyValuePipe's alphabetical order. */
  readonly sourceOrder = () => 0;

  readonly vm$ = combineLatest([
    this.route.paramMap.pipe(switchMap(params => this.restaurantService.getRestaurant(params.get('id') || ''))),
    this.allergenService.allergens$,
    this.filter$,
    this.term$,
  ]).pipe(
    map(([restaurant, allergens, filter, term]) => {
      if (!restaurant) {
        return { restaurant: undefined, filter, term, hasAllergens: false, menu: {}, shown: 0, untracked: [] as string[] };
      }
      const words = term.toLowerCase().split(/\s+/).filter(Boolean);
      const items = restaurant.menu.filter(item =>
        (filter === 'all' || item.status === filter) &&
        words.every(w => `${item.name} ${item.ingredients || ''}`.toLowerCase().includes(w)));
      return {
        restaurant,
        filter,
        term,
        hasAllergens: allergens.length > 0,
        menu: this.restaurantService.menuByCategory(items),
        shown: items.length,
        untracked: this.untracked(restaurant, allergens.map(a => a.name)),
      };
    })
  );

  constructor(
    private route: ActivatedRoute,
    private allergenService: AllergenService,
    private restaurantService: RestaurantService,
    private location: Location
  ) {}

  /** The user's allergens this source doesn't track, so items without ingredients can't be judged. */
  private untracked(restaurant: Restaurant, names: string[]): string[] {
    if (!restaurant.covers || restaurant.menu.every(item => item.ingredients)) {
      return [];
    }
    return names.filter(name => {
      const key = resolveAllergenKey(name);
      return !key || !restaurant.covers!.includes(key);
    }).map(name => catalogEntry(resolveAllergenKey(name) || '')?.label.toLowerCase() || name);
  }

  allergenLabels(keys: string[]): string {
    return keys.map(key => catalogEntry(key)?.label || key).join(', ');
  }

  count(restaurant: Restaurant, filter: StatusFilter): number {
    return filter === 'all' ? restaurant.menu.length : restaurant.counts?.[filter] || 0;
  }

  goBack(): void {
    this.location.back();
  }

  toggleFavorite(restaurant: Restaurant): void {
    this.restaurantService.toggleFavorite(restaurant);
  }
}
