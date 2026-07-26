import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductVariantResponse } from '../../../../core/models/catalog.models';

@Component({
  selector: 'app-product-variant-selector',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './product-variant-selector.component.html',
  styleUrl: './product-variant-selector.component.css',
})
export class ProductVariantSelectorComponent implements OnChanges {
  @Input() variants: ProductVariantResponse[] = [];
  @Output() selectionChange = new EventEmitter<{ color: string; size: string; variantId?: number; price?: number }>();

  colors: string[] = [];
  sizes: string[] = [];

  selectedColor = signal('');
  selectedSize = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['variants']) {
      this.colors = Array.from(new Set(this.variants.map((v) => v.color).filter(Boolean)));
      this.sizes = Array.from(new Set(this.variants.map((v) => v.size).filter(Boolean)));

      if (this.variants.length === 0) {
        this.selectedColor.set('');
        this.selectedSize.set('');
        this.selectionChange.emit({ color: '', size: '', variantId: undefined, price: undefined });
        return;
      }

      const firstAvailable = this.variants.find((v) => v.stock > 0) ?? this.variants[0];
      this.selectedColor.set(firstAvailable.color || this.colors[0] || '');
      this.selectedSize.set(firstAvailable.size || this.sizes[0] || '');
      this.emitSelection();
    }
  }

  isColorDisabled(color: string): boolean {
    return !this.variants.some((v) => v.color === color && v.stock > 0);
  }

  isSizeDisabled(size: string): boolean {
    const color = this.selectedColor();
    return !this.variants.some((v) => v.size === size && (!color || v.color === color) && v.stock > 0);
  }

  selectColor(color: string): void {
    if (this.isColorDisabled(color)) return;
    this.selectedColor.set(color);

    if (this.isSizeDisabled(this.selectedSize())) {
      const fallback = this.variants.find((v) => v.color === color && v.stock > 0);
      this.selectedSize.set(fallback?.size || '');
    }

    this.emitSelection();
  }

  selectSize(size: string): void {
    if (this.isSizeDisabled(size)) return;
    this.selectedSize.set(size);
    this.emitSelection();
  }

  readonly matchedVariant = computed(() => {
    return this.variants.find((v) => v.color === this.selectedColor() && v.size === this.selectedSize());
  });

  readonly variantSummary = computed(() => `${this.selectedColor()} • ${this.selectedSize()}`);

  readonly stockStatusLabel = computed(() => {
    const variant = this.matchedVariant();
    if (!variant) return 'Select options';
    if (variant.stock === 0) return 'Out of stock';
    if (variant.stock <= 5) return `Only ${variant.stock} left`;
    return 'In stock';
  });

  // عرض الأبعاد بس لو فيها قيم حقيقية (مش صفر)
  readonly dimensionsLabel = computed(() => {
    const v = this.matchedVariant();
    if (!v || (!v.weight && !v.height && !v.width)) return null;

    const parts: string[] = [];
    if (v.height || v.width) parts.push(`${v.height || '—'} × ${v.width || '—'} cm`);
    if (v.weight) parts.push(`${v.weight} kg`);
    return parts.join(' • ');
  });

  private emitSelection(): void {
    const variant = this.matchedVariant();
    this.selectionChange.emit({
      color: this.selectedColor(),
      size: this.selectedSize(),
      variantId: variant?.id,
      price: variant?.price,
    });
  }
}