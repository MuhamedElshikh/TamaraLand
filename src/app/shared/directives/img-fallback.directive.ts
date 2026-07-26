import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/** Swaps broken images with a safe fallback source. */
@Directive({ selector: '[appImgFallback]', standalone: true })
export class ImgFallbackDirective {
  @Input('appImgFallback') fallbackSrc = 'assets/images/placeholder-product.svg';

  constructor(private readonly elementRef: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError(): void {
    const element = this.elementRef.nativeElement;
    if (element.src !== this.fallbackSrc) {
      element.src = this.fallbackSrc;
    }
  }
}
