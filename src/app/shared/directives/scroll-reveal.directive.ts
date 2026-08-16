import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  private delay: number = 0;

  @Input('appScrollReveal')
  set delayInput(value: number | string | '') {
    this.delay = value === '' || value == null ? 0 : Number(value) || 0;
  }

  ngOnInit(): void {
    const el = this.el.nativeElement;
    this.renderer.addClass(el, 'reveal-init');

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => this.renderer.addClass(el, 'reveal-active'), this.delay);
            this.observer?.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}