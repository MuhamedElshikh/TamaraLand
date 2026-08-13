import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  DataTableComponent,
  DataTableColumn,
} from '../../components/data-table/data-table.component';

import { PaginationComponent } from '../../../../shared/pagination/pagination';

import {
  BannerFilterRequest,
  BannerResponse,
  BannerType,
} from '../../../../core/models/banner.models';

import { AdminBannerService } from '../../../../core/services/admn-banner.service';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-banners-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DataTableComponent,
    PaginationComponent,
    TranslatePipe
  ],
  templateUrl: './banners.page.html',
  styleUrl: './banners.page.css',
})
export class BannersPage implements OnInit {

  private readonly bannerService = inject(AdminBannerService);

  private readonly router = inject(Router);

  readonly banners = signal<BannerResponse[]>([]);

  readonly isLoading = signal(true);

  readonly totalPages = signal(1);

  readonly pageNumber = signal(1);

  readonly type = signal<BannerType | undefined>(undefined);

  readonly status = signal<boolean | undefined>(undefined);

  readonly isDeleting = signal<number | null>(null);

  readonly deleteError = signal<string | null>(null);

  readonly columns: DataTableColumn<BannerResponse>[] = [

   {
  key: 'imageUrl',
  header: 'Image',
  type: 'image',
  accessor: r => r.images.find(x => !x.isMobile)?.imageUrl
    ?? r.images[0]?.imageUrl
    ?? '',
},

    {
      key: 'title',
      header: 'Title',
    },

    {
      key: 'type',
      header: 'Type',
      accessor: r => this.getBannerTypeName(r.type),
    },

    {
      key: 'displayOrder',
      header: 'Order',
      align: 'center',
    },

    {
      key: 'isActive',
      header: 'Status',
      type: 'badge',
      accessor: r => r.isActive ? 'Active' : 'Inactive',
    },

  ];

  ngOnInit(): void {

    this.load(1);

  }

  onTypeChange(value: string): void {

    this.type.set(
      value ? Number(value) as BannerType : undefined
    );

    this.load(1);

  }

  onStatusChange(value: string): void {

    if (value === '') {

      this.status.set(undefined);

    }
    else {

      this.status.set(value === 'true');

    }

    this.load(1);

  }

  onPageChange(page: number): void {

    this.load(page);

    window.scrollTo({

      top: 0,

      behavior: 'smooth',

    });

  }

  addBanner(): void {

    this.router.navigate(['/admin/banner-form']);

  }

  editBanner(banner: BannerResponse): void {

    this.router.navigate([
      '/admin/banner-form',
      banner.id,
    ]);

  }

  deleteBanner(banner: BannerResponse): void {

    if (
      !confirm(
        `Delete "${banner.title}" ?`
      )
    ) {
      return;
    }

    this.deleteError.set(null);

    this.isDeleting.set(banner.id);

    this.bannerService.delete(banner.id).subscribe({

      next: res => {

        this.isDeleting.set(null);

        if (res.success) {

          this.load(this.pageNumber());

        }
        else {

          this.deleteError.set(
            res.message ??
            'Failed to delete banner.'
          );

        }

      },

      error: err => {

        this.isDeleting.set(null);

        this.deleteError.set(

          err?.error?.message ??

          'Failed to delete banner.'

        );

      },

    });

  }

  private load(page: number): void {

    this.isLoading.set(true);

    this.pageNumber.set(page);

    const filter: BannerFilterRequest = {

      type: this.type(),

      isActive: this.status(),

      pageNumber: page,

      pageSize: PAGE_SIZE,

    };

    this.bannerService.getAll(filter).subscribe({

      next: res => {

        if (res.success && res.data) {

          this.banners.set(

            res.data.items

          );

          this.totalPages.set(

            res.data.totalPages || 1

          );

        }
        else {

          this.banners.set([]);

          this.totalPages.set(1);

        }

        this.isLoading.set(false);

      },

      error: () => {

        this.banners.set([]);

        this.totalPages.set(1);

        this.isLoading.set(false);

      },

    });

  }

  getBannerTypeName(type: BannerType): string {

    switch (type) {

      case BannerType.HeroSlider:

        return 'Hero Slider';

      case BannerType.HomeBanner:

        return 'Home Banner';

      case BannerType.OfferBanner:

        return 'Offer Banner';

      case BannerType.CategoryBanner:

        return 'Category Banner';

      default:

        return '-';

    }

  }

}