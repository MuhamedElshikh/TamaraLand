import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CategoryResponse } from '../../../../core/models/catalog.models';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './categories-list.html',
  styleUrl: './categories-list.css',
})
export class CategoriesListPage implements OnInit {
  private readonly catalogService = inject(CatalogService);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly fallbackImage = 'assets/placeholder-product.jpg';

  ngOnInit(): void {
    this.catalogService
      .getCategories({ pageSize: 50 })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.success && res.data) this.categories.set(res.data.items);
        this.isLoading.set(false);
      });
  }
}