import { Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.css',
})
export class FaqPage {
  readonly faqs = signal<FaqItem[]>([
    { question: 'faq.items.order.q', answer: 'faq.items.order.a', open: false },
    { question: 'faq.items.shipping.q', answer: 'faq.items.shipping.a', open: false },
    { question: 'faq.items.returns.q', answer: 'faq.items.returns.a', open: false },
    { question: 'faq.items.sizes.q', answer: 'faq.items.sizes.a', open: false },
    { question: 'faq.items.payment.q', answer: 'faq.items.payment.a', open: false },
    { question: 'faq.items.cancel.q', answer: 'faq.items.cancel.a', open: false },
    { question: 'faq.items.track.q', answer: 'faq.items.track.a', open: false },
    { question: 'faq.items.gift.q', answer: 'faq.items.gift.a', open: false },
  ]);

  toggle(index: number): void {
    this.faqs.update(items =>
      items.map((item, i) =>
        i === index ? { ...item, open: !item.open } : { ...item, open: false }
      )
    );
  }
}
