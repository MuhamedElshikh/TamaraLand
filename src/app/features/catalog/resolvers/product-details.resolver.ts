import { inject } from '@angular/core';
import {
  RedirectCommand,
  ResolveFn,
  Router,
} from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { CatalogService } from '../../../core/services/catalog.service';
import { ProductDetailsResponse } from '../../../core/models/catalog.models';

/** @see .ai/STRUCTURE.md */

export const productDetailsResolver: ResolveFn<
  ProductDetailsResponse | RedirectCommand | null
> = (route) => {
  const catalogService = inject(CatalogService);
  const router = inject(Router);

  const identifier = route.paramMap.get('slug')?.trim();

  if (!identifier) {
    return of(null);
  }

  /*
   * Legacy URL:
   * /products/123
   *
   * Resolve the old ID and permanently move the user
   * to the product's canonical slug URL.
   */
  if (/^\d+$/.test(identifier)) {
    const productId = Number(identifier);

    if (!productId) {
      return of(null);
    }

    return catalogService.getProductById(productId).pipe(
      map((response) => {
        if (!response?.success || !response.data) {
          return null;
        }

        const product = response.data;

        if (!product.slug) {
          return null;
        }

        return new RedirectCommand(
          router.createUrlTree([
            '/products',
            product.slug,
          ]),
          {
            replaceUrl: true,
          }
        );
      }),
      catchError(() => of(null))
    );
  }

  /*
   * Current canonical URL:
   * /products/{slug}
   */
  return catalogService.getProductBySlug(identifier).pipe(
    map((response) =>
      response?.success && response.data
        ? response.data
        : null
    ),
    catchError(() => of(null))
  );
};