import { Component, OnInit, inject, signal,ElementRef, ViewChild,AfterViewInit } from '@angular/core';
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
export class FeaturedProductsComponent implements OnInit , AfterViewInit  {
  private catalog = inject(CatalogService);
  @ViewChild('sliderTrack') sliderTrack?: ElementRef<HTMLDivElement>;

  products = signal<ProductCardResponse[]>([]);
  loading = signal(true);
   canScrollPrev = signal(false);
  canScrollNext = signal(true);

  ngOnInit(): void {
    this.catalog.getProducts({ pageSize: 8, pageIndex: 1, sortBy: 'newest' }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.products.set(res.data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  ngAfterViewInit() {
    // نتأكد من حالة الأزرار بعد ما البيانات تتحمل
    setTimeout(() => this.onSliderScroll(), 0);
  }
   scrollSlider(direction: 1 | -1) {
    const track = this.sliderTrack?.nativeElement;
    if (!track) return;

    const cardWidth = track.querySelector('.slider-item')?.clientWidth ?? 280;
    const gap = 16; // نفس الـ gap اللي في الـ SCSS
    const scrollAmount = (cardWidth + gap) * direction;

    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  onSliderScroll() {
    const track = this.sliderTrack?.nativeElement;
    if (!track) return;

    this.canScrollPrev.set(track.scrollLeft > 5);
    this.canScrollNext.set(
      track.scrollLeft < track.scrollWidth - track.clientWidth - 5
    );
  }
}