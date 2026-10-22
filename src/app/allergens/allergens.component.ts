import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AllergenService } from '../core/allergen.service';
import { catalogEntry, resolveAllergenKey } from '../core/allergen-catalog';
import { Allergen, Profile } from '../shared/models/allergen.model';
import { AllergenPickerComponent } from '../shared/components/allergen-picker.component';

@Component({
  standalone: true,
  selector: 'app-allergens',
  templateUrl: './allergens.component.html',
  styleUrls: ['./allergens.component.scss'],
  imports: [
    AsyncPipe, FormsModule, RouterLink, MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatSnackBarModule, AllergenPickerComponent,
  ]
})
export class AllergensComponent {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly vm$ = combineLatest([this.allergenService.profiles$, this.allergenService.activeProfile$]).pipe(
    map(([profiles, active]) => ({ profiles, active }))
  );
  newProfileName = '';
  renaming = false;
  renameValue = '';

  constructor(private allergenService: AllergenService, private snackBar: MatSnackBar) {}

  add(event: MatChipInputEvent): void {
    const name = (event.value || '').trim();
    if (name) {
      this.allergenService.addAllergen(name);
    }
    event.chipInput.clear();
  }

  remove(allergen: Allergen): void {
    this.allergenService.removeAllergen(allergen.name);
  }

  /** What we search menus for, e.g. dairy -> milk, cheese, whey, casein… */
  keywordsFor(allergen: Allergen): string {
    const entry = catalogEntry(resolveAllergenKey(allergen.name) || '');
    return entry ? entry.keywords.join(', ') : `"${allergen.name}" (and its plural)`;
  }

  switchTo(profile: Profile): void {
    this.allergenService.setActiveProfile(profile.id);
    this.renaming = false;
  }

  addProfile(): void {
    this.allergenService.addProfile(this.newProfileName || 'New profile');
    this.newProfileName = '';
  }

  startRename(profile: Profile): void {
    this.renaming = true;
    this.renameValue = profile.name;
  }

  saveRename(profile: Profile): void {
    this.allergenService.renameProfile(profile.id, this.renameValue);
    this.renaming = false;
  }

  deleteProfile(profile: Profile): void {
    if (confirm(`Delete the "${profile.name}" profile?`)) {
      this.allergenService.deleteProfile(profile.id);
    }
  }

  shareUrl(profile: Profile): string {
    const params = new URLSearchParams({ n: profile.name, a: profile.allergens.map(a => a.name).join(',') });
    return `${location.origin}/share?${params}`;
  }

  async share(profile: Profile): Promise<void> {
    const url = this.shareUrl(profile);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.name}'s allergies`, text: 'My food allergies on Can I Eat?', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.snackBar.open('Share link copied', undefined, { duration: 2500 });
    } catch {
      // User cancelled the share sheet, or clipboard access was blocked.
    }
  }
}
