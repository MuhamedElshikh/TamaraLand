import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../../../core/services/catalog.service';
import { BrandResponse } from '../../../../core/models/catalog.models';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe'; 
import { SeoService } from '../../../../core/services/seo.service';
@Component({
  selector: 'app-brands-list',
  standalone: true,
  imports: [RouterLink,LocalizedNamePipe,TranslatePipe],
  templateUrl: './brands-list.html',
  styleUrl: './brands-list.css',
})
export class BrandsListPage implements OnInit {
  private readonly catalogService = inject(CatalogService);

  readonly brands = signal<BrandResponse[]>([]);
  readonly isLoading = signal(true);
  readonly fallbackImage = 'assets/placeholder-product.jpg';
private readonly seo = inject(SeoService);
ngOnInit(): void {

  this.setSeo();

  this.catalogService

    .getBrands({
      pageSize: 50
    })

    .pipe(
      catchError(() => of(null))
    )

    .subscribe((res) => {

      if (
        res?.success &&
        res.data
      ) {

        this.brands.set(
          res.data.items
        );

      }

      this.isLoading.set(false);

    });

}
private setSeo(): void {

  const title =
    'Women’s Fashion Brands | Tamara Land';

  const description =
    'Explore women’s fashion brands at Tamara Land. Discover stylish collections from leading brands in Egypt.';

  this.seo.setSeo({

    title,

    description,

    canonicalUrl:
      '/brands',

    type:
      'website',

    robots:
      'index, follow',

    siteName:
      'Tamara Land',

    jsonLd:
      this.buildBrandsSchema(
        title,
        description
      )

  });

}


private buildBrandsSchema(
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
      'https://www.tamaraland.shop/brands',

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
}