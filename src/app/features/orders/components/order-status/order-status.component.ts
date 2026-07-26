import { Component, computed, input } from '@angular/core';
import { OrderStatusName } from '../../../../core/models/domain.models';
const STATUS_STEPS: OrderStatusName[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

@Component({
  selector: 'app-order-status',
  standalone: true,
  templateUrl: './order-status.component.html',
  styleUrl: './order-status.component.css',
})
export class OrderStatusComponent {
  status = input.required<OrderStatusName>();

  readonly statusSteps = STATUS_STEPS;

  readonly isCancelled = computed(() => this.status() === 'Cancelled');

  readonly currentStepIndex = computed(() => STATUS_STEPS.indexOf(this.status()));

  stepState(index: number): 'completed' | 'active' | 'upcoming' {
    if (this.isCancelled()) return 'upcoming';
    if (index < this.currentStepIndex()) return 'completed';
    if (index === this.currentStepIndex()) return 'active';
    return 'upcoming';
  }
}