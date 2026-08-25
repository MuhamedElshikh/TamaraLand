import {
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { AddressResponse } from '../../../../core/models/domain.models';
import { StoreSettingsService } from '../../../../core/services/store-settings.service';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslatePipe,
  ],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.css',
})
export class CheckoutShippingComponent {
  private readonly storeSettingsService =
    inject(StoreSettingsService);

  readonly selectedAddress =
    input<AddressResponse | null>(null);

  readonly settings =
    this.storeSettingsService.settings;

  readonly governorate =
    computed(
      () =>
        this.selectedAddress()
          ?.governorate ?? ''
    );

  readonly area =
    computed(
      () =>
        this.selectedAddress()
          ?.area ?? ''
    );

  readonly shiyakha =
    computed(
      () =>
        this.selectedAddress()
          ?.shiyakha ?? ''
    );

  readonly street =
    computed(
      () =>
        this.selectedAddress()
          ?.street ?? ''
    );

  readonly building =
    computed(
      () =>
        this.selectedAddress()
          ?.building ?? ''
    );

  readonly floor =
    computed(
      () =>
        this.selectedAddress()
          ?.floor ?? ''
    );

  readonly apartment =
    computed(
      () =>
        this.selectedAddress()
          ?.apartment ?? ''
    );

  readonly notes =
    computed(
      () =>
        this.selectedAddress()
          ?.notes ?? ''
    );

  readonly shippingCost =
    computed(
      () =>
        this.selectedAddress()
          ?.shippingCost ?? 0
    );

  readonly isDeliveryAvailable =
    computed(
      () =>
        this.selectedAddress()
          ?.isDeliveryAvailable ?? false
    );

  readonly noAddressSelected =
    computed(
      () =>
        !this.selectedAddress()
    );

  readonly deliveryNotAvailable =
    computed(
      () =>
        !!this.selectedAddress() &&
        !this.isDeliveryAvailable()
    );

  readonly isOpeningWhatsApp =
    signal(false);

  openWhatsApp(): void {
    const address =
      this.selectedAddress();

    const whatsappNumber =
      this.settings()
        ?.whatsAppNumber;

    if (
      !address ||
      !whatsappNumber ||
      this.isOpeningWhatsApp()
    ) {
      return;
    }

    this.isOpeningWhatsApp.set(true);

    const lines = [
      'مرحبًا، أرغب في الاستفسار عن إمكانية التوصيل إلى منطقتي.',
      '',
      `الاسم: ${address.fullName}`,
      `رقم الهاتف: ${address.phoneNumber}`,
      `المحافظة: ${address.governorate}`,
      `المنطقة: ${address.area}`,
      `الشيخة: ${address.shiyakha}`,
      `الشارع: ${address.street}`,
    ];

    if (address.building) {
      lines.push(
        `المبنى: ${address.building}`
      );
    }

    if (address.floor) {
      lines.push(
        `الدور: ${address.floor}`
      );
    }

    if (address.apartment) {
      lines.push(
        `الشقة: ${address.apartment}`
      );
    }

    if (address.notes) {
      lines.push(
        `ملاحظات: ${address.notes}`
      );
    }

    lines.push(
      `الإحداثيات: ${address.latitude}, ${address.longitude}`
    );

    const message =
      encodeURIComponent(
        lines.join('\n')
      );

    const normalizedNumber =
      whatsappNumber
        .replace(/\D/g, '');

    const url =
      `https://wa.me/${normalizedNumber}?text=${message}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );

    this.isOpeningWhatsApp.set(false);
  }
}