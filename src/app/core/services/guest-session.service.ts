import { Injectable } from '@angular/core';

const GUEST_ID_KEY = 'guestId';

@Injectable({
  providedIn: 'root'
})
export class GuestSessionService {

  constructor() {
    this.initialize();
  }

  /**
   * Initializes guest session if guestId is missing or invalid in localStorage.
   * Uses crypto.randomUUID() with safe fallback to ensure a valid guest ID.
   */
  initialize(): string {
    let guestId: string | null = null;
    try {
      guestId = localStorage.getItem(GUEST_ID_KEY);
    } catch {
      guestId = null;
    }

    if (!guestId || guestId === 'undefined' || guestId === 'null' || guestId.trim() === '') {
      guestId = this.generateUUID();
      try {
        localStorage.setItem(GUEST_ID_KEY, guestId);
      } catch (e) {
        console.warn('Could not save guestId to localStorage:', e);
      }
    }
    return guestId;
  }

  /**
   * Returns current guestId, ensuring initialization.
   */
  getGuestId(): string {
    let guestId: string | null = null;
    try {
      guestId = localStorage.getItem(GUEST_ID_KEY);
    } catch {
      guestId = null;
    }

    if (!guestId || guestId === 'undefined' || guestId === 'null' || guestId.trim() === '') {
      return this.initialize();
    }
    return guestId;
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (e) {
        console.warn('crypto.randomUUID failed, falling back to random generator:', e);
      }
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3f) | 0x8;
      return v.toString(16);
    });
  }
}
