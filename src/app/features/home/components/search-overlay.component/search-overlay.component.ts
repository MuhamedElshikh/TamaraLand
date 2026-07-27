import { Component, ElementRef, HostListener, OnDestroy, Output, EventEmitter, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse } from '../../../../core/models/catalog.models';
import { DecimalPipe } from '@angular/common';
import { Subject, EMPTY } from 'rxjs';
import {debounceTime,distinctUntilChanged,switchMap,tap,catchError} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [RouterLink,DecimalPipe],
  templateUrl: './search-overlay.component.html',
  styleUrl: './search-overlay.component.css',
})
export class SearchOverlayComponent implements OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly search$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  readonly recentSearches = signal<string[]>([]);
  readonly selectedIndex = signal(-1);


  constructor() {

 this.search$
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),

    tap(term => {
      if (term.length >= 2) {
        this.isLoading.set(true);
      }
    }),

    switchMap(term => {

      if (term.length < 2) {

        this.results.set([]);
        this.hasSearched.set(false);
        this.isLoading.set(false);

        return EMPTY;
      }

      return this.catalogService.getProducts({
        search: term,
        pageIndex: 1,
        pageSize: 5
      }).pipe(

        catchError(() => {

          this.results.set([]);
          this.hasSearched.set(true);
          this.isLoading.set(false);

          return EMPTY;

        })

      );

    }),

    takeUntilDestroyed(this.destroyRef)
  )
  .subscribe(response => {

    this.isLoading.set(false);
    this.hasSearched.set(true);
const items = response?.data?.items ?? [];

this.results.set(items);

this.selectedIndex.set(items.length ? 0 : -1);
  });

}
  

  @Output() closed = new EventEmitter<void>();

  readonly query = signal('');
  readonly results = signal<ProductCardResponse[]>([]);
  readonly isLoading = signal(false);
  readonly hasSearched = signal(false);


  ngOnDestroy(): void {
  }

  onInput(value: string): void {

    this.query.set(value);

    this.search$.next(value.trim());

}
private saveRecentSearch(term: string): void {

  const searches = [
    term,
    ...this.recentSearches().filter(x => x !== term)
  ].slice(0, 5);

  this.recentSearches.set(searches);

  localStorage.setItem(
    'recent-searches',
    JSON.stringify(searches)
  );

}
  private runSearch(term: string): void {
    this.isLoading.set(true);
    this.catalogService.getProducts({ search: term, pageSize: 5, pageIndex: 1 }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.hasSearched.set(true);
        if (res.success && res.data) this.results.set(res.data.items);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasSearched.set(true);
      },
    });
  }

  viewAllResults(): void {
    const term = this.query().trim();
    if (!term) return;
    this.router.navigate(['/products'], { queryParams: { search: term } });
    this.close();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.viewAllResults();
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
 @HostListener('document:keydown', ['$event'])
onKeyDown(event: KeyboardEvent): void {

  if (!this.results().length) return;

  switch (event.key) {

    case 'ArrowDown':

      event.preventDefault();

      this.selectedIndex.update(i =>
        Math.min(i + 1, this.results().length - 1)
      );

      break;

    case 'ArrowUp':

      event.preventDefault();

      this.selectedIndex.update(i =>
        Math.max(i - 1, 0)
      );

      break;

    case 'Enter':

      if (this.selectedIndex() < 0) return;

      event.preventDefault();

      const product = this.results()[this.selectedIndex()];

      if (product) {
        this.close();
      }

      break;

  }

}

}