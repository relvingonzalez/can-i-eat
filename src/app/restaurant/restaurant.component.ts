import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Restaurant } from '../shared/models/restaurant.model';
import { RestaurantAvatarComponent } from '../shared/components/restaurant-avatar.component';

export const SOURCE_LABELS: Record<Restaurant['source'], string> = {
  official: 'Official allergen data',
  curated: 'Hand-entered',
  community: 'Community submitted',
};

@Component({
  standalone: true,
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss'],
  imports: [RouterModule, MatIconModule, RestaurantAvatarComponent]
})
export class RestaurantComponent {
  @Input({ required: true }) restaurant: Restaurant;
  /** False until the user has picked allergies; a score would be meaningless. */
  @Input() rated = true;

  sourceLabels = SOURCE_LABELS;

  get scoreClass(): string {
    const rating = this.restaurant.safetyRating || 0;
    if (!this.restaurant.menu.length) return 'none';
    return rating >= 60 ? 'good' : rating >= 30 ? 'ok' : 'poor';
  }

  /** Width (%) of each status segment in the bar. */
  share(count = 0): number {
    return this.restaurant.menu.length ? (count / this.restaurant.menu.length) * 100 : 0;
  }
}
