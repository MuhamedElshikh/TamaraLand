import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';

import {
  isPlatformBrowser,
} from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {

  private readonly el =
    inject(ElementRef<HTMLElement>);

  private readonly renderer =
    inject(Renderer2);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly isBrowser =
    isPlatformBrowser(this.platformId);

  private observer?: IntersectionObserver;

  private delay = 0;


  @Input('appScrollReveal')
  set delayInput(value: number | string | '') {
    this.delay =
      value === '' || value == null
        ? 0
        : Number(value) || 0;
  }


  ngOnInit(): void {

    const el =
      this.el.nativeElement;


    // This class is safe during SSR/prerender.
    this.renderer.addClass(
      el,
      'reveal-init'
    );


    // IntersectionObserver is browser-only.
    if (!this.isBrowser) {
      return;
    }


    this.observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) {
              return;
            }


            setTimeout(() => {

              this.renderer.addClass(
                el,
                'reveal-active'
              );

            }, this.delay);


            this.observer?.unobserve(el);

          });

        },
        {
          threshold: 0.15,
          rootMargin:
            '0px 0px -60px 0px',
        }
      );


    this.observer.observe(el);

  }


  ngOnDestroy(): void {

    this.observer?.disconnect();
    this.observer = undefined;

  }

}