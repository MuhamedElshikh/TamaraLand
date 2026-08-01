import { Component, OnInit, inject, signal } from '@angular/core';
import { AddressCardComponent } from '../../components/address-card/address-card.component';
import { AddressFormComponent } from '../../components/address-form/address-form.component';
import { AddressService } from '../../../../core/services/address.service';
import { AddressResponse } from '../../../../core/models/domain.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-address-list-page',
  standalone: true,
  imports: [AddressCardComponent, AddressFormComponent,TranslatePipe],
  templateUrl: './address-list.page.html',
  styleUrl: './address-list.page.css',
})
export class AddressListPage implements OnInit {
  private readonly addressService = inject(AddressService);
  readonly currentLang = signal('en');

  readonly addresses = this.addressService.addresses;
  readonly isLoading = signal(true);

  readonly isFormOpen = signal(false);
  readonly editingAddress = signal<AddressResponse | null>(null);

  ngOnInit(): void {
    this.addressService.getAddresses().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

  openCreateForm(): void {
    this.editingAddress.set(null);
    this.isFormOpen.set(true);
  }

  openEditForm(address: AddressResponse): void {
    this.editingAddress.set(address);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingAddress.set(null);
  }

  onSaved(): void {
    this.closeForm();
  }
}