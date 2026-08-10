import {
  Component,
  computed,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';

import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/theme/theme.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
})
export class AdminHeaderComponent {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  @Output() menuClick = new EventEmitter<void>();

  readonly profile = this.auth.profile;

  readonly fullName = computed(() => {
    const p = this.profile();

    return p
      ? `${p.firstName} ${p.lastName}`
      : 'Admin';
  });


  logout(): void {
    this.auth.logout();
  }


  openMenu(): void {
    this.menuClick.emit();
  }


  toggleTheme(): void {
    this.themeService.toggle();
  }


  toggleLanguage(): void {
    this.languageService.toggle();
  }
}