import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductDetailsResponse } from '../../../core/models/catalog.models';

/** @see .ai/STRUCTURE.md */
export const productDetailsResolver: ResolveFn<ProductDetailsResponse | null> = (route) => {
  const catalogService = inject(CatalogService);
  const productId = Number(route.paramMap.get('id'));

  if (!productId) {
    return of(null);
  }

  return catalogService.getProductById(productId).pipe(
    map((response) => (response?.success ? response.data : null)),
    // لو الـ API فشل (نت واقع، 500...) نرجع null بدل ما الـ navigation يعلق أو يفشل بصمت
    catchError(() => of(null))
  );
};