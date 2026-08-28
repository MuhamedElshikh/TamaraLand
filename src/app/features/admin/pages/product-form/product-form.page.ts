
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminCatalogService } from '../../../../core/services/admin-catalog.service';

import {
  CategoryResponse,
  BrandResponse,
  ColorResponse,
  SizeResponse,
} from '../../../../core/models/catalog.models';

import {
  AdminProductImageResponse,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductVariantRequest,
  UpdateProductVariantRequest,
} from '../../../../core/models/domain.models';

import { TranslatePipe } from '@ngx-translate/core';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

interface AdminVariantItem extends UpdateProductVariantRequest {
  colorName: string;
  colorArabicName: string;
  colorHexCode?: string | null;
  colorSecondaryHexCode?: string | null;
  sizeName: string;
}

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './product-form.page.html',
  styleUrl: './product-form.page.css',
})
export class AdminProductFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminCatalogService = inject(AdminCatalogService);

  readonly productId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly productSlug = signal<string>('');

  readonly categories = signal<CategoryResponse[]>([]);
  readonly brands = signal<BrandResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);

  readonly isLoadingProduct = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    arabicName: [''],
    categoryId: ['', [Validators.required]],
    brandId: ['', [Validators.required]],
    description: [''],
    slug: [''],
    isPublished: [true],
  });

  readonly variants = signal<AdminVariantItem[]>([]);
  readonly showVariantForm = signal(false);
  readonly editingVariantIndex = signal<number | null>(null);
  readonly variantError = signal<string | null>(null);

  // =========================================================
  // Variant Color / Size Search
  // =========================================================

  readonly colorSearch = signal('');
  readonly sizeSearch = signal('');

  readonly showColorDropdown = signal(false);
  readonly showSizeDropdown = signal(false);

  readonly filteredColors = computed(() => {
    const search = this.normalizeSearch(this.colorSearch());

    if (!search) {
      return this.colors();
    }

    return this.colors().filter((color) =>
      [
        color.name,
        color.arabicName,
      ].some((value) =>
        this.normalizeSearch(value).includes(search)
      )
    );
  });

  readonly filteredSizes = computed(() => {
    const search = this.normalizeSearch(this.sizeSearch());

    if (!search) {
      return this.sizes();
    }

    return this.sizes().filter((size) =>
      this.normalizeSearch(size.name).includes(search)
    );
  });

  variantForm: FormGroup = this.fb.group({
    id: [0],

    colorId: [null, [Validators.required]],
    sizeId: [null, [Validators.required]],

    sku: ['', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0.01)]],

    costPrice: [0],
    compareAtPrice: [null],

    bust: [0],
    waist: [0],
    hip: [0],
    length: [0],
  });

  readonly images = signal<AdminProductImageResponse[]>([]);
  readonly isLoadingImages = signal(false);
  readonly isUploadingImage = signal(false);
  readonly imageError = signal<string | null>(null);

  selectedFiles: File[] = [];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    this.isLoadingProduct.set(true);

    forkJoin({
      catRes: this.adminCatalogService.getCategories({
        pageSize: 100,
      }),
      brandRes: this.adminCatalogService.getBrands({
        pageSize: 100,
      }),
      colorRes: this.adminCatalogService.getColors(),
      sizeRes: this.adminCatalogService.getSizes(),
    }).subscribe({
      next: ({
        catRes,
        brandRes,
        colorRes,
        sizeRes,
      }) => {
        if (catRes?.success && catRes.data) {
          this.categories.set(catRes.data.items);
        }

        if (brandRes?.success && brandRes.data) {
          this.brands.set(brandRes.data.items);
        }

        if (colorRes?.success && colorRes.data) {
          this.colors.set([...colorRes.data]);
        }

        if (sizeRes?.success && sizeRes.data) {
          this.sizes.set(
            [...sizeRes.data].sort(
              (a, b) => a.sortOrder - b.sortOrder
            )
          );
        }

        if (id && !Number.isNaN(id) && id > 0) {
          this.productId.set(id);
          this.isEditMode.set(true);

          this.loadProductDetails(id);
          this.loadImages(id);
        } else {
          this.isLoadingProduct.set(false);
        }
      },

      error: (err) => {
        this.isLoadingProduct.set(false);

        this.errorMessage.set(
          extractErrorMessage(
            err,
            'Could not load product form data.'
          )
        );
      },
    });
  }

  // =========================================================
  // Product Submit
  // =========================================================

  onSubmitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    if (this.variants().length === 0) {
      this.errorMessage.set(
        'Please add at least one product variant (SKU, Price, Stock).'
      );

      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formVal = this.productForm.value;

    if (this.isEditMode() && this.productId()) {
      const updateData: UpdateProductRequest = {
        name: formVal.name,
        arabicName: formVal.arabicName || '',
        description: formVal.description || '',
        slug:
          formVal.slug ||
          this.productSlug() ||
          this.slugify(formVal.name),

        categoryId: Number(formVal.categoryId),
        brandId: Number(formVal.brandId),
        isPublished: Boolean(formVal.isPublished),

        variants: this.variants().map(
          (v): UpdateProductVariantRequest => ({
            id: v.id || 0,

            colorId: Number(v.colorId),
            sizeId: Number(v.sizeId),

            costPrice: Number(v.costPrice || 0),

            compareAtPrice:
              v.compareAtPrice === null ||
              v.compareAtPrice === undefined
                ? null
                : Number(v.compareAtPrice),

            price: Number(v.price),
            stock: Number(v.stock),

            bust: Number(v.bust || 0),
            waist: Number(v.waist || 0),
            hip: Number(v.hip || 0),
            length: Number(v.length || 0),

            sku: v.sku,
          })
        ),
      };

      this.adminCatalogService
        .updateProduct(this.productId()!, updateData)
        .subscribe({
          next: (res) => {
            this.isSubmitting.set(false);

            if (res.success) {
              this.router.navigate(['/admin/products']);
            } else {
              this.errorMessage.set(
                res.message ||
                'Failed to update product.'
              );
            }
          },

          error: (err) => {
            this.isSubmitting.set(false);

            this.errorMessage.set(
              extractErrorMessage(
                err,
                'Error updating product.'
              )
            );
          },
        });

      return;
    }

    const createVariants: CreateProductVariantRequest[] =
      this.variants().map(
        (v): CreateProductVariantRequest => ({
          colorId: Number(v.colorId),
          sizeId: Number(v.sizeId),

          price: Number(v.price),
          stock: Number(v.stock),
          sku: v.sku,

          bust: Number(v.bust || 0),
          waist: Number(v.waist || 0),
          hip: Number(v.hip || 0),
          length: Number(v.length || 0),
        })
      );

    const createData: CreateProductRequest = {
      name: formVal.name,
      arabicName: formVal.arabicName || '',
      description: formVal.description || '',
      categoryId: Number(formVal.categoryId),
      brandId: Number(formVal.brandId),
      variants: createVariants,
    };

    this.adminCatalogService
      .createProduct(createData)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);

          if (res.success && res.data) {
            this.successMessage.set(
              'Product created successfully! You can now manage gallery images.'
            );

            this.productId.set(res.data.id);
            this.isEditMode.set(true);

            this.router.navigate(
              ['/admin/product-form', res.data.id],
              { replaceUrl: true }
            );
          } else {
            this.errorMessage.set(
              res.message ||
              'Failed to create product.'
            );
          }
        },

        error: (err) => {
          this.isSubmitting.set(false);

          this.errorMessage.set(
            extractErrorMessage(
              err,
              'Error creating product.'
            )
          );
        },
      });
  }

  // =========================================================
  // Variant Form
  // =========================================================

  toggleVariantForm(): void {
    this.showVariantForm.update(
      (value) => !value
    );

    this.editingVariantIndex.set(null);

    this.resetVariantForm();

    this.closeVariantDropdowns();

    this.variantError.set(null);
  }

  onEditVariant(
    variant: AdminVariantItem,
    index: number
  ): void {
    this.editingVariantIndex.set(index);

    this.variantForm.patchValue({
      id: variant.id || 0,

      colorId: variant.colorId,
      sizeId: variant.sizeId,

      sku: variant.sku || '',
      stock: variant.stock || 0,
      price: variant.price || 0,

      costPrice: variant.costPrice || 0,

      compareAtPrice:
        variant.compareAtPrice ?? null,

      bust: variant.bust || 0,
      waist: variant.waist || 0,
      hip: variant.hip || 0,
      length: variant.length || 0,
    });

    this.clearVariantSearch();

    this.closeVariantDropdowns();

    this.showVariantForm.set(true);
    this.variantError.set(null);
  }

  onAddOrUpdateVariant(): void {
    if (this.variantForm.invalid) {
      this.variantForm.markAllAsTouched();

      this.variantError.set(
        'Please select a color and size and complete all required variant fields.'
      );

      return;
    }

    const val = this.variantForm.value;

    const colorId = Number(val.colorId);
    const sizeId = Number(val.sizeId);
    const variantId = Number(val.id || 0);

    if (!colorId || !sizeId) {
      this.variantError.set(
        'Please select a color and size.'
      );

      return;
    }

    const duplicateExists = this.variants().some(
      (variant, index) =>
        index !== this.editingVariantIndex() &&
        variant.colorId === colorId &&
        variant.sizeId === sizeId
    );

    if (duplicateExists) {
      this.variantError.set(
        'A variant with the same color and size already exists.'
      );

      return;
    }

    const selectedColor = this.colors().find(
      (color) => color.id === colorId
    );

    const selectedSize = this.sizes().find(
      (size) => size.id === sizeId
    );

    if (!selectedColor || !selectedSize) {
      this.variantError.set(
        'Selected color or size could not be found.'
      );

      return;
    }

    const newVariant: AdminVariantItem = {
      id: variantId,

      colorId,
      sizeId,

      colorName: selectedColor.name,
      colorArabicName: selectedColor.arabicName,

      colorHexCode:
        selectedColor.hexCode ?? null,

      colorSecondaryHexCode:
        selectedColor.secondaryHexCode ?? null,

      sizeName: selectedSize.name,

      sku: String(val.sku || ''),
      stock: Number(val.stock),
      price: Number(val.price),

      costPrice: Number(val.costPrice || 0),

      compareAtPrice:
        val.compareAtPrice === null ||
        val.compareAtPrice === undefined ||
        val.compareAtPrice === ''
          ? null
          : Number(val.compareAtPrice),

      bust: Number(val.bust || 0),
      waist: Number(val.waist || 0),
      hip: Number(val.hip || 0),
      length: Number(val.length || 0),
    };

    const currentVars = [
      ...this.variants(),
    ];

    const editIdx =
      this.editingVariantIndex();

    if (
      editIdx !== null &&
      editIdx >= 0 &&
      editIdx < currentVars.length
    ) {
      currentVars[editIdx] = newVariant;
    } else if (variantId > 0) {
      const idx = currentVars.findIndex(
        (variant) => variant.id === variantId
      );

      if (idx !== -1) {
        currentVars[idx] = newVariant;
      } else {
        currentVars.push(newVariant);
      }
    } else {
      currentVars.push(newVariant);
    }

    this.variants.set(currentVars);

    this.showVariantForm.set(false);
    this.editingVariantIndex.set(null);

    this.resetVariantForm();

    this.closeVariantDropdowns();

    this.variantError.set(null);
  }

  onRemoveVariant(index: number): void {
    const currentVars = [
      ...this.variants(),
    ];

    currentVars.splice(index, 1);

    this.variants.set(currentVars);

    if (
      this.editingVariantIndex() === index
    ) {
      this.showVariantForm.set(false);
      this.editingVariantIndex.set(null);

      this.resetVariantForm();
    }
  }

  // =========================================================
  // Color Search
  // =========================================================

  openColorDropdown(): void {
    this.showSizeDropdown.set(false);
    this.showColorDropdown.set(true);
  }

  onColorSearchChange(value: string): void {
    this.colorSearch.set(value);
    this.showSizeDropdown.set(false);
    this.showColorDropdown.set(true);
  }

  selectColor(color: ColorResponse): void {
    this.variantForm
      .get('colorId')
      ?.setValue(color.id);

    this.variantForm
      .get('colorId')
      ?.markAsTouched();

    this.colorSearch.set('');
    this.showColorDropdown.set(false);

    this.variantError.set(null);
  }

  // =========================================================
  // Size Search
  // =========================================================

  openSizeDropdown(): void {
    this.showColorDropdown.set(false);
    this.showSizeDropdown.set(true);
  }

  onSizeSearchChange(value: string): void {
    this.sizeSearch.set(value);
    this.showColorDropdown.set(false);
    this.showSizeDropdown.set(true);
  }

  selectSize(size: SizeResponse): void {
    this.variantForm
      .get('sizeId')
      ?.setValue(size.id);

    this.variantForm
      .get('sizeId')
      ?.markAsTouched();

    this.sizeSearch.set('');
    this.showSizeDropdown.set(false);

    this.variantError.set(null);
  }

  // =========================================================
  // Selected Values
  // =========================================================

  getSelectedColor(): ColorResponse | undefined {
    const value =
      this.variantForm.get('colorId')?.value;

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return undefined;
    }

    return this.colors().find(
      (color) => color.id === Number(value)
    );
  }

  getSelectedSize(): SizeResponse | undefined {
    const value =
      this.variantForm.get('sizeId')?.value;

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return undefined;
    }

    return this.sizes().find(
      (size) => size.id === Number(value)
    );
  }

  getColorById(
    colorId: number | string | null
  ): ColorResponse | undefined {
    if (
      colorId === null ||
      colorId === undefined ||
      colorId === ''
    ) {
      return undefined;
    }

    const id = Number(colorId);

    return this.colors().find(
      (color) => color.id === id
    );
  }

  private clearVariantSearch(): void {
    this.colorSearch.set('');
    this.sizeSearch.set('');
  }

  private closeVariantDropdowns(): void {
    this.showColorDropdown.set(false);
    this.showSizeDropdown.set(false);
  }

  private normalizeSearch(
    value: string | null | undefined
  ): string {
    return (value ?? '')
      .trim()
      .toLocaleLowerCase();
  }

  // =========================================================
  // Images
  // =========================================================

  onFilesSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    if (
      input.files &&
      input.files.length > 0
    ) {
      this.selectedFiles =
        Array.from(input.files);
    }
  }

  onUploadImages(): void {
    if (
      this.selectedFiles.length === 0 ||
      !this.productId()
    ) {
      return;
    }

    this.isUploadingImage.set(true);
    this.imageError.set(null);

    this.adminCatalogService
      .uploadImages(
        this.productId()!,
        this.selectedFiles
      )
      .subscribe({
        next: (res) => {
          this.isUploadingImage.set(false);

          if (res.success) {
            this.selectedFiles = [];

            this.loadImages(
              this.productId()!
            );
          } else {
            this.imageError.set(
              res.message ||
              'Failed to upload images.'
            );
          }
        },

        error: (err) => {
          this.isUploadingImage.set(false);

          this.imageError.set(
            extractErrorMessage(
              err,
              'Error uploading images.'
            )
          );
        },
      });
  }

  onSetMainImage(imageId: number): void {
    this.adminCatalogService
      .setMainImage(imageId)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.loadImages(
              this.productId()!
            );
          } else {
            alert(
              res.message ||
              'Failed to set main image.'
            );
          }
        },

        error: (err) =>
          alert(
            extractErrorMessage(
              err,
              'Error setting main image.'
            )
          ),
      });
  }

  onDeleteImage(imageId: number): void {
    if (
      !confirm(
        'Are you sure you want to delete this image?'
      )
    ) {
      return;
    }

    this.adminCatalogService
      .deleteImage(imageId)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.loadImages(
              this.productId()!
            );
          } else {
            alert(
              res.message ||
              'Failed to delete image.'
            );
          }
        },

        error: (err) =>
          alert(
            extractErrorMessage(
              err,
              'Error deleting image.'
            )
          ),
      });
  }

  // =========================================================
  // Loading
  // =========================================================

  private loadProductDetails(
    id: number
  ): void {
    this.adminCatalogService
      .getProductById(id)
      .subscribe({
        next: (res) => {
          this.isLoadingProduct.set(false);

          if (
            !res.success ||
            !res.data
          ) {
            return;
          }

          const p = res.data as any;

          this.productSlug.set(
            p.slug || ''
          );

          const resolvedCatId =
            p.categoryId ??
            p.category?.id ??
            this.categories().find(
              (category) =>
                category.name.toLowerCase() ===
                (
                  p.categoryName ||
                  p.category ||
                  ''
                ).toLowerCase()
            )?.id ??
            '';

          const resolvedBrandId =
            p.brandId ??
            p.brand?.id ??
            this.brands().find(
              (brand) =>
                brand.name.toLowerCase() ===
                (
                  p.brandName ||
                  p.brand ||
                  ''
                ).toLowerCase()
            )?.id ??
            '';

          this.productForm.patchValue({
            name: p.name || '',
            arabicName:
              p.arabicName || '',
            categoryId: resolvedCatId,
            brandId: resolvedBrandId,
            description:
              p.description || '',
            slug: p.slug || '',
            isPublished:
              p.isPublished ?? true,
          });

          if (
            Array.isArray(p.variants) &&
            p.variants.length > 0
          ) {
            const mappedVariants:
              AdminVariantItem[] =
              p.variants.map(
                (v: any) => {
                  const colorId =
                    Number(
                      v.colorId ?? 0
                    );

                  const sizeId =
                    Number(
                      v.sizeId ?? 0
                    );

                  const color =
                    this.colors().find(
                      (item) =>
                        item.id === colorId
                    );

                  const size =
                    this.sizes().find(
                      (item) =>
                        item.id === sizeId
                    );

                  return {
                    id: Number(
                      v.id ?? 0
                    ),

                    colorId,
                    sizeId,

                    colorName:
                      v.colorName ??
                      color?.name ??
                      '',

                    colorArabicName:
                      v.colorArabicName ??
                      color?.arabicName ??
                      '',

                    colorHexCode:
                      v.colorHexCode ??
                      color?.hexCode ??
                      null,

                    colorSecondaryHexCode:
                      v.colorSecondaryHexCode ??
                      color?.secondaryHexCode ??
                      null,

                    sizeName:
                      v.sizeName ??
                      size?.name ??
                      '',

                    sku: v.sku || '',

                    stock: Number(
                      v.stock ?? 0
                    ),

                    price: Number(
                      v.price ??
                      v.finalPrice ??
                      v.originalPrice ??
                      0
                    ),

                    costPrice: Number(
                      v.costPrice ?? 0
                    ),

                    compareAtPrice:
                      v.compareAtPrice ??
                      null,

                    bust: Number(
                      v.bust ?? 0
                    ),

                    waist: Number(
                      v.waist ?? 0
                    ),

                    hip: Number(
                      v.hip ?? 0
                    ),

                    length: Number(
                      v.length ?? 0
                    ),
                  };
                }
              );

            this.variants.set(
              mappedVariants
            );
          } else {
            this.variants.set([]);
          }
        },

        error: () => {
          this.isLoadingProduct.set(false);
        },
      });
  }

  private loadImages(
    id: number
  ): void {
    this.isLoadingImages.set(true);

    this.adminCatalogService
      .getImages(id)
      .subscribe({
        next: (res) => {
          this.isLoadingImages.set(false);

          if (
            res.success &&
            res.data
          ) {
            this.images.set(
              res.data
            );
          }
        },

        error: () => {
          this.isLoadingImages.set(false);
        },
      });
  }

  private resetVariantForm(): void {
    this.variantForm.reset({
      id: 0,

      colorId: null,
      sizeId: null,

      sku: '',
      stock: 0,
      price: 0,

      costPrice: 0,
      compareAtPrice: null,

      bust: 0,
      waist: 0,
      hip: 0,
      length: 0,
    });

    this.clearVariantSearch();
    this.closeVariantDropdowns();
  }

  private slugify(
    text: string
  ): string {
    return text
      .toLowerCase()
      .trim()
      .replace(
        /[^\w\s-]/g,
        ''
      )
      .replace(
        /[\s_-]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );
  }
  isColorSelected(id: number): boolean {
  return Number(this.variantForm.get('colorId')?.value) === id;
}

isSizeSelected(id: number): boolean {
  return Number(this.variantForm.get('sizeId')?.value) === id;
}
}
