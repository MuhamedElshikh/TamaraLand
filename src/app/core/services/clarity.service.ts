import { Injectable } from '@angular/core';

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClarityService {
  private readonly isBrowser = typeof window !== 'undefined';

  setUser(userId: string): void {
    if (!this.isBrowser) return;

    window.clarity?.('identify', userId);
  }

  clearUser(): void {
    if (!this.isBrowser) return;

    window.clarity?.('identify', null);
  }
}