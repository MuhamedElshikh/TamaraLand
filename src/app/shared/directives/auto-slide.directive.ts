import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, NgZone } from '@angular/core';

@Directive({
  selector: '[appAutoSlide]',
  standalone: true,
  exportAs: 'autoSlide',
})
export class AutoSlideDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);

  /** 'forward' | 'reverse' — أي حاجة غير 'reverse' هتتعامل كـ forward */
  @Input('appAutoSlide') direction: string = 'forward';
  /** بكسل لكل tick */
  @Input() autoSlideStep = 1;
  /** ms بين كل tick (كل ما قلّت كل ما بقى أنعم) */
  @Input() autoSlideTick = 30;
  /** ms قبل ما يرجع يتحرك بعد أي تفاعل من اليوزر */
  @Input() autoSlideResumeDelay = 2500;

  private intervalId?: ReturnType<typeof setInterval>;
  private resumeTimeout?: ReturnType<typeof setTimeout>;
  private paused = false;
  private isRtl = false;

  ngOnInit(): void {
    const el = this.el.nativeElement;
    this.isRtl = getComputedStyle(el).direction === 'rtl';

    el.addEventListener('mouseenter', this.pauseNow);
    el.addEventListener('mouseleave', this.resumeSoon);
    el.addEventListener('touchstart', this.pauseNow, { passive: true });
    el.addEventListener('touchend', this.resumeSoon, { passive: true });
    el.addEventListener('wheel', this.pauseThenResume, { passive: true });

    this.zone.runOutsideAngular(() => {
      this.intervalId = setInterval(this.tick, this.autoSlideTick);
    });
  }

  private tick = (): void => {
    if (this.paused) return;
    const el = this.el.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) return; // مفيش حاجة تتسحب أصلاً

    const rtlFlip = this.isRtl ? -1 : 1;
    const sign = (this.direction === 'reverse' ? -1 : 1) * rtlFlip;

    const min = this.isRtl ? -maxScroll : 0;
    const max = this.isRtl ? 0 : maxScroll;

    let next = el.scrollLeft + sign * this.autoSlideStep;
    if (next > max) next = min;
    if (next < min) next = max;

    el.scrollLeft = next;
  };

  /** يوقف السحب فورًا — استخدمها لما اليوزر يعمل أكشن يدوي (زرار مثلاً) */
  public pauseNow = (): void => {
    this.paused = true;
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
  };

  /** يجدول رجوع السحب بعد autoSlideResumeDelay */
  public resumeSoon = (): void => {
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    this.resumeTimeout = setTimeout(() => (this.paused = false), this.autoSlideResumeDelay);
  };

  private pauseThenResume = (): void => {
    this.pauseNow();
    this.resumeSoon();
  };

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);

    const el = this.el.nativeElement;
    el.removeEventListener('mouseenter', this.pauseNow);
    el.removeEventListener('mouseleave', this.resumeSoon);
    el.removeEventListener('touchstart', this.pauseNow);
    el.removeEventListener('touchend', this.resumeSoon);
    el.removeEventListener('wheel', this.pauseThenResume);
  }
}