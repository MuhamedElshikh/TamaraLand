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

import { SeoService } from '../../../../core/services/seo.service';


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

  private readonly seo =
    inject(SeoService);


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

    this.setSeo();

    this.loadCategories();

  }


  // =========================================================
  // SEO
  // =========================================================

  private setSeo(): void {

    const title =
      'Women’s Fashion Categories | Tamara Land';

    const description =
      'Explore women’s fashion categories at Tamara Land. Discover dresses, jumpsuits, tops, skirts and more in Egypt.';

    this.seo.setSeo({

      title,

      description,

      canonicalUrl:
        '/categories',

      type:
        'website',

      robots:
        'index, follow',

      siteName:
        'Tamara Land',

      jsonLd:
        this.buildCategoriesSchema(
          title,
          description
        )

    });

  }


  private buildCategoriesSchema(
    title: string,
    description: string
  ): Record<string, unknown> {

    return {

      '@context':
        'https://schema.org',

      '@type':
        'CollectionPage',

      name:
        title,

      description,

      url:
        'https://www.tamaraland.shop/categories',

      isPartOf: {

        '@type':
          'WebSite',

        name:
          'Tamara Land',

        url:
          'https://www.tamaraland.shop'

      }

    };

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