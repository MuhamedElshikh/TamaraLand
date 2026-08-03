import { Component, TemplateRef, contentChild, input, output } from '@angular/core';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'badge' | 'currency' | 'date' | 'image'|'boolean';
  /** لو مبعتش accessor، هياخد row[key] عادي */
  accessor?: (row: T) => unknown;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [DatePipe, DecimalPipe, StatusBadgeComponent, NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent<T extends { id: string | number } & Record<string, any>> {
  columns = input.required<DataTableColumn<T>[]>();
  rows = input<T[]>([]);
  isLoading = input(false);
  emptyMessage = input('No data available.');

  rowClick = output<T>();

  /**
   * الاستخدام:
   * <app-data-table [columns]="cols" [rows]="items">
   *   <ng-template #actions let-row>
   *     <button (click)="edit(row)">Edit</button>
   *   </ng-template>
   * </app-data-table>
   */
  actionsTemplate = contentChild<TemplateRef<{ $implicit: T }>>('actions');

  cellValue(row: T, column: DataTableColumn<T>): any {
    return column.accessor ? column.accessor(row) : row[column.key];
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLElement | null;
    if (img) {
      img.style.display = 'none';
      const sibling = img.nextElementSibling as HTMLElement | null;
      if (sibling) {
        sibling.style.display = 'inline-flex';
      }
    }
  }
}