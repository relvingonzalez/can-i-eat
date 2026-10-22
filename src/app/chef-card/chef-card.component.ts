import { Component, ElementRef, ViewChild } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AllergenService } from '../core/allergen.service';
import { catalogEntry, resolveAllergenKey } from '../core/allergen-catalog';
import { CHEF_CARD_LANGUAGES, ChefCardLanguage } from './chef-card-translations';

interface CardLine {
  emoji: string;
  text: string;
  english: string;
}

@Component({
  standalone: true,
  selector: 'app-chef-card',
  templateUrl: './chef-card.component.html',
  styleUrls: ['./chef-card.component.scss'],
  imports: [AsyncPipe, FormsModule, RouterLink, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatSelectModule],
})
export class ChefCardComponent {
  @ViewChild('card') card: ElementRef<HTMLElement>;

  readonly languages = CHEF_CARD_LANGUAGES;
  readonly english = CHEF_CARD_LANGUAGES[0];
  readonly language$ = new BehaviorSubject<ChefCardLanguage>(this.initialLanguage());
  severe = true;

  readonly vm$ = combineLatest([this.allergenService.activeProfile$, this.language$]).pipe(
    map(([profile, language]) => {
      const known: CardLine[] = [];
      const other: string[] = [];
      for (const allergen of profile.allergens) {
        const key = resolveAllergenKey(allergen.name);
        if (key && language.allergens[key]) {
          known.push({ emoji: catalogEntry(key)!.emoji, text: language.allergens[key], english: this.english.allergens[key] });
        } else {
          other.push(allergen.name);
        }
      }
      return { profile, language, known, other };
    })
  );

  constructor(private allergenService: AllergenService) {}

  /** Default to the browser's language when we have a translation for it. */
  private initialLanguage(): ChefCardLanguage {
    const browser = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
    return CHEF_CARD_LANGUAGES.find(l => l.code === browser) || CHEF_CARD_LANGUAGES[0];
  }

  setLanguage(code: string): void {
    this.language$.next(CHEF_CARD_LANGUAGES.find(l => l.code === code) || CHEF_CARD_LANGUAGES[0]);
  }

  fullscreen(): void {
    this.card?.nativeElement.requestFullscreen?.().catch(() => undefined);
  }

  print(): void {
    window.print();
  }
}
