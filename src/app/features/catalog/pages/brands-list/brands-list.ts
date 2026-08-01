import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../../../core/services/catalog.service';
import { BrandResponse } from '../../../../core/models/catalog.models';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe'; 

@Component({
  selector: 'app-brands-list',
  standalone: true,
  imports: [RouterLink,LocalizedNamePipe,TranslatePipe],
  templateUrl: './brands-list.html',
  styleUrl: './brands-list.css',
})
export class BrandsListPage implements OnInit {
  private readonly catalogService = inject(CatalogService);

  readonly brands = signal<BrandResponse[]>([]);
  readonly isLoading = signal(true);
  readonly fallbackImage = 'assets/placeholder-product.jpg';

  ngOnInit(): void {
    this.catalogService
      .getBrands({ pageSize: 50 })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.success && res.data) this.brands.set(res.data.items);
        this.isLoading.set(false);
      });
  }
}