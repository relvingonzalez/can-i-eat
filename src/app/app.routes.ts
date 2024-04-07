import { Routes } from '@angular/router';
import { AllergensComponent } from './allergens/allergens.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AllergenDetailComponent } from './allergen-detail/allergen-detail.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'allergens', component: AllergensComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'detail/:name', component: AllergenDetailComponent },
  { path: 'restaurant/detail/:id', component: RestaurantDetailComponent }
];
