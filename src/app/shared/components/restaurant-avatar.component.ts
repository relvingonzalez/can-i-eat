import { Component, Input } from '@angular/core';

const COLORS = ['#00796b', '#5e35b1', '#c2185b', '#ef6c00', '#1565c0', '#2e7d32', '#6d4c41', '#00838f'];

/** Restaurant logo, or a colored tile with initials when there is no logo (or it fails to load). */
@Component({
  standalone: true,
  selector: 'app-restaurant-avatar',
  template: `
    @if (logo && !failed) {
      <img [src]="logo" [alt]="name + ' logo'" (error)="failed = true" [style.width.px]="size" [style.height.px]="size" />
    } @else {
      <span class="initials" [style.background]="color" [style.width.px]="size" [style.height.px]="size"
            [style.font-size.px]="size * 0.38" aria-hidden="true">{{ initials }}</span>
    }
  `,
  styles: [`
    :host { display: inline-flex; flex: none; }
    img { object-fit: contain; border-radius: 12px; background: #fff; border: 1px solid var(--border); padding: 4px; box-sizing: border-box; }
    .initials { display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; color: #fff; font-weight: 600; }
  `],
})
export class RestaurantAvatarComponent {
  @Input({ required: true }) name = '';
  @Input() logo?: string;
  @Input() size = 56;
  failed = false;

  get initials(): string {
    return this.name.split(/[\s-]+/).filter(w => /^[a-z0-9]/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  get color(): string {
    const hash = [...this.name].reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
  }
}
