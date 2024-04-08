import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

import { Allergen } from '../shared/models/allergen.model';
import { Restaurant } from '../shared/models/restaurant.model';
import { Menu } from '../shared/models/menu.model';
import { RestaurantService }  from '../core/restaurant.service';
import { AllergenService } from '../core/allergen.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonModule} from '@angular/material/button';


@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.scss'],
  imports: [MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatSlideToggleModule, MatExpansionModule, CommonModule, FormsModule]
})
export class RestaurantDetailComponent implements OnInit {
  @Input() restaurant: Restaurant;
  private ngUnsubscribe = new Subject();
  private defaultMenu: Menu;
  private safeMenu: Menu;
  showSafe: Boolean = false;
  menuByCategory: Menu;
  allergens: Allergen[];

  constructor(
    private route: ActivatedRoute,
    private allergenService: AllergenService,
    private restaurantService: RestaurantService,
    private location: Location
  ) {}

  private init(): void {
    this.allergenService.getAllergens()
      .subscribe(allergens => {
        // store allergens in case we might need it in the future for display purposes.
        this.allergens = allergens;
        this.getRestaurant(allergens);
      });
  };

  ngOnInit() {
  	this.init();
  }

  getRestaurant(allergens: Allergen[]): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(!id) {
      return;
    }

    this.restaurantService.getRestaurant(id, allergens)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(restaurant => {
        if(restaurant) {
          this.restaurant = restaurant;
          this.defaultMenu = this.restaurantService.menuByCategory(this.restaurant.menu);
          this.menuByCategory = this.defaultMenu;
          this.safeMenu = this.restaurantService.menuByCategory(this.restaurant.menu.filter(menuItem => !menuItem.problemIngredients));
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  toggleSafeMenu(): void {
    if (this.showSafe) {
      this.menuByCategory = this.safeMenu;
    } else {
      this.menuByCategory = this.defaultMenu;
    }
  }

  toggleFavorite(): void {
    const restaurantCopy = Object.assign({}, this.restaurant);
    restaurantCopy.menu = []; //dont save menu as its too large
    delete restaurantCopy.favorite;
    this.restaurantService.toggleFavoriteRestaurant(restaurantCopy)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.restaurant.favorite = !this.restaurant.favorite;
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }
}
