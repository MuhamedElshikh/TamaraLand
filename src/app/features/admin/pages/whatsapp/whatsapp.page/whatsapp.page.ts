import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AdminWhatsAppService } from '../../../../../core/services/admin-whatsapp.service'; // عدّل المسار
import {
  WhatsAppConfigurationResponse,
  WhatsAppRecipientResponse,
} from '../../../../../core/models/whatsapp.models'; // عدّل المسار
import { ToastService } from '../../../../../shared/toast/toast.service'; // عدّل المسار
import { extractErrorMessage } from '../../../../../core/utils/error-message.util'; // عدّل المسار

const POLL_INTERVAL_MS = 4000;
const QR_REFRESH_EVERY_TICKS = 5; // 5 * 4s = 20s

@Component({
  selector: 'app-admin-whatsapp-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './whatsapp.page.html',
  styleUrl: './whatsapp.page.css',
})
export class WhatsAppPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly whatsAppService = inject(AdminWhatsAppService);
  private readonly toast = inject(ToastService);

  readonly recipientResults = signal<WhatsAppRecipientResponse[]>([]);
  readonly isSearchingRecipients = signal(false);
  private recipientSearchSubscription?: Subscription;

  readonly config = signal<WhatsAppConfigurationResponse | null>(null);
  readonly isLoadingConfig = signal(true);

  readonly isConnecting = signal(false);
  readonly isRefreshing = signal(false);
  readonly isDisconnecting = signal(false);

  readonly qrImageUrl = signal<string | null>(null);
  readonly isLoadingQr = signal(false);
  private currentQrObjectUrl: string | null = null;

  readonly isSendingMessage = signal(false);
  readonly sendError = signal<string | null>(null);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollTicks = 0;

  readonly usagePercent = computed(() => {
    const c = this.config();
    if (!c || !c.monthlyLimit) return 0;
    return Math.min(100, Math.round((c.monthlySent / c.monthlyLimit) * 100));
  });

  readonly messageForm = this.fb.nonNullable.group({
    phoneNumber: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    this.loadConfiguration();
    this.setupRecipientSearch();
  }

  ngOnDestroy(): void {
    this.recipientSearchSubscription?.unsubscribe();
    this.stopPolling();
    this.revokeQrUrl();
  }

  // ---------- Configuration ----------

  loadConfiguration(): void {
    this.isLoadingConfig.set(true);
    this.whatsAppService.getConfiguration().subscribe({
      next: (res) => {
        this.isLoadingConfig.set(false);
        if (res.success && res.data) {
          this.config.set(res.data);
          if (res.data.isConnected) {
            this.stopPolling();
            this.clearQr();
          } else {
            this.loadQrCode();
          }
        }
      },
      error: () => this.isLoadingConfig.set(false),
    });
  }

  /** Reloads config without flashing the loading state. */
  private fetchConfigSilently(): void {
    this.whatsAppService.getConfiguration().subscribe({
      next: (res) => {
        if (!(res.success && res.data)) return;

        const wasConnected = this.config()?.isConnected ?? false;
        this.config.set(res.data);

        if (res.data.isConnected) {
          this.stopPolling();
          this.clearQr();
          if (!wasConnected) this.toast.success('WhatsApp connected successfully.');
        }
      },
      error: () => {
        /* ignore transient errors while polling */
      },
    });
  }

  // ---------- QR + polling ----------

  private loadQrCode(showSkeleton = true): void {
    if (showSkeleton) this.isLoadingQr.set(true);

    this.whatsAppService.getQrImage().subscribe({
      next: (blob) => {
        this.isLoadingQr.set(false);
        this.revokeQrUrl();
        this.currentQrObjectUrl = URL.createObjectURL(blob);
        this.qrImageUrl.set(this.currentQrObjectUrl);

        if (!this.pollTimer) this.startPolling();
      },
      error: () => {
        this.isLoadingQr.set(false);
        if (showSkeleton) this.qrImageUrl.set(null);
      },
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTicks = 0;

    this.pollTimer = setInterval(() => {
      this.pollTicks++;
      this.fetchConfigSilently();

      if (this.pollTicks % QR_REFRESH_EVERY_TICKS === 0 && !this.config()?.isConnected) {
        this.loadQrCode(false);
      }
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private clearQr(): void {
    this.revokeQrUrl();
    this.qrImageUrl.set(null);
  }

  private revokeQrUrl(): void {
    if (this.currentQrObjectUrl) {
      URL.revokeObjectURL(this.currentQrObjectUrl);
      this.currentQrObjectUrl = null;
    }
  }

  // ---------- Actions ----------

  connect(): void {
    this.isConnecting.set(true);
    this.whatsAppService.connect().subscribe({
      next: (res) => {
        this.isConnecting.set(false);
        if (res.success) {
          this.loadConfiguration();
        } else {
          this.toast.error(res.message);
        }
      },
      error: (err) => {
        this.isConnecting.set(false);
        this.toast.error(extractErrorMessage(err, 'Could not connect WhatsApp.'));
      },
    });
  }

  refreshStatus(): void {
    this.isRefreshing.set(true);
    this.whatsAppService.refresh().subscribe({
      next: (res) => {
        this.isRefreshing.set(false);
        if (res.success) {
          this.toast.success('Status refreshed.');
          this.loadConfiguration();
        } else {
          this.toast.error(res.message);
        }
      },
      error: (err) => {
        this.isRefreshing.set(false);
        this.toast.error(extractErrorMessage(err, 'Could not refresh status.'));
      },
    });
  }

  disconnect(): void {
    if (!confirm('Disconnect WhatsApp? Customers will stop receiving verification codes and notifications.')) return;

    this.isDisconnecting.set(true);
    this.whatsAppService.logout().subscribe({
      next: (res) => {
        this.isDisconnecting.set(false);
        if (res.success) {
          this.stopPolling();
          this.toast.success('WhatsApp disconnected.');
          this.loadConfiguration();
        } else {
          this.toast.error(res.message);
        }
      },
      error: (err) => {
        this.isDisconnecting.set(false);
        this.toast.error(extractErrorMessage(err, 'Could not disconnect WhatsApp.'));
      },
    });
  }

  // ---------- Send message ----------

  controlHasError(name: string, error: string): boolean {
    const control = this.messageForm.get(name);
    return Boolean(control && control.touched && control.hasError(error));
  }

  sendMessage(): void {
    if (this.messageForm.invalid || this.isSendingMessage()) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.isSendingMessage.set(true);
    this.sendError.set(null);

    this.whatsAppService.sendMessage(this.messageForm.getRawValue()).subscribe({
      next: (res) => {
        this.isSendingMessage.set(false);
        if (res.success) {
          this.toast.success('Message sent successfully.');
          this.recipientResults.set([]);
          this.messageForm.reset({ phoneNumber: '', message: '' }, { emitEvent: false });
          this.fetchConfigSilently();
        } else {
          this.sendError.set(res.message);
        }
      },
      error: (err) => {
        this.isSendingMessage.set(false);
        this.sendError.set(extractErrorMessage(err, 'Could not send the message.'));
      },
    });
  }

  // ---------- Recipient search ----------

  selectRecipient(recipient: WhatsAppRecipientResponse): void {
    // emitEvent:false so selecting doesn't trigger a new search
    this.messageForm.controls.phoneNumber.setValue(recipient.phoneNumber, { emitEvent: false });
    this.recipientResults.set([]);
  }

  closeRecipientResults(): void {
    this.recipientResults.set([]);
  }

  private setupRecipientSearch(): void {
    const phoneControl = this.messageForm.controls.phoneNumber;

    this.recipientSearchSubscription = phoneControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const search = value.trim();

          if (search.length < 2) {
            this.recipientResults.set([]);
            this.isSearchingRecipients.set(false);
            return of(null);
          }

          this.isSearchingRecipients.set(true);

          return this.whatsAppService.searchRecipients(search).pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((response) => {
        this.isSearchingRecipients.set(false);

        if (!response?.success) {
          this.recipientResults.set([]);
          return;
        }

        this.recipientResults.set(response.data ?? []);
      });
  }
}