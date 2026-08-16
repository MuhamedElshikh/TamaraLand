import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, NgZone } from '@angular/core';

@Directive({
  selector: '[appAutoSlide]',
  standalone: true,
  exportAs: 'autoSlide',
})
export class AutoSlideDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);

  @Input('appAutoSlide') direction: 'forward' | 'reverse' | string = 'forward';
  @Input() autoSlideInterval = 3500;
  @Input() autoSlideResumeDelay = 4000;

  private timerId?: ReturnType<typeof setInterval>;
  private resumeTimeout?: ReturnType<typeof setTimeout>;
  private paused = false;

  ngOnInit(): void {
    const el = this.el.nativeElement;

    el.addEventListener('mouseenter', this.pauseNow);
    el.addEventListener('mouseleave', this.resumeSoon);
    el.addEventListener('touchstart', this.pauseNow, { passive: true });
    el.addEventListener('touchend', this.resumeSoon, { passive: true });

    this.zone.runOutsideAngular(() => {
      this.timerId = setInterval(this.step, this.autoSlideInterval);
    });
  }

  private step = (): void => {
    if (this.paused) return;
    const el = this.el.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 5) return;

    const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
    const card = el.querySelector('.slider-item') as HTMLElement;
    const stepAmount = (card?.clientWidth ?? 250) + 16;

    const currentScroll = Math.abs(el.scrollLeft);
    const isAtEnd = currentScroll >= maxScroll - 15;

    if (isAtEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const scrollDir = isRtl ? -1 : 1;
      el.scrollBy({ left: stepAmount * scrollDir, behavior: 'smooth' });
    }
  };

  public pauseNow = (): void => {
    this.paused = true;
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
  };

  public resumeSoon = (): void => {
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    this.resumeTimeout = setTimeout(() => (this.paused = false), this.autoSlideResumeDelay);
  };

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);

    const el = this.el.nativeElement;
    el.removeEventListener('mouseenter', this.pauseNow);
    el.removeEventListener('mouseleave', this.resumeSoon);
    el.removeEventListener('touchstart', this.pauseNow);
    el.removeEventListener('touchend', this.resumeSoon);
  }
}