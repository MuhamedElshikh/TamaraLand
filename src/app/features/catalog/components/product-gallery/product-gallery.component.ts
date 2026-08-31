import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  signal
} from '@angular/core';

import { ProductImageResponse } from '../../../../core/models/catalog.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './product-gallery.component.html',
  styleUrl: './product-gallery.component.css'
})
export class ProductGalleryComponent implements OnChanges {

  @Input() images: ProductImageResponse[] = [];
  @Input() title = 'Product images';
  @Input() fallbackImage = '/assets/placeholder-product.jpg';

  selectedImage = signal<ProductImageResponse | null>(null);

  isLightboxOpen = signal(false);

  // Main image
  mainTransformOrigin = signal('50% 50%');

  // Lightbox
  lightboxTransformOrigin = signal('50% 50%');
  isLightboxZoomed = signal(false);


  get currentImageUrl(): string {
    return (
      this.selectedImage()?.imageUrl ||
      this.images[0]?.imageUrl ||
      this.fallbackImage
    );
  }


  ngOnChanges(changes: SimpleChanges): void {

    if (changes['images']) {
      this.selectedImage.set(this.images[0] ?? null);
    }

  }


  selectImage(image: ProductImageResponse): void {

    this.selectedImage.set(image);

    this.resetMainZoom();
    this.resetLightboxZoom();

  }


  /* =========================================================
     MAIN IMAGE HOVER ZOOM
     ========================================================= */

  onMainImageMouseMove(event: MouseEvent): void {

    const element = event.currentTarget as HTMLElement;

    const rect = element.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    this.mainTransformOrigin.set(
      `${this.clamp(x)}% ${this.clamp(y)}%`
    );

  }


  resetMainZoom(): void {

    this.mainTransformOrigin.set('50% 50%');

  }


  /* =========================================================
     LIGHTBOX
     ========================================================= */

  openLightbox(): void {

    this.isLightboxOpen.set(true);

    this.resetLightboxZoom();

    // منع الصفحة الخلفية من الـ scroll
    document.body.style.overflow = 'hidden';

  }


  closeLightbox(): void {

    this.isLightboxOpen.set(false);

    this.resetLightboxZoom();

    document.body.style.overflow = '';

  }


  onLightboxMouseEnter(): void {

    // Zoom يبدأ بمجرد دخول الماوس
    this.isLightboxZoomed.set(true);

  }


  onLightboxMouseMove(event: MouseEvent): void {

    const element = event.currentTarget as HTMLElement;

    const rect = element.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    this.lightboxTransformOrigin.set(
      `${this.clamp(x)}% ${this.clamp(y)}%`
    );

    this.isLightboxZoomed.set(true);

  }


  resetLightboxZoom(): void {

    this.isLightboxZoomed.set(false);

    this.lightboxTransformOrigin.set('50% 50%');

  }


  private clamp(value: number): number {

    return Math.min(
      100,
      Math.max(0, value)
    );

  }


  /* =========================================================
     ESC CLOSE
     ========================================================= */

  @HostListener('document:keydown.escape')
  onEscape(): void {

    if (this.isLightboxOpen()) {
      this.closeLightbox();
    }

  }

}