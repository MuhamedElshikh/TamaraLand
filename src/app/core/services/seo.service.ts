import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;

  description?: string;

  canonicalUrl?: string;

  image?: string;

  type?: 'website' | 'product' | 'article';

  robots?: string;

  siteName?: string;

  locale?: string;

  keywords?: string;

  jsonLd?:
    | Record<string, unknown>
    | Record<string, unknown>[];
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  private readonly title =
    inject(Title);

  private readonly meta =
    inject(Meta);

  private readonly document =
    inject(DOCUMENT);

  private readonly siteUrl =
    'https://www.tamaraland.shop';


  // =========================================================
  // SET SEO
  // =========================================================

  setSeo(data: SeoData): void {

    // -------------------------------------------------------
    // Basic SEO
    // -------------------------------------------------------

    this.title.setTitle(
      data.title
    );

    this.updateMeta(
      'description',
      data.description
    );

    this.updateMeta(
      'robots',
      data.robots ?? 'index, follow'
    );

    if (data.keywords) {

      this.updateMeta(
        'keywords',
        data.keywords
      );

    } else {

      this.removeMeta(
        'keywords'
      );

    }


    // -------------------------------------------------------
    // Canonical
    // -------------------------------------------------------

    if (data.canonicalUrl) {

      this.setCanonical(
        data.canonicalUrl
      );

    }


    // -------------------------------------------------------
    // Open Graph
    // -------------------------------------------------------

    this.updateProperty(
      'og:title',
      data.title
    );

    this.updateProperty(
      'og:description',
      data.description
    );

    this.updateProperty(
      'og:type',
      data.type ?? 'website'
    );

    this.updateProperty(
      'og:url',
      data.canonicalUrl
        ? this.absoluteUrl(
            data.canonicalUrl
          )
        : this.siteUrl
    );

    this.updateProperty(
      'og:site_name',
      data.siteName ?? 'Tamara Land'
    );


    if (data.locale) {

      this.updateProperty(
        'og:locale',
        data.locale
      );

    } else {

      this.removeProperty(
        'og:locale'
      );

    }


    if (data.image) {

      this.updateProperty(
        'og:image',
        this.absoluteUrl(
          data.image
        )
      );

    } else {

      this.removeProperty(
        'og:image'
      );

    }


    // -------------------------------------------------------
    // Twitter
    // -------------------------------------------------------

    this.updateMeta(
      'twitter:card',
      data.image
        ? 'summary_large_image'
        : 'summary'
    );

    this.updateMeta(
      'twitter:title',
      data.title
    );

    this.updateMeta(
      'twitter:description',
      data.description
    );


    if (data.image) {

      this.updateMeta(
        'twitter:image',
        this.absoluteUrl(
          data.image
        )
      );

    } else {

      this.removeMeta(
        'twitter:image'
      );

    }


    // -------------------------------------------------------
    // JSON-LD
    // -------------------------------------------------------

    if (data.jsonLd) {

      this.setJsonLd(
        data.jsonLd
      );

    } else {

      this.removeJsonLd();

    }

  }


  // =========================================================
  // META
  // =========================================================

  private updateMeta(
    name: string,
    content?: string
  ): void {

    if (!content) {

      this.removeMeta(name);

      return;

    }

    this.meta.updateTag({
      name,
      content
    });

  }


  private removeMeta(
    name: string
  ): void {

    this.meta.removeTag(
      `name="${name}"`
    );

  }


  // =========================================================
  // META PROPERTY
  // =========================================================

  private updateProperty(
    property: string,
    content?: string
  ): void {

    if (!content) {

      this.removeProperty(
        property
      );

      return;

    }

    this.meta.updateTag({
      property,
      content
    });

  }


  private removeProperty(
    property: string
  ): void {

    this.meta.removeTag(
      `property="${property}"`
    );

  }


  // =========================================================
  // CANONICAL
  // =========================================================

  private setCanonical(
    url: string
  ): void {

    const absoluteUrl =
      this.absoluteUrl(url);

    let link =
      this.document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]'
      );

    if (!link) {

      link =
        this.document.createElement(
          'link'
        );

      link.setAttribute(
        'rel',
        'canonical'
      );

      this.document.head.appendChild(
        link
      );

    }

    link.setAttribute(
      'href',
      absoluteUrl
    );

  }


  // =========================================================
  // JSON-LD
  // =========================================================

  private setJsonLd(
    jsonLd:
      | Record<string, unknown>
      | Record<string, unknown>[]
  ): void {

    this.removeJsonLd();

    const script =
      this.document.createElement(
        'script'
      );

    script.type =
      'application/ld+json';

    script.setAttribute(
      'data-seo-jsonld',
      ''
    );

    script.textContent =
      JSON.stringify(jsonLd);

    this.document.head.appendChild(
      script
    );

  }


  private removeJsonLd(): void {

    this.document
      .head
      .querySelector(
        'script[data-seo-jsonld]'
      )
      ?.remove();

  }


  // =========================================================
  // URL
  // =========================================================

  private absoluteUrl(
    url: string
  ): string {

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {

      return url;

    }

    return `${this.siteUrl}${
      url.startsWith('/')
        ? ''
        : '/'
    }${url}`;

  }

}