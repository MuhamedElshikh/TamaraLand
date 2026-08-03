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

  setUser(userId: string): void {
    window.clarity?.('identify', userId);
  }

  clearUser(): void {
    window.clarity?.('identify', null);
  }
}