import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { CatalogService } from '../../../../core/services/catalog.service';

import { ProductCardResponse } from '../../../../core/models/catalog.models';

import { ProductCardComponent } from '../../../catalog/components/product-card/product-card.component';

import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';


@Component({
  selector: 'app-featured-products',

  standalone: true,

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    RouterLink,
    ProductCardComponent,
    TranslatePipe,
    ScrollRevealDirective,
  ],

  templateUrl:
    './featured-products.component.html',

  styleUrl:
    './featured-products.component.css',
})
export class FeaturedProductsComponent
  implements OnInit {

  private readonly catalog =
    inject(CatalogService);


  readonly products =
    signal<ProductCardResponse[]>([]);

  readonly loading =
    signal(true);


  ngOnInit(): void {

    this.catalog
      .getProducts({
        pageSize: 4,
        pageNumber: 1,
        sortBy: 'newest',
      })
      .subscribe({

        next: res => {

          if (
            res.success &&
            res.data
          ) {

            this.products.set(
              res.data.items.slice(0, 4)
            );

          }

          this.loading.set(false);

        },

        error: () => {
          this.loading.set(false);
        },

      });

  }

}