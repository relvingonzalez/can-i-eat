import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AllergenService } from './core/allergen.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly nav = [
    { path: '/dashboard', icon: 'restaurant', label: 'Restaurants' },
    { path: '/dishes', icon: 'search', label: 'Dishes' },
    { path: '/nearby', icon: 'near_me', label: 'Near me' },
    { path: '/scan', icon: 'qr_code_scanner', label: 'Scan' },
    { path: '/chef-card', icon: 'badge', label: 'Chef card' },
    { path: '/allergens', icon: 'health_and_safety', label: 'My allergies' },
  ];

  readonly profiles$ = combineLatest([this.allergenService.profiles$, this.allergenService.activeProfile$]).pipe(
    map(([profiles, active]) => ({ profiles, active }))
  );

  constructor(private allergenService: AllergenService) {}

  switchProfile(id: string): void {
    this.allergenService.setActiveProfile(id);
  }
}
