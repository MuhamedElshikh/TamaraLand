import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { ProductVariantResponse } from '../../../../core/models/catalog.models';

interface ColorOption {
  id: number;
  name: string;
  arabicName: string;
  hexCode?: string | null;
  secondaryHexCode?: string | null;
}

interface SizeOption {
  id: number;
  name: string;
  sortOrder: number;
}

export interface VariantSelection {
  colorId: number;
  colorName: string;
  colorArabicName: string;

  sizeId: number;
  sizeName: string;

  variantId?: number;
  price?: number;
  stock?: number;
}

interface DimensionItem {
  labelKey: string;
  value: number;
}

@Component({
  selector: 'app-product-variant-selector',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslatePipe,
  ],
  templateUrl: './product-variant-selector.component.html',
  styleUrl: './product-variant-selector.component.css',
})
export class ProductVariantSelectorComponent implements OnChanges {
  @Input() variants: ProductVariantResponse[] = [];

  @Output() selectionChange =
    new EventEmitter<VariantSelection>();

  readonly colors = signal<ColorOption[]>([]);
  readonly sizes = signal<SizeOption[]>([]);

  readonly selectedColorId = signal<number | null>(null);
  readonly selectedSizeId = signal<number | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['variants']) {
      return;
    }

    this.buildOptions();

    if (this.variants.length === 0) {
      this.selectedColorId.set(null);
      this.selectedSizeId.set(null);

      this.selectionChange.emit({
        colorId: 0,
        colorName: '',
        colorArabicName: '',
        sizeId: 0,
        sizeName: '',
        variantId: undefined,
        price: undefined,
        stock: 0,
      });

      return;
    }

    this.initializeSelection();
  }

  /**
   * Build unique color and size options from the variants.
   */
  private buildOptions(): void {
    const colorMap = new Map<number, ColorOption>();

    for (const variant of this.variants) {
      if (!variant.colorId) {
        continue;
      }

      if (!colorMap.has(variant.colorId)) {
        colorMap.set(variant.colorId, {
          id: variant.colorId,
          name: variant.colorName || '',
          arabicName: variant.colorArabicName || '',
          hexCode: variant.colorHexCode ?? null,
          secondaryHexCode:
            variant.colorSecondaryHexCode ?? null,
        });
      }
    }

    const sizeMap = new Map<number, SizeOption>();

    for (const variant of this.variants) {
      if (!variant.sizeId) {
        continue;
      }

      if (!sizeMap.has(variant.sizeId)) {
        sizeMap.set(variant.sizeId, {
          id: variant.sizeId,
          name: variant.sizeName || '',
          sortOrder: this.getSizeSortOrder(
            variant.sizeId,
          ),
        });
      }
    }

    this.colors.set(
      Array.from(colorMap.values())
    );

    this.sizes.set(
      Array.from(sizeMap.values()).sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.id - b.id
      )
    );
  }

  /**
   * Choose the first available variant.
   *
   * Priority:
   * 1. First variant with stock > 0.
   * 2. First variant.
   */
  private initializeSelection(): void {
    const firstAvailable =
      this.variants.find(
        (variant) =>
          variant.stock > 0
      ) ??
      this.variants[0];

    if (!firstAvailable) {
      this.selectedColorId.set(null);
      this.selectedSizeId.set(null);
      this.emitSelection();
      return;
    }

    this.selectedColorId.set(
      firstAvailable.colorId
    );

    this.selectedSizeId.set(
      firstAvailable.sizeId
    );

    /*
     * Make sure selected size actually exists
     * for the selected color.
     */
    if (
      !this.isSizeAvailableForColor(
        firstAvailable.sizeId,
        firstAvailable.colorId
      )
    ) {
      const fallbackSize =
        this.variants.find(
          (variant) =>
            variant.colorId ===
              firstAvailable.colorId &&
            variant.stock > 0
        );

      this.selectedSizeId.set(
        fallbackSize?.sizeId ?? null
      );
    }

    this.emitSelection();
  }

  /**
   * Returns the selected color object.
   */
  readonly selectedColor = computed(() => {
    const colorId =
      this.selectedColorId();

    if (!colorId) {
      return null;
    }

    return (
      this.colors().find(
        (color) =>
          color.id === colorId
      ) ?? null
    );
  });

  /**
   * Returns the selected size object.
   */
  readonly selectedSize = computed(() => {
    const sizeId =
      this.selectedSizeId();

    if (!sizeId) {
      return null;
    }

    return (
      this.sizes().find(
        (size) =>
          size.id === sizeId
      ) ?? null
    );
  });

  /**
   * The exact variant represented by
   * color + size selection.
   */
  readonly matchedVariant =
    computed<ProductVariantResponse | null>(() => {
      const colorId =
        this.selectedColorId();

      const sizeId =
        this.selectedSizeId();

      if (!colorId || !sizeId) {
        return null;
      }

      return (
        this.variants.find(
          (variant) =>
            variant.colorId ===
              colorId &&
            variant.sizeId ===
              sizeId
        ) ?? null
      );
    });

  /**
   * Available sizes for the selected color.
   *
   * Sizes are shown even when out of stock,
   * but out-of-stock combinations are disabled.
   */
  readonly availableSizes =
    computed(() => {
      const colorId =
        this.selectedColorId();

      if (!colorId) {
        return this.sizes();
      }

      const availableSizeIds =
        new Set(
          this.variants
            .filter(
              (variant) =>
                variant.colorId ===
                colorId
            )
            .map(
              (variant) =>
                variant.sizeId
            )
        );

      return this.sizes().filter(
        (size) =>
          availableSizeIds.has(
            size.id
          )
      );
    });

  /**
   * Stock state of the current variant.
   */
  readonly stockStatusLabel =
    computed(() => {
      const variant =
        this.matchedVariant();

      if (!variant) {
        return 'Select options';
      }

      if (variant.stock <= 0) {
        return 'Out of stock';
      }

      if (variant.stock <= 5) {
        return `Only ${variant.stock} left`;
      }

      return 'In stock';
    });

  /**
   * Dimensions of the selected variant.
   */
  readonly dimensionsLabel =
    computed(
      (): DimensionItem[] | null => {
        const variant =
          this.matchedVariant();

        if (!variant) {
          return null;
        }

        const dimensions: DimensionItem[] =
          [];

        if (variant.bust > 0) {
          dimensions.push({
            labelKey: 'variant.bust',
            value: variant.bust,
          });
        }

        if (variant.waist > 0) {
          dimensions.push({
            labelKey: 'variant.waist',
            value: variant.waist,
          });
        }

        if (variant.hip > 0) {
          dimensions.push({
            labelKey: 'variant.hip',
            value: variant.hip,
          });
        }

        if (variant.length > 0) {
          dimensions.push({
            labelKey: 'variant.length',
            value: variant.length,
          });
        }

        return dimensions.length > 0
          ? dimensions
          : null;
      }
    );

  /**
   * Is this color represented by at least
   * one variant that is in stock?
   */
  isColorDisabled(
    colorId: number
  ): boolean {
    return !this.variants.some(
      (variant) =>
        variant.colorId ===
          colorId &&
        variant.stock > 0
    );
  }

  /**
   * Is this exact size/color combination
   * unavailable?
   */
  isSizeDisabled(
    sizeId: number
  ): boolean {
    const colorId =
      this.selectedColorId();

    if (!colorId) {
      return !this.variants.some(
        (variant) =>
          variant.sizeId ===
            sizeId &&
          variant.stock > 0
      );
    }

    return !this.variants.some(
      (variant) =>
        variant.colorId ===
          colorId &&
        variant.sizeId ===
          sizeId &&
        variant.stock > 0
    );
  }

  /**
   * Select a color.
   */
  selectColor(
    colorId: number
  ): void {
    if (
      this.isColorDisabled(
        colorId
      )
    ) {
      return;
    }

    this.selectedColorId.set(
      colorId
    );

    const currentSizeId =
      this.selectedSizeId();

    /*
     * Keep current size when the new color
     * supports it and it has stock.
     *
     * Otherwise choose the first available
     * size for the new color.
     */
    if (
      !currentSizeId ||
      this.isSizeDisabled(
        currentSizeId
      )
    ) {
      const fallbackVariant =
        this.variants.find(
          (variant) =>
            variant.colorId ===
              colorId &&
            variant.stock > 0
        );

      this.selectedSizeId.set(
        fallbackVariant?.sizeId ??
          null
      );
    }

    this.emitSelection();
  }

  /**
   * Select a size.
   */
  selectSize(
    sizeId: number
  ): void {
    if (
      this.isSizeDisabled(
        sizeId
      )
    ) {
      return;
    }

    this.selectedSizeId.set(
      sizeId
    );

    this.emitSelection();
  }

  /**
   * Returns true when a color uses a second
   * color code.
   */
  hasSecondaryColor(
    color: ColorOption
  ): boolean {
    return Boolean(
      color.secondaryHexCode
    );
  }

  /**
   * Build CSS background for color swatch.
   *
   * Single color:
   *   #ffffff
   *
   * Two colors:
   *   split 50/50 gradient.
   */
  colorBackground(
    color: ColorOption
  ): string {
    const primary =
      color.hexCode || '#ffffff';

    const secondary =
      color.secondaryHexCode;

    if (!secondary) {
      return primary;
    }

    return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;
  }

  /**
   * Helpful for accessibility.
   */
  colorLabel(
    color: ColorOption
  ): string {
    return (
      color.arabicName ||
      color.name
    );
  }

  private getSizeSortOrder(
    sizeId: number
  ): number {
    /*
     * ProductVariantResponse does not carry
     * SortOrder, so preserve the order returned
     * by variants for now.
     *
     * Using the index keeps the UI stable.
     */
    const index =
      this.variants.findIndex(
        (variant) =>
          variant.sizeId ===
          sizeId
      );

    return index >= 0
      ? index
      : Number.MAX_SAFE_INTEGER;
  }

  private isSizeAvailableForColor(
    sizeId: number,
    colorId: number
  ): boolean {
    return this.variants.some(
      (variant) =>
        variant.colorId ===
          colorId &&
        variant.sizeId ===
          sizeId &&
        variant.stock > 0
    );
  }

  private emitSelection(): void {
    const variant =
      this.matchedVariant();

    const color =
      this.selectedColor();

    const size =
      this.selectedSize();

    this.selectionChange.emit({
      colorId:
        color?.id ?? 0,

      colorName:
        color?.name ?? '',

      colorArabicName:
        color?.arabicName ?? '',

      sizeId:
        size?.id ?? 0,

      sizeName:
        size?.name ?? '',

      variantId:
        variant?.id,

      price:
        variant?.price,

      stock:
        variant?.stock ?? 0,
    });
  }
}
