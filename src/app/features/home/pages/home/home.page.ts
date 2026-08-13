import { Component, OnInit, inject, signal, viewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service'; // عدّل المسار
import { CategoryResponse } from '../../../../core/models/catalog.models'; // عدّل المسار
import { HeroBannerComponent } from '../../components/hero-banner/hero-banner.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';
import { TranslatePipe } from '@ngx-translate/core';
import {LocalizedNamePipe} from '../../../../shared/pipes/localized-name.pipe'

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, HeroBannerComponent, FeaturedProductsComponent,TranslatePipe ,LocalizedNamePipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage implements OnInit {
  private catalog = inject(CatalogService);

  categories = signal<CategoryResponse[]>([]);
  categoriesLoading = signal(true);
  readonly fallbackImage = 'assets/placeholder-product.jpg';

  ngOnInit(): void {
    this.catalog.getCategories({ pageSize: 4 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.categories.set(res.data.items);
        this.categoriesLoading.set(false);
      },
      error: () => this.categoriesLoading.set(false),
    });
  }
  readonly categoryStrip = viewChild<ElementRef<HTMLDivElement>>('categoryStrip');

scrollCategories(direction: 1 | -1): void {
  const el = this.categoryStrip()?.nativeElement;
  if (!el) return;
  const scrollAmount = el.clientWidth * 0.7;
  el.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
}
}