import {
  Component,
  ElementRef,
  HostListener,
  Output,
  EventEmitter,
  inject,
  signal,
  DestroyRef
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import { CatalogService } from '../../../../core/services/catalog.service';

import {
  ProductSearchSuggestion,
  ProductSearchSuggestionType
} from '../../../../core/models/catalog.models';

import {
  Subject,
  EMPTY
} from 'rxjs';

import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError
} from 'rxjs/operators';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe
  ],
  templateUrl: './search-overlay.component.html',
  styleUrl: './search-overlay.component.css',
})
export class SearchOverlayComponent {

  private readonly catalogService =
    inject(CatalogService);

  private readonly router =
    inject(Router);

  private readonly elementRef =
    inject(ElementRef);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly search$ =
    new Subject<string>();


  // =========================================================
  // STATE
  // =========================================================

  readonly query =
    signal('');

  readonly suggestions =
    signal<ProductSearchSuggestion[]>([]);
    readonly didYouMean =
  signal<string[]>([]);

  readonly isLoading =
    signal(false);

  readonly hasSearched =
    signal(false);

  readonly selectedIndex =
    signal(-1);

  readonly recentSearches =
    signal<string[]>([]);


  // =========================================================
  // OUTPUT
  // =========================================================

  @Output()
  closed =
    new EventEmitter<void>();


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor() {

    this.loadRecentSearches();

    this.search$
      .pipe(

        debounceTime(SEARCH_DEBOUNCE_MS),

        distinctUntilChanged(),

        tap(term => {

          this.selectedIndex.set(-1);

          if (term.length >= MIN_SEARCH_LENGTH) {

            this.isLoading.set(true);
            this.hasSearched.set(false);

          } else {

            this.suggestions.set([]);
            this.isLoading.set(false);
            this.hasSearched.set(false);
            this.didYouMean.set([]);

          }

        }),

        switchMap(term => {

          if (
            term.length <
            MIN_SEARCH_LENGTH
          ) {

            return EMPTY;
          }

          return this.catalogService
            .getProductSuggestions(term)
            .pipe(

              catchError(() => {

                this.suggestions.set([]);
                this.hasSearched.set(true);
                this.isLoading.set(false);
                this.didYouMean.set([]);

                return EMPTY;
              })

            );

        }),

        takeUntilDestroyed(this.destroyRef)

      )

      .subscribe(response => {

        this.isLoading.set(false);
        this.hasSearched.set(true);

      const suggestions =
  response?.success && response.data
    ? response.data.suggestions
    : [];

const didYouMean =
  response?.success && response.data
    ? response.data.didYouMean
    : [];

this.suggestions.set(suggestions);

this.didYouMean.set(didYouMean);

this.selectedIndex.set(
  suggestions.length > 0
    ? 0
    : -1
);

      });
  }


  // =========================================================
  // INPUT
  // =========================================================

  onInput(value: string): void {

    this.query.set(value);

    this.search$.next(
      value.trim()
    );
  }


  // =========================================================
  // RECENT SEARCHES
  // =========================================================

  private loadRecentSearches(): void {

    try {

      const stored =
        localStorage.getItem(
          'recent-searches'
        );

      if (!stored)
        return;

      const parsed =
        JSON.parse(stored);

      if (
        Array.isArray(parsed)
      ) {

        this.recentSearches.set(
          parsed
            .filter(
              (item): item is string =>
                typeof item === 'string'
            )
            .slice(0, 5)
        );

      }

    } catch {

      this.recentSearches.set([]);
    }
  }


  private saveRecentSearch(
    term: string
  ): void {

    const normalized =
      term.trim();

    if (!normalized)
      return;

    const searches = [
      normalized,

      ...this.recentSearches()
        .filter(
          item =>
            item.toLowerCase() !==
            normalized.toLowerCase()
        )

    ].slice(0, 5);

    this.recentSearches.set(
      searches
    );

    localStorage.setItem(
      'recent-searches',
      JSON.stringify(searches)
    );
  }


  // =========================================================
  // SUGGESTION SELECTION
  // =========================================================

  selectSuggestion(
    suggestion: ProductSearchSuggestion
  ): void {

    if (!suggestion)
      return;

    this.saveRecentSearch(
      suggestion.text
    );

    switch (suggestion.type) {

      case 'product':

        if (
          suggestion.id === null
        ) {
          return;
        }

        this.router.navigate([
          '/products',
          suggestion.id
        ]);

        break;


      case 'category':

        if (
          suggestion.id === null
        ) {
          return;
        }

        this.router.navigate([
          '/categories',
          suggestion.id
        ]);

        break;


      case 'brand':

        if (
          suggestion.id === null
        ) {
          return;
        }

        this.router.navigate([
          '/brands',
          suggestion.id
        ]);

        break;


      case 'color':

        this.router.navigate(
          ['/products'],
          {
            queryParams: {
              search: suggestion.text
            }
          }
        );

        break;
    }

    this.close();
  }


  // =========================================================
  // VIEW ALL
  // =========================================================

  viewAllResults(): void {

    const term =
      this.query().trim();

    if (!term)
      return;

    this.saveRecentSearch(term);

    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          search: term
        }
      }
    );

    this.close();
  }


  // =========================================================
  // FORM
  // =========================================================

  onSubmit(
    event: Event
  ): void {

    event.preventDefault();

    this.viewAllResults();
  }


  // =========================================================
  // CLOSE
  // =========================================================

  close(): void {

    this.closed.emit();
  }


  // =========================================================
  // OUTSIDE CLICK
  // =========================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    if (
      !this.elementRef.nativeElement
        .contains(event.target)
    ) {

      this.close();
    }
  }


  // =========================================================
  // ESCAPE
  // =========================================================

  @HostListener(
    'document:keydown.escape'
  )
  onEscape(): void {

    this.close();
  }


  // =========================================================
  // KEYBOARD NAVIGATION
  // =========================================================

  @HostListener(
    'document:keydown',
    ['$event']
  )
  onKeyDown(
    event: KeyboardEvent
  ): void {

    const items =
      this.suggestions();

    if (!items.length)
      return;

    switch (event.key) {

      case 'ArrowDown':

        event.preventDefault();

        this.selectedIndex.update(
          index =>
            Math.min(
              index + 1,
              items.length - 1
            )
        );

        break;


      case 'ArrowUp':

        event.preventDefault();

        this.selectedIndex.update(
          index =>
            Math.max(
              index - 1,
              0
            )
        );

        break;


      case 'Enter':

        if (
          this.selectedIndex() < 0 ||
          this.selectedIndex() >= items.length
        ) {
          return;
        }

        event.preventDefault();

        this.selectSuggestion(
          items[
            this.selectedIndex()
          ]
        );

        break;
    }
  }


  // =========================================================
  // UI HELPERS
  // =========================================================

  getSuggestionLabel(
    type: ProductSearchSuggestionType
  ): string {

    switch (type) {

      case 'product':
        return 'search.types.product';

      case 'category':
        return 'search.types.category';

      case 'brand':
        return 'search.types.brand';

      case 'color':
        return 'search.types.color';

      default:
        return '';
    }
  }
selectDidYouMean(term: string): void {
  const search = term.trim();

  if (!search) return;

  this.saveRecentSearch(search);

  this.query.set(search);

  this.router.navigate(
    ['/products'],
    {
      queryParams: {
        search
      }
    }
  );

  this.close();
}
}
