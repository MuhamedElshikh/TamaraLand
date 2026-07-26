import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { AddressService } from '../../../../core/services/address.service';
import { AddressResponse } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-address-card',
  standalone: true,
  templateUrl: './address-card.component.html',
  styleUrl: './address-card.component.css',
})
export class AddressCardComponent {
  private readonly addressService = inject(AddressService);

  @Input({ required: true }) address!: AddressResponse;
  @Output() edit = new EventEmitter<AddressResponse>();
  @Output() deleted = new EventEmitter<number>();

  readonly isDeleting = signal(false);
  readonly isSettingDefault = signal(false);

  onEdit(): void {
    this.edit.emit(this.address);
  }

  delete(): void {
    if (this.isDeleting()) return;
    if (!confirm('Delete this address? This cannot be undone.')) return;

    this.isDeleting.set(true);
    this.addressService.deleteAddress(this.address.id).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) this.deleted.emit(this.address.id);
      },
      error: () => this.isDeleting.set(false),
    });
  }

  setDefault(): void {
    if (this.isSettingDefault() || this.address.isDefault) return;

    this.isSettingDefault.set(true);
    this.addressService.setDefault(this.address.id).subscribe({
      next: () => this.isSettingDefault.set(false),
      error: () => this.isSettingDefault.set(false),
    });
  }
}