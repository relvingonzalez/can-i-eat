import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';

import { ALLERGEN_CATALOG, resolveAllergenKey } from '../../core/allergen-catalog';
import { AllergenService } from '../../core/allergen.service';

/** Tap-to-toggle chips for the catalog allergens, applied to the active profile. */
@Component({
  standalone: true,
  selector: 'app-allergen-picker',
  imports: [AsyncPipe],
  template: `
    @if (selectedKeys$ | async; as selected) {
      <div class="chips" role="group" aria-label="Common allergens">
        @for (allergen of allergens; track allergen.key) {
          <button type="button" class="chip" [class.on]="selected.includes(allergen.key)"
                  [attr.aria-pressed]="selected.includes(allergen.key)" (click)="toggle(allergen.key, allergen.label)">
            <span aria-hidden="true">{{ allergen.emoji }}</span> {{ allergen.label }}
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      font: inherit; font-size: 14px; cursor: pointer;
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      border-radius: 999px; padding: 8px 14px; transition: background .15s, border-color .15s;
    }
    .chip:hover { border-color: var(--brand); }
    .chip.on { background: var(--brand); border-color: var(--brand); color: #fff; }
  `],
})
export class AllergenPickerComponent {
  /** Show only the FDA Big 9 instead of the whole catalog. */
  @Input() big9Only = false;
  @Output() changed = new EventEmitter<void>();

  get allergens() {
    return ALLERGEN_CATALOG.filter(a => !this.big9Only || a.big9);
  }

  selectedKeys$ = this.allergenService.allergens$.pipe(
    map(allergens => allergens.map(a => resolveAllergenKey(a.name)).filter((k): k is string => !!k))
  );

  constructor(private allergenService: AllergenService) {}

  toggle(key: string, label: string): void {
    const existing = this.allergenService.activeProfile()?.allergens.find(a => resolveAllergenKey(a.name) === key);
    if (existing) {
      this.allergenService.removeAllergen(existing.name);
    } else {
      this.allergenService.addAllergen(label);
    }
    this.changed.emit();
  }
}
