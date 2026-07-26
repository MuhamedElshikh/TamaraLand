import { Component, Output, EventEmitter, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AddressService } from '../../../../core/services/address.service';
import { AddressResponse, ShippingAreaItem } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.css',
})
export class CheckoutShippingComponent {
  private readonly addressService = inject(AddressService);

  selectedAddress = input<AddressResponse | null>(null);

  @Output() areaSelected = new EventEmitter<ShippingAreaItem | null>();

  readonly shippingLookup = this.addressService.shippingLookup;
  readonly selectedAreaId = signal<number | null>(null);

  // المحافظة بقت مشتقة من العنوان المختار مباشرة، مش اختيار حر - كده مستحيل يحصل mismatch
  readonly governorate = computed(() => this.selectedAddress()?.governorate ?? '');

  readonly matchedGovernorateGroup = computed(() => {
    return this.shippingLookup().find((g) => g.governorate === this.governorate()) ?? null;
  });

  readonly areasForGovernorate = computed(() => this.matchedGovernorateGroup()?.areas ?? []);

  // بيبان لو محافظة العنوان مالهاش شحن متاح خالص، عشان نوقف اليوزر بدل ما نسيبه يبعت طلب هيترفض
  readonly noShippingAvailable = computed(() => {
    return !!this.governorate() && this.shippingLookup().length > 0 && !this.matchedGovernorateGroup();
  });

  constructor() {
    if (this.shippingLookup().length === 0) {
      this.addressService.getShippingLookup().subscribe();
    }

    // لما العنوان يتغيّر، نصفّر أي منطقة كانت متختارة قبل كده (كانت تبع عنوان تاني)
    effect(() => {
      this.governorate(); // بنتابعه بس عشان الـ effect يشتغل لما يتغيّر
      this.selectedAreaId.set(null);
      this.areaSelected.emit(null);
    });
  }

  onAreaChange(id: number | null): void {
    this.selectedAreaId.set(id);
    const area = this.areasForGovernorate().find((a) => a.id === id) ?? null;
    this.areaSelected.emit(area);
  }
}