import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import {
  catchError,
  of
} from 'rxjs';

import { CatalogService } from '../../../../core/services/catalog.service';

import {
  CategoryResponse
} from '../../../../core/models/catalog.models';

import { TranslatePipe } from '@ngx-translate/core';

import {
  LocalizedNamePipe
} from '../../../../shared/pipes/localized-name.pipe';


@Component({
  selector: 'app-categories-list',

  standalone: true,

  imports: [
    RouterLink,
    TranslatePipe,
    LocalizedNamePipe
  ],

  templateUrl: './categories-list.html',

  styleUrl: './categories-list.css',
})
export class CategoriesListPage implements OnInit {

  private readonly catalogService =
    inject(CatalogService);


  // =========================================================
  // State
  // =========================================================

  readonly categories =
    signal<CategoryResponse[]>([]);

  readonly isLoading =
    signal(true);

  readonly fallbackImage =
    'assets/placeholder-product.jpg';


  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {

    this.loadCategories();

  }


  // =========================================================
  // Load Categories
  // =========================================================

  private loadCategories(): void {

    this.isLoading.set(true);

    this.catalogService
      .getCategories({
        pageSize: 50
      })

      .pipe(
        catchError(() => of(null))
      )

      .subscribe((response) => {

        if (
          response?.success &&
          response.data
        ) {

          this.categories.set(
            response.data.items
          );

        } else {

          this.categories.set([]);

        }

        this.isLoading.set(false);

      });

  }

}