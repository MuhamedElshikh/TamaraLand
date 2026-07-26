import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog.service';
import { productDetailsResolver } from './product-details.resolver';

describe('productDetailsResolver', () => {
  let catalogService: jasmine.SpyObj<CatalogService>;

  beforeEach(() => {
    catalogService = jasmine.createSpyObj('CatalogService', ['getProductById']);

    TestBed.configureTestingModule({
      providers: [{ provide: CatalogService, useValue: catalogService }]
    });
  });

  it('loads the product from the catalog service by id', (done) => {
    const product = {
      id: 1,
      name: 'Test Product',
      images: [],
      variants: [],
      categoryId: 1,
      brandId: 1,
      averageRating: 0,
      totalReviews: 0,
      isInWishlist: false
    };

    catalogService.getProductById.and.returnValue(
      of({ success: true, statusCode: 200, message: 'ok', data: product })
    );

    TestBed.runInInjectionContext(async () => {
      const result = productDetailsResolver(
        { paramMap: { get: (key: string) => (key === 'id' ? '1' : null) } } as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      );

      const value = await firstValueFrom(result as any);
      expect(value).toEqual(product);
      done();
    });
  });
});
