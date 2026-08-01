import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
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
  @Input() fallbackImage = '';

  selectedImage = signal<ProductImageResponse | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      this.selectedImage.set(this.images[0] ?? null);
    }
  }

  selectImage(image: ProductImageResponse): void {
    this.selectedImage.set(image);
  }
}
