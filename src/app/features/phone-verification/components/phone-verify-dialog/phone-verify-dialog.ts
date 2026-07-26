import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { PhoneVerificationService } from '../../../../core/services/phoneverification.service'; // عدّل المسار
import { ToastService } from '../../../../shared/toast/toast.service'; // عدّل المسار
import { extractErrorMessage } from '../../../../core/utils/error-message.util'; // عدّل المسار

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-phone-verify-dialog',
  standalone: true,
  templateUrl: './phone-verify-dialog.html',
  styleUrl: './phone-verify-dialog.css',
})
export class PhoneVerifyDialogComponent implements OnInit, OnDestroy {
  private readonly phoneVerificationService = inject(PhoneVerificationService);
  private readonly toast = inject(ToastService);
  private countdownTimer?: ReturnType<typeof setInterval>;

  @Input({ required: true }) phoneNumber!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() verified = new EventEmitter<void>();

  readonly code = signal('');
  readonly codeSent = signal(false);
  readonly isSendingCode = signal(false);
  readonly isVerifying = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly resendCountdown = signal(0);

  ngOnInit(): void {
    // نبعت الكود تلقائي أول ما الديالوج يفتح، بدل ما اليوزر يضطر يدوس زرار إضافي
    this.sendCode();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownTimer);
  }

  sendCode(): void {
    if (this.isSendingCode() || this.resendCountdown() > 0) return;

    this.isSendingCode.set(true);
    this.errorMessage.set(null);

    this.phoneVerificationService.sendCode(this.phoneNumber).subscribe({
      next: (res) => {
        console.log(res)
        this.isSendingCode.set(false);
        if (res.success) {
          this.codeSent.set(true);
          this.toast.success('Verification code sent via WhatsApp.');
          this.startCountdown();
        } 
        if (res.message.includes('already been sent')) {
        this.codeSent.set(true);
        this.startCountdown();
        this.errorMessage.set(
            'A verification code was already sent. Please enter the code you received.'
        );
        return;
    }
        else {
          this.errorMessage.set(res.message);
        }
      },
      error: (err) => {
        this.isSendingCode.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Could not send the verification code.'));
      },
    });
  }

  private startCountdown(): void {
    this.resendCountdown.set(RESEND_COOLDOWN_SECONDS);
    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.resendCountdown.update((v) => {
        if (v <= 1) {
          clearInterval(this.countdownTimer);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  onCodeInput(value: string): void {
    // أرقام بس، حد أقصى 6 خانات
    this.code.set(value.replace(/\D/g, '').slice(0, 6));
  }

  verify(): void {
    if (this.code().length !== 6 || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.errorMessage.set(null);

    this.phoneVerificationService.verifyCode(this.phoneNumber, this.code()).subscribe({
      next: (res) => {
        this.isVerifying.set(false);
        if (res.success) {
          this.toast.success('Phone number verified successfully.');
          this.verified.emit();
        } else {
          this.errorMessage.set(res.message);
        }
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Invalid or expired code.'));
      },
    });
  }

  close(): void {
    this.closed.emit();
  }
}