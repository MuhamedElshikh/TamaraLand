import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface FaqItem {
  id: string;
  category: 'orders' | 'products' | 'gifts' | 'payment';
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  tagAr: string;
  tagEn: string;
  icon: string;
}

export interface FaqRow {
  id: string;
  speed: string;
  direction: 'left' | 'right';
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqPage {
  constructor(public readonly translate: TranslateService) {}

  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<string>('all');
  protected readonly selectedFaq = signal<FaqItem | null>(null);

  protected readonly categories = [
    { id: 'all', labelKey: 'faq.categories.all' },
    { id: 'orders', labelKey: 'faq.categories.orders' },
    { id: 'products', labelKey: 'faq.categories.products' },
    { id: 'gifts', labelKey: 'faq.categories.gifts' },
    { id: 'payment', labelKey: 'faq.categories.payment' },
  ];

  // All curated FAQ items for TamaraLand
  private readonly allFaqItems: FaqItem[] = [
    {
      id: 'q1',
      category: 'orders',
      questionAr: 'كيف يمكنني تتبع حالة طلبي؟',
      questionEn: 'How can I track my order status?',
      answerAr: 'يمكنك تتبع شحنتك لحظة بلحظة من خلال صفحة "طلباتي" في حسابك، أو عبر رقم التتبع المرسل إلى رقم الواتساب والبريد الإلكتروني المسجل فور شحن الطلب.',
      answerEn: 'You can track your shipment step-by-step from "My Orders" in your profile, or via the tracking link sent to your WhatsApp and email upon dispatch.',
      tagAr: 'تتبع الشحنة',
      tagEn: 'Order Tracking',
      icon: 'fa-truck-fast'
    },
    {
      id: 'q2',
      category: 'orders',
      questionAr: 'ما هي مدة وتكلفة الشحن والتوصيل؟',
      questionEn: 'What is the shipping timeframe and fee?',
      answerAr: 'يستغرق التوصيل من 2 إلى 4 أيام عمل لجميع المحافظات. يتم التوصيل بسيارات مبرغة ومجهزة لحماية المنتجات، والشحن مجاني للطلبات المؤهلة.',
      answerEn: 'Delivery takes 2 to 4 business days nationwide. Orders are shipped in temperature-protected packaging with free shipping on qualifying orders.',
      tagAr: 'شحن سريع',
      tagEn: 'Fast Delivery',
      icon: 'fa-box-open'
    },
    {
      id: 'q3',
      category: 'products',
      questionAr: 'كيف يتم حفظ وتخزين التمور الفاخرة؟',
      questionEn: 'How should luxury dates be stored?',
      answerAr: 'نوصي بحفظ التمور في عبواتها الأصلية محكمة الإغلاق في مكان بارد وجاف أو في الثلاجة للحفاظ على طراوتها ونكهتها الملكية الغنية لأطول فترة ممكنة.',
      answerEn: 'We recommend storing dates in their airtight container in a cool, dry place or in the refrigerator to maintain peak tenderness and royal flavor.',
      tagAr: 'جودة وطزاجة',
      tagEn: 'Freshness & Care',
      icon: 'fa-seedling'
    },
    {
      id: 'q4',
      category: 'payment',
      questionAr: 'ما هي طرق الدفع المتاحة في المتجر؟',
      questionEn: 'What payment methods are supported?',
      answerAr: 'نوفر الدفع عند الاستلام، بالإضافة إلى الدفع الإلكتروني الآمن عبر البطاقات الائتمانية (فيزا / ماستركارد)، بطاقات ميزة، والمحافظ الإلكترونية الذكية.',
      answerEn: 'We support Cash on Delivery, secure credit cards (Visa / Mastercard), Meeza cards, and mobile wallets.',
      tagAr: 'دفع آمن 100%',
      tagEn: '100% Secure',
      icon: 'fa-shield-halved'
    },
    {
      id: 'q5',
      category: 'gifts',
      questionAr: 'هل تتوفر صناديق وباقات هدايا للمناسبات؟',
      questionEn: 'Do you offer customized gift boxes for events?',
      answerAr: 'نعم! نقدم تشكيلة راقية من صناديق الهدايا الملكية والباقات الفاخرة مع إمكانية إضافة كارت إهداء بعبارات مخصصة حسب رغبتكم.',
      answerEn: 'Yes! We offer royal gift boxes and luxury bundles with customizable greeting cards tailored for your special occasions.',
      tagAr: 'هدايا ملكية',
      tagEn: 'Royal Gifts',
      icon: 'fa-gift'
    },
    {
      id: 'q6',
      category: 'products',
      questionAr: 'هل التمور المحشية طبيعية وخالية من المواد الحافظة؟',
      questionEn: 'Are stuffed dates natural and preservative-free?',
      answerAr: 'بكل تأكيد، نستخدم أجود أنواع التمور الطبيعية 100% والمحشوة بمكسرات طازجة ومحمصة بدون أي مواد حافظة أو إضافات صناعية.',
      answerEn: 'Absolutely. We use 100% natural, hand-picked dates stuffed with premium roasted nuts without any artificial preservatives.',
      tagAr: 'طبيعي 100%',
      tagEn: '100% Natural',
      icon: 'fa-leaf'
    },
    {
      id: 'q7',
      category: 'orders',
      questionAr: 'ما هي سياسة الاستبدال والاسترجاع؟',
      questionEn: 'What is the return and exchange policy?',
      answerAr: 'نضمن رضاكم التام. في حال وجود أي استفسار أو ملاحظة حول جودة المنتج، يمكنكم التواصل معنا خلال 48 ساعة من الاستلام للاستبدال أو استرداد المبلغ.',
      answerEn: 'Your satisfaction is guaranteed. If you have any concerns regarding product quality, contact us within 48 hours for a replacement or full refund.',
      tagAr: 'ضمان الجودة',
      tagEn: 'Guarantee',
      icon: 'fa-arrow-rotate-left'
    },
    {
      id: 'q8',
      category: 'payment',
      questionAr: 'كيف يمكنني استخدام كود الخصم؟',
      questionEn: 'How do I apply a discount coupon?',
      answerAr: 'في صفحة سلة المشتريات أو صفحة الدفع، ادخل رمز القسيمة في خانة "كوبون الخصم" واضغط "تطبيق" ليتم خصم القيمة فوراً من الإجمالي.',
      answerEn: 'In your cart or checkout page, enter your promo code in the "Coupon Code" field and click "Apply" to instantly receive the discount.',
      tagAr: 'خصومات حصرية',
      tagEn: 'Discounts',
      icon: 'fa-tag'
    },
    {
      id: 'q9',
      category: 'gifts',
      questionAr: 'هل توفرون عروضاً خاصة للشركات والكميات الكبيرة؟',
      questionEn: 'Do you offer corporate solutions & bulk orders?',
      answerAr: 'نعم، نقدم خدمات متكاملة للشركات والهيئات تشمل طباعة الهوية واللوجو على الصناديق الفاخرة مع أسعار حصرية للطلبات الكبرى.',
      answerEn: 'Yes, we provide corporate solutions including custom branding on luxury boxes with special tiered pricing for bulk orders.',
      tagAr: 'خدمات الشركات',
      tagEn: 'Corporate',
      icon: 'fa-building'
    },
    {
      id: 'q10',
      category: 'orders',
      questionAr: 'هل يمكنني تعديل عنوان الشحن بعد تأكيد الطلب؟',
      questionEn: 'Can I change my shipping address after ordering?',
      answerAr: 'نعم، طالما لم يتم تسليم الطلب لشركة الشحن، يمكنك تعديل العنوان بالتواصل السريع مع خدمة العملاء عبر الواتساب مع ذكر رقم الطلب.',
      answerEn: 'Yes, as long as the order has not been dispatched, you can update your address by contacting customer support on WhatsApp with your order ID.',
      tagAr: 'تعديل الطلب',
      tagEn: 'Edit Address',
      icon: 'fa-map-location-dot'
    },
    {
      id: 'q11',
      category: 'products',
      questionAr: 'ما هي الأنواع المتوفرة من تمور تمارا لاند؟',
      questionEn: 'What types of dates are available at TamaraLand?',
      answerAr: 'نوفر السكري الملكي الفاخر، عجوة المدينة المنورة الأصلية، خلاص القصيم الممتاز، الصقعي المحشو، بالإضافة إلى معمول التمر بالسمن البري.',
      answerEn: 'We offer Royal Sukkari, Authentic Medina Ajwa, Premium Qassim Khalas, Stuffed Sagai, and traditional date maamoul.',
      tagAr: 'تشكيلة فاخرة',
      tagEn: 'Royal Selection',
      icon: 'fa-crown'
    },
    {
      id: 'q12',
      category: 'payment',
      questionAr: 'هل بياناتي البنكية والشخصية آمنة أثناء الشراء؟',
      questionEn: 'Is my personal and payment data secure?',
      answerAr: 'نعم تماماً. نستخدم بوابات دفع مشفرة بمعايير SSL 256-bit العالمية لضمان سرية وأمان جميع معاملاتك المالية وحماية بياناتك.',
      answerEn: 'Absolutely. We utilize high-grade 256-bit SSL encrypted payment gateways to guarantee total privacy and security for your transactions.',
      tagAr: 'حماية وأمان',
      tagEn: 'SSL Secure',
      icon: 'fa-lock'
    }
  ];

  // Group items into 3 animated horizontal scroller rows
  protected readonly rows = computed<FaqRow[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    let items = this.allFaqItems;

    if (cat !== 'all') {
      items = items.filter(item => item.category === cat);
    }

    if (q) {
      items = items.filter(item =>
        item.questionAr.toLowerCase().includes(q) ||
        item.questionEn.toLowerCase().includes(q) ||
        item.answerAr.toLowerCase().includes(q) ||
        item.answerEn.toLowerCase().includes(q) ||
        item.tagAr.toLowerCase().includes(q)
      );
    }

    // Distribute into 3 dynamic horizontal scrolling rows
    const row1Items = items.filter((_, i) => i % 3 === 0);
    const row2Items = items.filter((_, i) => i % 3 === 1);
    const row3Items = items.filter((_, i) => i % 3 === 2);

    return [
      {
        id: 'row-1',
        speed: '50s',
        direction: 'left',
        items: row1Items.length ? row1Items : items
      },
      {
        id: 'row-2',
        speed: '60s',
        direction: 'right',
        items: row2Items.length ? row2Items : items
      },
      {
        id: 'row-3',
        speed: '45s',
        direction: 'left',
        items: row3Items.length ? row3Items : items
      }
    ];
  });

  protected setCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  protected openFaqModal(item: FaqItem): void {
    this.selectedFaq.set(item);
  }

  protected closeFaqModal(): void {
    this.selectedFaq.set(null);
  }

  protected isArabic(): boolean {
    return this.translate.currentLang === 'ar';
  }
}

