import { Component, computed, input } from '@angular/core';

export type StatusBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_BY_KEYWORD: Record<string, StatusBadgeTone> = {
  pending: 'neutral',
  confirmed: 'info',
  processing: 'info',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
  active: 'success',
  inactive: 'neutral',
  paid: 'success',
  refunded: 'warning',
  failed: 'danger',
  instock: 'success',
  lowstock: 'warning',
  outofstock: 'danger',
  admin: 'warning',
  customer: 'info',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  label = input.required<string>();

  /** لو مبعتش tone، بيتحدد تلقائي من نص الـ label نفسه */
  tone = input<StatusBadgeTone | undefined>(undefined);

  readonly resolvedTone = computed<StatusBadgeTone>(() => {
    const explicit = this.tone();
    if (explicit) return explicit;

    const key = this.label().toLowerCase().replace(/\s+/g, '');
    return TONE_BY_KEYWORD[key] ?? 'neutral';
  });
}