import {Component,computed,effect,inject,signal,} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {DataTableColumn,DataTableComponent,} from '../../../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../../../shared/pagination/pagination';
import { AdminUserService } from '../../../../../../core/services/admin-user.service';
import {UserFilterRequest,UserResponse,} from '../../../../../../core/models/user.models';
import { UserDetailsDrawerComponent } from '../../component/user-details-drawer.component/user-details-drawer.component';
import { ChangeUserRoleDialogComponent } from '../../component/change-user-role-dialog.component/change-user-role-dialog.component';
import { ConfirmUserStatusDialogComponent } from '../../component/confirm-user-status-dialog.component/confirm-user-status-dialog.component';
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, PaginationComponent, UserDetailsDrawerComponent, ChangeUserRoleDialogComponent, ConfirmUserStatusDialogComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage {

  private readonly userService =
    inject(AdminUserService);
readonly drawerOpen = signal(false);
readonly roleDialogOpen = signal(false);
readonly statusDialogOpen = signal(false);

readonly selectedUser =
signal<UserResponse | null>(null);
  readonly loading =
    signal(false);

  readonly users =
    signal<UserResponse[]>([]);

  readonly totalPages =
    signal(1);

  readonly totalCount =
    signal(0);

  readonly filter =
    signal<UserFilterRequest>({
      pageNumber: 1,
      pageSize: 10,
    });

  readonly search =
    signal('');

  readonly selectedRole =
    signal('');

  readonly selectedStatus =
    signal('');

  readonly columns: DataTableColumn<UserResponse>[] = [

    {
      key: 'fullName',
      header: 'User',
    },

    {
      key: 'email',
      header: 'Email',
    },

    {
      key: 'phoneNumber',
      header: 'Phone',
    },

    {
      key: 'role',
      header: 'Role',
      type: 'badge',
    },

    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      accessor: x =>
        x.isActive
          ? 'Active'
          : 'Inactive',
    },

    {
      key: 'createdAt',
      header: 'Joined',
      type: 'date',
    },

  ];

  readonly currentPage =
    computed(() =>
      this.filter().pageNumber ?? 1
    );

  constructor() {

    effect(() => {

      this.loadUsers();

    });

  }

  loadUsers(): void {

    this.loading.set(true);

    this.userService
      .getUsers(
        this.filter(),
      )
      .subscribe({

        next: res => {

          this.users.set(
            res.data.items,
          );

          this.totalPages.set(
            res.data.totalPages,
          );

          this.totalCount.set(
            res.data.totalCount,
          );

          this.loading.set(false);

        },

        error: () => {

          this.loading.set(false);

        },

      });

  }

  onSearch(): void {

    this.filter.update(f => ({

      ...f,

      pageNumber: 1,

      search:
        this.search()
          .trim(),

    }));

  }

  onRoleChanged(
    value: string,
  ): void {

    this.selectedRole.set(
      value,
    );

    this.filter.update(f => ({

      ...f,

      pageNumber: 1,

      role:
        value || undefined,

    }));

  }

  onStatusChanged(
    value: string,
  ): void {

    this.selectedStatus.set(
      value,
    );

    this.filter.update(f => ({

      ...f,

      pageNumber: 1,

      isActive:

        value === ''
          ? undefined
          : value === 'true',

    }));

  }

  changePage(
    page: number,
  ): void {

    this.filter.update(f => ({

      ...f,

      pageNumber: page,

    }));

  }

  refresh(): void {

    this.loadUsers();

  }

  viewUser(
    user: UserResponse,
  ): void {

   this.openDrawer(user);

  }

  editRole(user: UserResponse): void {

  this.selectedUser.set(user);

  this.roleDialogOpen.set(true);

}
saveRole(request: { id: number; role: string }): void {

  this.userService
    .updateRole(request.id, {
      role: request.role,
    })
    .subscribe({
      next: () => {

        this.roleDialogOpen.set(false);

        this.refresh();

      },
    });

}

 toggleStatus(user: UserResponse): void {

  this.selectedUser.set(user);

  this.statusDialogOpen.set(true);

}
confirmStatus(user: UserResponse): void {

  this.userService
    .updateStatus(user.id, {
      isActive: !user.isActive,
    })
    .subscribe({

      next: () => {

        this.statusDialogOpen.set(false);

        this.drawerOpen.set(false);

        this.refresh();

      },

    });

}
  openDrawer(user: UserResponse): void {

  this.selectedUser.set(user);

  this.drawerOpen.set(true);

}

closeDrawer(): void {

  this.drawerOpen.set(false);

}

}