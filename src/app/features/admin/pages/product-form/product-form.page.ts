import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminCatalogService } from '../../../../core/services/admin-catalog.service';
import {
  CategoryResponse,
  BrandResponse,
} from '../../../../core/models/catalog.models';
import {
  AdminProductImageResponse,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductVariantRequest,
  UpdateProductVariantRequest,
} from '../../../../core/models/domain.models';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
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
    isPublished:true
  });

  readonly variants = signal<UpdateProductVariantRequest[]>([]);
  readonly showVariantForm = signal(false);
  readonly editingVariantIndex = signal<number | null>(null);
  readonly variantError = signal<string | null>(null);

 variantForm: FormGroup = this.fb.group({
  id: [0],
  sku: ['', [Validators.required]],
  color: [''],
  size: [''],
  stock: [0, [Validators.required, Validators.min(0)]],
  price: [0, [Validators.required, Validators.min(0.01)]],
  costPrice: [0],
  compareAtPrice: [0],
  bust: [0],
  waist: [0],
  hip: [0],
  length: [0],
});

  readonly images = signal<AdminProductImageResponse[]>([]);
  readonly isLoadingImages = signal(false);
  readonly isUploadingImage = signal(false);
  readonly imageError = signal<string | null>(null);

  selectedFile: File | null = null;
  isMainImageSelection = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    this.isLoadingProduct.set(true);

    forkJoin({
      catRes: this.adminCatalogService.getCategories({ pageSize: 100 }),
      brandRes: this.adminCatalogService.getBrands({ pageSize: 100 }),
    }).subscribe({
      next: ({ catRes, brandRes }) => {
        if (catRes?.success && catRes.data) {
          this.categories.set(catRes.data.items);
        }
        if (brandRes?.success && brandRes.data) {
          this.brands.set(brandRes.data.items);
        }

        if (id && !isNaN(id) && id > 0) {
          this.productId.set(id);
          this.isEditMode.set(true);
          this.loadProductDetails(id);
          this.loadImages(id);
        } else {
          this.isLoadingProduct.set(false);
        }
      },
      error: () => {
        this.isLoadingProduct.set(false);
      },
    });
  }

  onSubmitProduct(): void {
  if (this.productForm.invalid) {
    this.productForm.markAllAsTouched();
    return;
  }

  if (this.variants().length === 0) {
    this.errorMessage.set('Please add at least one product variant (SKU, Price, Stock).');
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
      slug: formVal.slug || this.productSlug() || this.slugify(formVal.name),
      categoryId: Number(formVal.categoryId),
      brandId: Number(formVal.brandId),
      isActive: true,
      isPublished: formVal.isPublished,
      variants: this.variants().map((v) => ({
        id: v.id || 0,
        color: v.color || '',
        size: v.size || '',
        costPrice: Number(v.costPrice || 0),
        compareAtPrice: Number(v.compareAtPrice || 0),
        price: Number(v.price),
        stock: Number(v.stock),
        bust: Number(v.bust || 0),
        waist: Number(v.waist || 0),
        hip: Number(v.hip || 0),
        length: Number(v.length || 0),
        sku: v.sku,
        isActive: true
      })),
    };

    this.adminCatalogService.updateProduct(this.productId()!, updateData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.successMessage.set('Product updated successfully!');
        } else {
          this.errorMessage.set(res.message || 'Failed to update product.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || err?.message || 'Error updating product.');
      },
    });
  } else {
    const createVariants: CreateProductVariantRequest[] = this.variants().map((v) => ({
      color: v.color || '',
      size: v.size || '',
      price: Number(v.price),
      stock: Number(v.stock),
      sku: v.sku,
      bust: Number(v.bust || 0),
      waist: Number(v.waist || 0),
      hip: Number(v.hip || 0),
      length: Number(v.length || 0),
    }));

    const createData: CreateProductRequest = {
      name: formVal.name,
      arabicName: formVal.arabicName || '',
      description: formVal.description || '',
      categoryId: Number(formVal.categoryId),
      brandId: Number(formVal.brandId),
      variants: createVariants,
    };

    this.adminCatalogService.createProduct(createData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.successMessage.set('Product created successfully! You can now manage gallery images.');
          this.productId.set(res.data.id);
          this.isEditMode.set(true);
          this.router.navigate(['/admin/product-form', res.data.id], { replaceUrl: true });
        } else {
          this.errorMessage.set(res.message || 'Failed to create product.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || err?.message || 'Error creating product.');
      },
    });
  }
}

  toggleVariantForm(): void {
    this.showVariantForm.update((v) => !v);
    this.editingVariantIndex.set(null);
    this.variantForm.reset({
      id: 0,
      stock: 0,
      price: 0,
      costPrice: 0,
      compareAtPrice: 0,
      bust: 0,
      waist: 0,
      hip: 0,
      length: 0,
      isPublished:true
    });
    this.variantError.set(null);
  }

  onEditVariant(variant: UpdateProductVariantRequest, index: number): void {
    this.editingVariantIndex.set(index);
    this.variantForm.patchValue({
      id: variant.id || 0,
      sku: variant.sku || '',
      color: variant.color || '',
      size: variant.size || '',
      stock: variant.stock || 0,
      price: variant.price || 0,
      costPrice: variant.costPrice || 0,
      compareAtPrice: variant.compareAtPrice || 0,
      bust: variant.bust || 0,
      waist: variant.waist || 0,
      hip: variant.hip || 0,
      length: variant.length || 0,
    });
    this.showVariantForm.set(true);
    this.variantError.set(null);
  }

  onAddOrUpdateVariant(): void {
    if (this.variantForm.invalid) {
      this.variantForm.markAllAsTouched();
      return;
    }

    const val = this.variantForm.value;
    const newVariant: UpdateProductVariantRequest = {
      id: val.id || 0,
      sku: val.sku,
      color: val.color || '',
      size: val.size || '',
      stock: Number(val.stock),
      price: Number(val.price),
      costPrice: Number(val.costPrice || 0),
      compareAtPrice: Number(val.compareAtPrice || 0),
      bust: Number(val.bust || 0),
      waist: Number(val.waist || 0),
      hip: Number(val.hip || 0),
      isActive:true,
      length: Number(val.length || 0),
    };

    const currentVars = [...this.variants()];
    const editIdx = this.editingVariantIndex();

    if (editIdx !== null && editIdx >= 0 && editIdx < currentVars.length) {
      currentVars[editIdx] = newVariant;
    } else if (val.id && val.id > 0) {
      const idx = currentVars.findIndex((v) => v.id === val.id);
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
    this.variantForm.reset({
      id: 0,
      stock: 0,
      price: 0,
      costPrice: 0,
      compareAtPrice: 0,
      bust: 0,
      waist: 0,
      hip: 0,
      length: 0,
      isPublished:true
    });
    this.variantError.set(null);
  }

  onRemoveVariant(index: number): void {
    const currentVars = [...this.variants()];
    currentVars.splice(index, 1);
    this.variants.set(currentVars);

    if (this.editingVariantIndex() === index) {
      this.showVariantForm.set(false);
      this.editingVariantIndex.set(null);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUploadImage(): void {
    if (!this.selectedFile || !this.productId()) return;

    this.isUploadingImage.set(true);
    this.imageError.set(null);

    this.adminCatalogService
      .uploadImage(this.productId()!, this.selectedFile, this.isMainImageSelection)
      .subscribe({
        next: (res) => {
          this.isUploadingImage.set(false);
          if (res.success) {
            this.selectedFile = null;
            this.isMainImageSelection = false;
            this.loadImages(this.productId()!);
          } else {
            this.imageError.set(res.message || 'Failed to upload image.');
          }
        },
        error: (err) => {
          this.isUploadingImage.set(false);
          this.imageError.set(err?.error?.message || 'Error uploading image.');
        },
      });
  }

  onSetMainImage(imageId: number): void {
    this.adminCatalogService.setMainImage(imageId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadImages(this.productId()!);
        } else {
          alert(res.message || 'Failed to set main image.');
        }
      },
      error: (err) => alert(err?.error?.message || 'Error setting main image.'),
    });
  }

  onDeleteImage(imageId: number): void {
    if (!confirm('Are you sure you want to delete this image?')) return;

    this.adminCatalogService.deleteImage(imageId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadImages(this.productId()!);
        } else {
          alert(res.message || 'Failed to delete image.');
        }
      },
      error: (err) => alert(err?.error?.message || 'Error deleting image.'),
    });
  }

  private loadProductDetails(id: number): void {
  this.adminCatalogService.getProductById(id).subscribe({
    next: (res) => {
      this.isLoadingProduct.set(false);
      if (res.success && res.data) {
        const p = res.data as any;
        this.productSlug.set(p.slug || '');

        const resolvedCatId =
          p.categoryId ??
          p.category?.id ??
          this.categories().find(
            (c) => c.name.toLowerCase() === (p.categoryName || p.category)?.toLowerCase()
          )?.id ??
          '';

        const resolvedBrandId =
          p.brandId ??
          p.brand?.id ??
          this.brands().find(
            (b) => b.name.toLowerCase() === (p.brandName || p.brand)?.toLowerCase()
          )?.id ??
          '';

        this.productForm.patchValue({
          name: p.name,
          arabicName: p.arabicName || '',
          categoryId: resolvedCatId,
          brandId: resolvedBrandId,
          description: p.description || '',
          slug: p.slug || '',
          isPublished: p.isPublished ?? true
        });

        if (p.variants && p.variants.length > 0) {
          const mappedVariants: UpdateProductVariantRequest[] = p.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            color: v.color || '',
            size: v.size || '',
            stock: v.stock,
            price: v.price || v.finalPrice || v.originalPrice || 0,
            costPrice: v.costPrice || 0,
            compareAtPrice: v.compareAtPrice || 0,
            bust: v.bust || 0,
            waist: v.waist || 0,
            hip: v.hip || 0,
            length: v.length || 0,
            isActive: true
          }));
          this.variants.set(mappedVariants);
        }
      }
    },
    error: () => this.isLoadingProduct.set(false),
  });
}

  private loadImages(id: number): void {
    this.isLoadingImages.set(true);
    this.adminCatalogService.getImages(id).subscribe({
      next: (res) => {
        this.isLoadingImages.set(false);
        if (res.success && res.data) {
          this.images.set(res.data);
        }
      },
      error: () => this.isLoadingImages.set(false),
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}