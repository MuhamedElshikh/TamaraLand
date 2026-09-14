import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'tamara-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser =
    isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<ThemeMode>(
    this.getInitialTheme()
  );

  constructor() {
    if (this.isBrowser) {
      this.applyTheme(this.theme());
    }
  }

  toggle(): void {
    if (!this.isBrowser) return;

    const next: ThemeMode =
      this.theme() === 'dark' ? 'light' : 'dark';

    this.theme.set(next);
    this.applyTheme(next);

    localStorage.setItem(STORAGE_KEY, next);
  }

  private applyTheme(mode: ThemeMode): void {
  if (!this.isBrowser) return;

  const html = document.documentElement;

  html.setAttribute('data-theme', mode);

  // Tell the browser that the application owns the active color scheme.
  // This prevents automatic dark/light transformations where supported.
  html.style.colorScheme = `${mode} only`;

  if (document.body) {
    document.body.setAttribute('data-theme', mode);
  }
}

  private getInitialTheme(): ThemeMode {
    if (!this.isBrowser) return 'dark';

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    const prefersLight =
      window.matchMedia?.('(prefers-color-scheme: light)').matches;

    return prefersLight ? 'light' : 'dark';
  }
}