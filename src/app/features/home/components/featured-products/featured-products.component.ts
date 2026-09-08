import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse } from '../../../../core/models/catalog.models';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';

type SlideDirection = 'next' | 'prev';
type ProductSlot =
  | 'arch-1'
  | 'arch-2'
  | 'arch-3'
  | 'square-1'
  | 'square-2'
  | 'square-3'
  | 'square-4'
  | 'offstage';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslatePipe,
    DecimalPipe,
    ScrollRevealDirective,
    LocalizedNamePipe,
  ],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
})
export class FeaturedProductsComponent implements OnInit, OnDestroy {
  private readonly catalog = inject(CatalogService);

  readonly products = signal<ProductCardResponse[]>([]);
  readonly loading = signal(true);
  readonly windowStart = signal(0);
  readonly isTransitioning = signal(false);
  readonly transitionDirection = signal<SlideDirection>('next');

  readonly canSlide = computed(() => this.products().length > 3);

  @ViewChildren('productNode', { read: ElementRef })
  private productNodes!: QueryList<ElementRef<HTMLElement>>;

  private finishTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.catalog.getFeaturedProducts().subscribe({
      next: (res) => {
        this.products.set(
          res.success && res.data ? [...res.data] : []
        );
        this.windowStart.set(0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.finishTimer) clearTimeout(this.finishTimer);
  }

  nextHero(): void {
    this.slide('next');
  }

  prevHero(): void {
    this.slide('prev');
  }

  /*
   * Real shared-element / FLIP motion:
   * the SAME product DOM node changes slot.
   *
   * Before:
   * P4 = square-1
   *
   * After:
   * P4 = arch-3
   *
   * We measure both rectangles and animate the existing node
   * from its old physical position to the new one.
   */
  private slide(direction: SlideDirection): void {
    const list = this.products();
    const total = list.length;

    if (this.isTransitioning() || total <= 3) return;

    const first = this.captureRects();

    this.transitionDirection.set(direction);
    this.isTransitioning.set(true);

    const nextStart =
      direction === 'next'
        ? (this.windowStart() + 1) % total
        : (this.windowStart() - 1 + total) % total;

    this.windowStart.set(nextStart);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const last = this.captureRects();
        this.playFlip(first, last);

        this.finishTimer = setTimeout(() => {
          this.isTransitioning.set(false);
        }, 680);
      });
    });
  }

  private captureRects(): Map<string, DOMRect> {
    const rects = new Map<string, DOMRect>();

    this.productNodes?.forEach((ref) => {
      const node = ref.nativeElement;
      const id = node.dataset['productId'];

      if (id) {
        rects.set(id, node.getBoundingClientRect());
      }
    });

    return rects;
  }

  private playFlip(
    first: Map<string, DOMRect>,
    last: Map<string, DOMRect>
  ): void {
    this.productNodes?.forEach((ref) => {
      const node = ref.nativeElement;
      const id = node.dataset['productId'];

      if (!id) return;

      const from = first.get(id);
      const to = last.get(id);

      if (!to) return;

      /*
       * Existing visible product:
       * First -> Last
       */
      if (from && from.width > 2 && from.height > 2) {
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        const sx = from.width / Math.max(to.width, 1);
        const sy = from.height / Math.max(to.height, 1);

        node.animate(
          [
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
              opacity: 1,
              offset: 0,
            },
            {
              transform: `translate3d(${dx * 0.16}px, ${dy * 0.16}px, 0) scale(${1 + (sx - 1) * 0.16}, ${1 + (sy - 1) * 0.16})`,
              opacity: 1,
              offset: 0.76,
            },
            {
              transform: 'translate3d(0,0,0) scale(1,1)',
              opacity: 1,
              offset: 1,
            },
          ],
          {
            duration: 640,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'none',
          }
        );
      } else {
        /*
         * Newly entering product:
         * start just outside the side it comes from, then land
         * in the new slot. It never pops in from opacity:0.
         */
        const direction = this.transitionDirection() === 'next' ? 1 : -1;
        const x = direction * Math.max(to.width * 0.9, 90);

        node.animate(
          [
            {
              transform: `translate3d(${x}px,0,0) scale(.92)`,
              opacity: 0.15,
              offset: 0,
            },
            {
              transform: 'translate3d(0,0,0) scale(1)',
              opacity: 1,
              offset: 1,
            },
          ],
          {
            duration: 560,
            delay: 40,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'none',
          }
        );
      }
    });
  }

  slotFor(product: ProductCardResponse): ProductSlot {
    const list = this.products();

    if (!list.length) return 'offstage';

    const index = list.findIndex((item) => item.id === product.id);
    if (index < 0) return 'offstage';

    const total = list.length;
    const relative = (index - this.windowStart() + total) % total;

    if (relative === 0) return 'arch-1';
    if (relative === 1) return 'arch-2';
    if (relative === 2) return 'arch-3';
    if (relative === 3) return 'square-1';
    if (relative === 4) return 'square-2';
    if (relative === 5) return 'square-3';
    if (relative === 6) return 'square-4';

    return 'offstage';
  }

  slotClass(product: ProductCardResponse): string {
    return `is-${this.slotFor(product)}`;
  }

  isVisible(product: ProductCardResponse): boolean {
    return this.slotFor(product) !== 'offstage';
  }
}
