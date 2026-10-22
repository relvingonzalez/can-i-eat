import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { AllergenHit, SafetyStatus } from '../models/menu-item.model';

export const STATUS_LABELS: Record<SafetyStatus, string> = {
  'safe': 'Safe',
  'may-contain': 'May contain',
  'contains': 'Contains',
  'unknown': 'Not enough info',
};

const STATUS_ICONS: Record<SafetyStatus, string> = {
  'safe': 'check_circle',
  'may-contain': 'warning',
  'contains': 'block',
  'unknown': 'help',
};

@Component({
  standalone: true,
  selector: 'app-status-pill',
  imports: [MatIconModule],
  template: `
    <span [class]="'pill ' + status" [attr.title]="title">
      <mat-icon aria-hidden="true">{{ icons[status] }}</mat-icon>
      <span>{{ labels[status] }}{{ detail ? ': ' + detail : '' }}</span>
    </span>
  `,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px 2px 6px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      line-height: 22px;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pill span { overflow: hidden; text-overflow: ellipsis; }
    .mat-icon { font-size: 16px; width: 16px; height: 16px; flex: none; }
    .safe { color: var(--safe); background: var(--safe-bg); }
    .may-contain { color: var(--may); background: var(--may-bg); }
    .contains { color: var(--contains); background: var(--contains-bg); }
    .unknown { color: var(--unknown); background: var(--unknown-bg); }
  `],
})
export class StatusPillComponent {
  @Input({ required: true }) status: SafetyStatus = 'unknown';
  @Input() hits: AllergenHit[] = [];

  labels = STATUS_LABELS;
  icons = STATUS_ICONS;

  /** "milk, egg" — the allergens behind the status, most severe level only. */
  get detail(): string {
    const level = this.status === 'contains' || this.status === 'may-contain' ? this.status : undefined;
    return level ? (this.hits || []).filter(h => h.level === level).map(h => h.allergen).join(', ') : '';
  }

  get title(): string {
    return (this.hits || []).map(h => `${h.allergen}: ${h.terms.join(', ')}`).join('\n');
  }
}
