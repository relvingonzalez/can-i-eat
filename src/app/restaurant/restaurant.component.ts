import { Component, OnInit, Input } from '@angular/core';
import { Restaurant } from '../shared/models/restaurant.model';
import { MatCardModule } from '@angular/material/card';
import {RouterModule} from '@angular/router';
import {MatBadgeModule} from '@angular/material/badge';
import { NgForOf } from '@angular/common';

@Component({
  standalone:true,
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss'],
  imports: [MatCardModule, RouterModule, MatBadgeModule, NgForOf]
})
export class RestaurantComponent implements OnInit {
  @Input() restaurant: Restaurant;

  constructor() { }

  ngOnInit() {}

}
