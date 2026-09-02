import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'dark' | 'light';
const STORAGE_KEY = 'tamara-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    if (this.isBrowser) {
      this.applyTheme(this.theme());
    }
  }

  toggle(): void {
    if (!this.isBrowser) return;

    const next: ThemeMode = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser) return;

    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private getInitialTheme(): ThemeMode {
    if (!this.isBrowser) return 'dark';

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;

    // لو مفيش حاجة متخزنة، بنحترم تفضيل نظام التشغيل بتاع المستخدم
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
}