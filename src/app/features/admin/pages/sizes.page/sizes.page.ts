import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import {
  SizeResponse,
  CreateSizeRequest,
  UpdateSizeRequest,
} from '../../../../core/models';

import { SizeService } from '../../../../core/services/size.service';

@Component({
  selector: 'app-admin-sizes',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './sizes.page.html',
  styleUrl: './sizes.page.css',
})
export class AdminSizesPage implements OnInit {

  private readonly sizeService =
    inject(SizeService);

  readonly sizes =
    signal<SizeResponse[]>([]);

  readonly isLoading =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly successMessage =
    signal<string | null>(null);

  readonly editingId =
    signal<number | null>(null);

  name = '';

  sortOrder = 0;


  ngOnInit(): void {
    this.loadSizes();
  }


  loadSizes(): void {

    this.isLoading.set(true);
    this.clearMessages();

    this.sizeService
      .getAll()
      .subscribe({

        next: (response) => {

          this.isLoading.set(false);

          if (
            !response.success ||
            !response.data
          ) {
            this.errorMessage.set(
              response.message ||
              'Could not load sizes.'
            );

            return;
          }

          this.sizes.set(
            [...response.data].sort(
              (a, b) =>
                a.sortOrder - b.sortOrder
            )
          );
        },

        error: (error) => {

          this.isLoading.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Could not load sizes.'
          );
        },
      });
  }


  startCreate(): void {

    this.resetForm();

  }


  edit(size: SizeResponse): void {

    this.editingId.set(size.id);

    this.name = size.name;

    this.sortOrder = size.sortOrder;

    this.clearMessages();

  }


  cancelEdit(): void {

    this.resetForm();

  }


  save(): void {

    this.clearMessages();

    const name =
      this.name.trim();

    if (!name) {

      this.errorMessage.set(
        'Size name is required.'
      );

      return;
    }

    if (
      !Number.isFinite(this.sortOrder)
    ) {

      this.errorMessage.set(
        'Sort order must be a valid number.'
      );

      return;
    }

    this.isSaving.set(true);

    const id =
      this.editingId();


    // =========================
    // CREATE
    // =========================

    if (id === null) {

      const request: CreateSizeRequest = {
        name,
        sortOrder: this.sortOrder,
      };

      this.sizeService
        .create(request)
        .subscribe({

          next: (response) => {

            this.isSaving.set(false);

            if (
              !response.success ||
              !response.data
            ) {

              this.errorMessage.set(
                response.message ||
                'Could not create size.'
              );

              return;
            }

            this.sizes.update(
              sizes =>
                [
                  ...sizes,
                  response.data!,
                ].sort(
                  (a, b) =>
                    a.sortOrder - b.sortOrder
                )
            );

            this.successMessage.set(
              'Size created successfully.'
            );

            this.resetForm(false);
          },

          error: (error) => {

            this.isSaving.set(false);

            this.errorMessage.set(
              error?.error?.message ||
              'Could not create size.'
            );
          },
        });

      return;
    }


    // =========================
    // UPDATE
    // =========================

    const request: UpdateSizeRequest = {
      name,
      sortOrder: this.sortOrder,
    };

    this.sizeService
      .update(id, request)
      .subscribe({

        next: (response) => {

          this.isSaving.set(false);

          if (
            !response.success ||
            !response.data
          ) {

            this.errorMessage.set(
              response.message ||
              'Could not update size.'
            );

            return;
          }

          this.sizes.update(
            sizes =>
              sizes
                .map(size =>
                  size.id === id
                    ? response.data!
                    : size
                )
                .sort(
                  (a, b) =>
                    a.sortOrder - b.sortOrder
                )
          );

          this.successMessage.set(
            'Size updated successfully.'
          );

          this.resetForm(false);
        },

        error: (error) => {

          this.isSaving.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Could not update size.'
          );
        },
      });
  }


  delete(size: SizeResponse): void {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${size.name}"?`
      );

    if (!confirmed) {
      return;
    }

    this.clearMessages();

    this.sizeService
      .delete(size.id)
      .subscribe({

        next: (response) => {

          if (!response.success) {

            this.errorMessage.set(
              response.message ||
              'Could not delete size.'
            );

            return;
          }

          this.sizes.update(
            sizes =>
              sizes.filter(
                item =>
                  item.id !== size.id
              )
          );

          if (
            this.editingId() === size.id
          ) {
            this.resetForm(false);
          }

          this.successMessage.set(
            'Size deleted successfully.'
          );
        },

        error: (error) => {

          this.errorMessage.set(
            error?.error?.message ||
            'Could not delete size.'
          );
        },
      });
  }


  clearMessages(): void {

    this.errorMessage.set(null);
    this.successMessage.set(null);

  }


  resetForm(
    clearMessages = true
  ): void {

    this.editingId.set(null);

    this.name = '';

    this.sortOrder = 0;

    if (clearMessages) {
      this.clearMessages();
    }
  }
}