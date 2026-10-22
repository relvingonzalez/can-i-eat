import { Routes } from '@angular/router';
import { AllergensComponent } from './allergens/allergens.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Can I Eat? · Allergy-safe restaurants' },
  { path: 'allergens', component: AllergensComponent, title: 'My allergies · Can I Eat?' },
  { path: 'restaurant/detail/:id', component: RestaurantDetailComponent, title: 'Menu · Can I Eat?' },
  { path: 'dishes', loadComponent: () => import('./dishes/dishes.component').then(m => m.DishesComponent), title: 'Find a dish · Can I Eat?' },
  { path: 'nearby', loadComponent: () => import('./nearby/nearby.component').then(m => m.NearbyComponent), title: 'Near me · Can I Eat?' },
  { path: 'scan', loadComponent: () => import('./scan/scan.component').then(m => m.ScanComponent), title: 'Scan a product · Can I Eat?' },
  { path: 'chef-card', loadComponent: () => import('./chef-card/chef-card.component').then(m => m.ChefCardComponent), title: 'Chef card · Can I Eat?' },
  { path: 'submit', loadComponent: () => import('./submit/submit.component').then(m => m.SubmitComponent), title: 'Suggest a restaurant · Can I Eat?' },
  { path: 'share', loadComponent: () => import('./share/share.component').then(m => m.ShareComponent), title: 'Shared allergy profile · Can I Eat?' },
  { path: '**', redirectTo: '/dashboard' },
];
