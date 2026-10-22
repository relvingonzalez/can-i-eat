import { Component, Input } from '@angular/core';

import { TextSegment } from '../models/menu-item.model';

/** Ingredient list with the words that matched the user's allergens highlighted. */
@Component({
  standalone: true,
  selector: 'app-ingredient-text',
  template: `
    @for (segment of segments; track $index) {
      @if (segment.level) {<mark [class]="'hl-' + segment.level">{{ segment.text }}</mark>} @else {<span>{{ segment.text }}</span>}
    }
  `,
  styles: [`:host { display: block; line-height: 1.55; white-space: pre-line; }`],
})
export class IngredientTextComponent {
  @Input() segments: TextSegment[] = [];
}
