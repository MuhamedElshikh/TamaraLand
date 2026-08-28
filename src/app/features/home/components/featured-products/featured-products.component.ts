import { Component, OnInit, inject, signal, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service'; // عدّل المسار
import { ProductCardResponse } from '../../../../core/models/catalog.models'; // عدّل المسار
import { ProductCardComponent } from '../../../catalog/components/product-card/product-card.component'; // عدّل المسار
import { TranslatePipe } from '@ngx-translate/core';
import { AutoSlideDirective } from '../../../../shared/directives/auto-slide.directive'; // عدّل المسار

@Component({
  selector: 'app-featured-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCardComponent, TranslatePipe, AutoSlideDirective],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
})
export class FeaturedProductsComponent implements OnInit, AfterViewInit {
  private catalog = inject(CatalogService);

  @ViewChild('sliderTrack') sliderTrack?: ElementRef<HTMLDivElement>;
  @ViewChild('sliderTrackAuto') sliderTrackAuto?: AutoSlideDirective;

  products = signal<ProductCardResponse[]>([]);
  loading = signal(true);
  canScrollPrev = signal(false);
  canScrollNext = signal(true);

  ngOnInit(): void {
    this.catalog.getProducts({ pageSize: 8, pageNumber: 1, sortBy: 'newest' }).subscribe({
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

    this.sliderTrackAuto?.pauseNow();

    const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
    const cardWidth = track.querySelector('.slider-item')?.clientWidth ?? 240;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * direction * (isRtl ? -1 : 1);

    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });

    this.sliderTrackAuto?.resumeSoon();
  }

  onSliderScroll() {
    const track = this.sliderTrack?.nativeElement;
    if (!track) return;

    const scrollLeft = Math.abs(track.scrollLeft);
    const maxScroll = track.scrollWidth - track.clientWidth;
    this.canScrollPrev.set(scrollLeft > 2);
    this.canScrollNext.set(scrollLeft < maxScroll - 2);
  }
}