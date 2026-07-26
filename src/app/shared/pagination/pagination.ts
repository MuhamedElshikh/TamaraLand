import { Component, Input, computed, signal, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class PaginationComponent {
  private readonly _currentPage = signal(1);
  private readonly _totalPages = signal(1);

  @Input({ required: true }) set currentPage(value: number) {
    this._currentPage.set(value);
  }
  get currentPage(): number {
    return this._currentPage();
  }

  @Input({ required: true }) set totalPages(value: number) {
    this._totalPages.set(Math.max(1, value));
  }
  get totalPages(): number {
    return this._totalPages();
  }

  readonly pageChange = output<number>();

  // بيبني ليستة الصفحات المعروضة، مع "..." لو العدد كبير
  readonly pages = computed<(number | '...')[]>(() => {
    const total = this._totalPages();
    const current = this._currentPage();
    const delta = 1;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (current - delta > 2) pages.push('...');

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      pages.push(i);
    }

    if (current + delta < total - 1) pages.push('...');

    pages.push(total);

    return pages;
  });

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  prev(): void {
    this.goTo(this.currentPage - 1);
  }

  next(): void {
    this.goTo(this.currentPage + 1);
  }
}