import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductVariantSelectorComponent } from './product-variant-selector.component';

describe('ProductVariantSelectorComponent', () => {
  let fixture: ComponentFixture<ProductVariantSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductVariantSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductVariantSelectorComponent);
    fixture.detectChanges();
  });

  it('updates the selected variant when a different option is clicked', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.variant-chip')) as HTMLElement[];
    const champagneButton = buttons.find((button) => button.textContent?.includes('Champagne'));

    champagneButton?.click();
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('.variant-status');
    expect(status.textContent).toContain('Champagne');
  });

  it('uses backend variant values and emits the matching selected variant', () => {
    fixture.componentInstance.variants = [
      { id: 10, sku: 'NK001', color: 'Black', size: '42', stock: 8, isActive: true, originalPrice: 2500, finalPrice: 2500, discountPercentage: 0 },
      { id: 11, sku: 'NK002', color: 'White', size: '44', stock: 5, isActive: true, originalPrice: 2600, finalPrice: 2600, discountPercentage: 0 }
    ];
    fixture.componentInstance.ngOnChanges({ variants: new SimpleChange(undefined, fixture.componentInstance.variants, true) });
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.variant-chip')) as HTMLElement[];
    const blackButton = buttons.find((button) => button.textContent?.includes('Black'));

    blackButton?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedColor).toBe('Black');
    expect(fixture.componentInstance.selectionChange.emit).toHaveBeenCalled();
  });
});
