import { Component, OnInit } from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import { RestaurantsComponent } from '../restaurants/restaurants.component';
import { AllergensComponent } from '../allergens/allergens.component';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.scss' ],
  imports: [MatTabsModule, AllergensComponent, RestaurantsComponent],
})
export class DashboardComponent implements OnInit {
  constructor() { }

  ngOnInit() {}
}
