import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AllergenService } from '../core/allergen.service';

/** Landing page for links made with "Share" on the My allergies page: /share?n=Sam&a=milk,peanut */
@Component({
  standalone: true,
  selector: 'app-share',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      @if (allergens.length) {
        <div class="card share">
          <mat-icon class="big">share</mat-icon>
          <h1 class="page-title">{{ name }}'s allergies</h1>
          <p class="muted">Someone shared their allergy profile with you. Save it to check menus for them too.</p>
          <ul class="tags">
            @for (allergen of allergens; track allergen) {
              <li>{{ allergen }}</li>
            }
          </ul>
          <p class="actions">
            <button mat-flat-button color="primary" (click)="save()"><mat-icon>person_add</mat-icon> Save as a profile</button>
            <a mat-button routerLink="/dashboard">No thanks</a>
          </p>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>link_off</mat-icon>
          <p>This share link doesn't include any allergies.</p>
          <a mat-stroked-button routerLink="/allergens">Set up your own</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .share { max-width: 560px; margin: 24px auto; text-align: center; }
    .big { font-size: 40px; width: 40px; height: 40px; color: var(--brand); }
    .tags { list-style: none; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .tags li { background: var(--brand-soft); color: var(--brand-dark); border-radius: 999px; padding: 4px 12px; text-transform: capitalize; }
    .actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
  `],
})
export class ShareComponent {
  readonly name: string;
  readonly allergens: string[];

  constructor(route: ActivatedRoute, private router: Router, private allergenService: AllergenService) {
    const params = route.snapshot.queryParamMap;
    this.name = (params.get('n') || 'Friend').slice(0, 40);
    this.allergens = [...new Set((params.get('a') || '').split(',').map(a => a.trim()).filter(Boolean))].slice(0, 30);
  }

  save(): void {
    this.allergenService.addProfile(this.name, this.allergens.map(name => ({ name })));
    this.router.navigate(['/dashboard']);
  }
}
