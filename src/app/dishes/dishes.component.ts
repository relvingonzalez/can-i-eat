import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { RestaurantService, searchDishes } from '../core/restaurant.service';
import { RestaurantAvatarComponent } from '../shared/components/restaurant-avatar.component';
import { StatusPillComponent } from '../shared/components/status-pill.component';

@Component({
  standalone: true,
  selector: 'app-dishes',
  imports: [
    AsyncPipe, FormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatSlideToggleModule,
    RestaurantAvatarComponent, StatusPillComponent,
  ],
  template: `
    <div class="page">
      <h1 class="page-title">Find a dish</h1>
      <p class="page-subtitle">Craving something? Search every menu at once for dishes that work for you.</p>

      <div class="controls">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Burger, salad, fries…</mat-label>
          <input matInput [ngModel]="term$.value" (ngModelChange)="setTerm($event)" autofocus />
        </mat-form-field>
        <mat-slide-toggle color="primary" [ngModel]="safeOnly$.value" (ngModelChange)="safeOnly$.next($event)">Safe only</mat-slide-toggle>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.term) {
          <div class="suggestions">
            <span class="muted">Try:</span>
            @for (s of suggestions; track s) {
              <button type="button" class="suggestion" (click)="setTerm(s)">{{ s }}</button>
            }
          </div>
        } @else if (vm.results.length) {
          <p class="muted">{{ vm.results.length }}{{ vm.results.length === 200 ? '+' : '' }} matches</p>
          <ul class="results">
            @for (r of vm.results; track r.restaurant.id + r.item.id + r.item.name) {
              <li>
                <a class="result card" [routerLink]="['/restaurant/detail', r.restaurant.id]">
                  <app-restaurant-avatar [name]="r.restaurant.name" [logo]="r.restaurant.logo" [size]="40" />
                  <span class="text">
                    <strong>{{ r.item.name }}</strong>
                    <span class="muted">{{ r.restaurant.name }} · {{ r.item.category }}</span>
                  </span>
                  <app-status-pill [status]="r.item.status || 'unknown'" [hits]="r.item.hits || []" />
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="empty-state">
            <mat-icon>no_meals</mat-icon>
            <p>No {{ vm.safeOnly ? 'safe ' : '' }}dishes match "{{ vm.term }}".</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-bottom: 16px; }
    .search { flex: 1 1 320px; max-width: 520px; }
    .suggestions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .suggestion {
      font: inherit; cursor: pointer; border: 1px solid var(--border); background: var(--surface);
      border-radius: 999px; padding: 6px 14px; text-transform: capitalize;
    }
    .suggestion:hover { border-color: var(--brand); }
    .results { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
    .result { display: flex; align-items: center; gap: 12px; padding: 10px 14px; color: inherit; text-decoration: none; }
    .result:hover { box-shadow: var(--shadow-hover); }
    .text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .text .muted { font-size: 13px; }
    app-status-pill { max-width: 45%; }
  `],
})
export class DishesComponent {
  readonly suggestions = ['burger', 'chicken', 'salad', 'fries', 'pasta', 'pizza', 'shake', 'breakfast', 'sandwich', 'dessert'];
  readonly term$ = new BehaviorSubject(this.route.snapshot.queryParamMap.get('q') || '');
  readonly safeOnly$ = new BehaviorSubject(true);

  readonly vm$ = combineLatest([
    this.restaurantService.restaurants$,
    this.term$.pipe(debounceTime(150)),
    this.safeOnly$,
  ]).pipe(
    map(([restaurants, term, safeOnly]) => ({ term, safeOnly, results: searchDishes(restaurants, term, safeOnly) }))
  );

  constructor(private restaurantService: RestaurantService, private route: ActivatedRoute, private router: Router) {}

  setTerm(term: string): void {
    this.term$.next(term);
    this.router.navigate([], { queryParams: { q: term || null }, replaceUrl: true });
  }
}
