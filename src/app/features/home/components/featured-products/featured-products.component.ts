import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service'; // عدّل المسار
import { ProductCardResponse } from '../../../../core/models/catalog.models'; // عدّل المسار
import { ProductCardComponent } from '../../../catalog/components/product-card/product-card.component'; // عدّل المسار
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [RouterLink, ProductCardComponent,TranslatePipe],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
})
export class FeaturedProductsComponent implements OnInit {
  private catalog = inject(CatalogService);

  products = signal<ProductCardResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.catalog.getProducts({ pageSize: 8, pageIndex: 1, sortBy: 'newest' }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.products.set(res.data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}