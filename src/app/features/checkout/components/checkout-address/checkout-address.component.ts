import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AddressService } from '../../../../core/services/address.service';
import { AddressResponse } from '../../../../core/models/domain.models';
import { PhoneVerifyDialogComponent } from '../../../phone-verification/components/phone-verify-dialog/phone-verify-dialog'; // عدّل المسار

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [RouterLink, PhoneVerifyDialogComponent],
  templateUrl: './checkout-address.component.html',
  styleUrl: './checkout-address.component.css',
})
export class CheckoutAddressComponent implements OnInit {
  private readonly addressService = inject(AddressService);

  @Output() addressSelected = new EventEmitter<AddressResponse | null>();

  readonly addresses = this.addressService.addresses;
  readonly isLoading = signal(true);
  readonly selectedId = signal<number | null>(null);

  readonly verifyingAddress = signal<AddressResponse | null>(null);
  private readonly verifiedOverrides = signal<Set<number>>(new Set());

  isVerified(address: AddressResponse): boolean {
    return address.isPhoneVerified || this.verifiedOverrides().has(address.id);
  }

  ngOnInit(): void {
    this.addressService.getAddresses().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const list = res.data ?? [];
        const preselected = list.find((a) => a.isDefault) ?? list[0] ?? null;
        if (preselected) this.select(preselected);
      },
      error: () => this.isLoading.set(false),
    });
  }

  select(address: AddressResponse): void {
    this.selectedId.set(address.id);
    this.addressSelected.emit(address);
  }

  openVerifyDialog(address: AddressResponse, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.verifyingAddress.set(address);
  }

  closeVerifyDialog(): void {
    this.verifyingAddress.set(null);
  }

  onVerified(): void {
    const target = this.verifyingAddress();
    if (!target) return;

    this.verifiedOverrides.update((set) => new Set(set).add(target.id));

    if (this.selectedId() === target.id) {
      this.addressSelected.emit({ ...target, isPhoneVerified: true });
    }

    this.closeVerifyDialog();
  }
}