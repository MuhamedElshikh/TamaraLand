import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  NgZone,
} from '@angular/core';

import {
  DOCUMENT,
  isPlatformBrowser,
} from '@angular/common';

@Directive({
  selector: '[appAutoSlide]',
  standalone: true,
  exportAs: 'autoSlide',
})
export class AutoSlideDirective implements OnInit, OnDestroy {

  private readonly el =
    inject(ElementRef<HTMLElement>);

  private readonly zone =
    inject(NgZone);

  private readonly document =
    inject(DOCUMENT);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly isBrowser =
    isPlatformBrowser(this.platformId);


  @Input('appAutoSlide')
  direction: 'forward' | 'reverse' | string = 'forward';

  @Input()
  autoSlideInterval = 3500;

  @Input()
  autoSlideResumeDelay = 4000;


  private timerId?: ReturnType<typeof setInterval>;

  private resumeTimeout?: ReturnType<typeof setTimeout>;

  private paused = false;


  ngOnInit(): void {

    // Auto sliding is a browser-only UI behavior.
    // Do absolutely nothing during SSR/prerender.
    if (!this.isBrowser) {
      return;
    }


    const el =
      this.el.nativeElement;


    el.addEventListener(
      'mouseenter',
      this.pauseNow
    );

    el.addEventListener(
      'mouseleave',
      this.resumeSoon
    );

    el.addEventListener(
      'touchstart',
      this.pauseNow,
      { passive: true }
    );

    el.addEventListener(
      'touchend',
      this.resumeSoon,
      { passive: true }
    );


    this.zone.runOutsideAngular(() => {

      this.timerId =
        setInterval(
          this.step,
          this.autoSlideInterval
        );

    });

  }


  private step = (): void => {

    // Extra safety in case this method is somehow called
    // outside the browser lifecycle.
    if (!this.isBrowser) {
      return;
    }


    if (this.paused) {
      return;
    }


    const el =
      this.el.nativeElement;


    const maxScroll =
      el.scrollWidth -
      el.clientWidth;


    if (maxScroll <= 5) {
      return;
    }


    const isRtl =
      this.document.documentElement.dir === 'rtl' ||
      this.document.body.dir === 'rtl';


   const card =
  el.querySelector(
    '.slider-item'
  ) as HTMLElement | null;


    const stepAmount =
      (card?.clientWidth ?? 250) + 16;


    const currentScroll =
      Math.abs(el.scrollLeft);


    const isAtEnd =
      currentScroll >=
      maxScroll - 15;


    if (isAtEnd) {

      // Jump instantly to the beginning.
      // This prevents the slider from visually reversing direction.
      el.scrollTo({
        left: 0,
        behavior: 'auto',
      });

    } else {

      const scrollDir =
        isRtl ? -1 : 1;


      el.scrollBy({
        left:
          stepAmount * scrollDir,
        behavior: 'smooth',
      });

    }

  };


  public pauseNow = (): void => {

    if (!this.isBrowser) {
      return;
    }


    this.paused = true;


    if (this.resumeTimeout) {

      clearTimeout(
        this.resumeTimeout
      );

      this.resumeTimeout = undefined;

    }

  };


  public resumeSoon = (): void => {

    if (!this.isBrowser) {
      return;
    }


    if (this.resumeTimeout) {

      clearTimeout(
        this.resumeTimeout
      );

    }


    this.resumeTimeout =
      setTimeout(() => {

        this.paused = false;

        this.resumeTimeout =
          undefined;

      }, this.autoSlideResumeDelay);

  };


  ngOnDestroy(): void {

    if (this.timerId) {

      clearInterval(
        this.timerId
      );

      this.timerId =
        undefined;

    }


    if (this.resumeTimeout) {

      clearTimeout(
        this.resumeTimeout
      );

      this.resumeTimeout =
        undefined;

    }


    // There is no reason to manipulate browser DOM
    // during SSR/prerender.
    if (!this.isBrowser) {
      return;
    }


    const el =
      this.el.nativeElement;


    el.removeEventListener(
      'mouseenter',
      this.pauseNow
    );

    el.removeEventListener(
      'mouseleave',
      this.resumeSoon
    );

    el.removeEventListener(
      'touchstart',
      this.pauseNow
    );

    el.removeEventListener(
      'touchend',
      this.resumeSoon
    );

  }

}