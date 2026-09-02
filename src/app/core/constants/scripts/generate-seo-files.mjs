import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE_URL = 'https://tamaraland.runasp.net';
const SITE_URL = 'https://www.tamaraland.shop';

const PAGE_SIZE = 100;
const MAX_URLS_PER_SITEMAP = 50_000;

const DIST_DIR = path.resolve(
  process.cwd(),
  'dist',
  'tmaraland-frontend',
  'browser'
);

const STATIC_ROUTES = [
  {
    path: '/',
  },
  {
    path: '/products',
  },
  {
    path: '/new-in',
  },
  {
    path: '/sale',
  },
  {
    path: '/under-800',
  },
  {
    path: '/categories',
  },
  {
    path: '/brands',
  },
  {
    path: '/contact',
  },
  {
    path: '/shipping',
  },
  {
    path: '/faq',
  },
  {
    path: '/privacy',
  },
  {
    path: '/terms',
  },
];

const DISALLOWED_ROUTES = [
  '/admin/',
  '/checkout/',
  '/orders/',
  '/wishlist/',
  '/cart/',
  '/addresses/',
];

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} - ${url}`
    );
  }

  return response.json();
}

async function fetchAllPages(endpoint) {
  const items = [];

  let pageNumber = 1;
  let totalPages = 1;

  do {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    url.searchParams.set('pageNumber', String(pageNumber));
    url.searchParams.set('pageSize', String(PAGE_SIZE));

    console.log(`Fetching ${endpoint} - page ${pageNumber}/${totalPages}`);

    const response = await fetchJson(url);

    if (!response?.success || !response?.data) {
      throw new Error(
        `Invalid API response from ${url}: ${JSON.stringify(response)}`
      );
    }

    const page = response.data;

    if (Array.isArray(page.items)) {
      items.push(...page.items);
    }

    totalPages = Number(page.totalPages) || 1;

    pageNumber++;
  } while (pageNumber <= totalPages);

  return items;
}

function normalizeUrl(value) {
  if (!value) {
    return null;
  }

  return value.startsWith('/')
    ? `${SITE_URL}${value}`
    : `${SITE_URL}/${value}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function createUrlEntry(url) {
  return [
    '  <url>',
    `    <loc>${escapeXml(url)}</loc>`,
    '  </url>',
  ].join('\n');
}

function createSitemapXml(urls) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(createUrlEntry),
    '</urlset>',
    '',
  ].join('\n');
}

function createSitemapIndexXml(sitemapFiles) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapFiles.map(
      (file) =>
        [
          '  <sitemap>',
          `    <loc>${escapeXml(`${SITE_URL}/${file}`)}</loc>`,
          '  </sitemap>',
        ].join('\n')
    ),
    '</sitemapindex>',
    '',
  ].join('\n');
}

function createRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin/',
    'Disallow: /checkout/',
    'Disallow: /orders/',
    'Disallow: /wishlist/',
    'Disallow: /cart/',
    'Disallow: /addresses/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

async function generate() {
  console.log('');
  console.log('========================================');
  console.log(' Tamara Land SEO Files Generator');
  console.log('========================================');
  console.log('');

  /*
   * Make sure Angular build output exists.
   */
  await fs.mkdir(DIST_DIR, { recursive: true });

  /*
   * Fetch all public catalog entities.
   */
  const [products, categories, brands] = await Promise.all([
    fetchAllPages('/api/Product'),
    fetchAllPages('/api/Categories'),
    fetchAllPages('/api/Brand'),
  ]);

  console.log('');
  console.log(`Products:   ${products.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Brands:     ${brands.length}`);
  console.log('');

  /*
   * Build the list of indexable URLs.
   *
   * IMPORTANT:
   *
   * We intentionally do NOT add:
   *
   * ?page=
   * ?search=
   * ?categoryId=
   * ?brandId=
   * ?minPrice=
   * ?maxPrice=
   * ?sortBy=
   * ?inStockOnly=
   *
   * Those URLs are handled by noindex in ProductListPage.
   */

  const urls = [];

  /*
   * Static public pages.
   */
  for (const route of STATIC_ROUTES) {
    urls.push(`${SITE_URL}${route.path}`);
  }

  /*
   * Products.
   */
  for (const product of products) {
    if (!product?.id) {
      continue;
    }

    urls.push(
      `${SITE_URL}/products/${encodeURIComponent(product.id)}`
    );
  }

  /*
   * Categories.
   */
  for (const category of categories) {
    if (!category?.id) {
      continue;
    }

    urls.push(
      `${SITE_URL}/categories/${encodeURIComponent(category.id)}`
    );
  }

  /*
   * Brands.
   */
  for (const brand of brands) {
    if (!brand?.id) {
      continue;
    }

    urls.push(
      `${SITE_URL}/brands/${encodeURIComponent(brand.id)}`
    );
  }

  /*
   * Remove accidental duplicates.
   */
  const uniqueUrls = [...new Set(urls)];

  console.log(`Total sitemap URLs: ${uniqueUrls.length}`);

  /*
   * Remove old generated sitemap files.
   */
  const existingFiles = await fs.readdir(DIST_DIR);

  for (const file of existingFiles) {
    if (
      file === 'sitemap.xml' ||
      /^sitemap-\d+\.xml$/.test(file)
    ) {
      await fs.rm(
        path.join(DIST_DIR, file),
        { force: true }
      );
    }
  }

  /*
   * Google allows up to 50,000 URLs per sitemap.
   *
   * For the current store this will normally produce
   * a single sitemap.xml.
   *
   * If the store grows beyond 50,000 URLs, this script
   * automatically creates:
   *
   * sitemap-1.xml
   * sitemap-2.xml
   * ...
   *
   * and sitemap.xml becomes a sitemap index.
   */

  if (uniqueUrls.length <= MAX_URLS_PER_SITEMAP) {
    const sitemapXml =
      createSitemapXml(uniqueUrls);

    await fs.writeFile(
      path.join(DIST_DIR, 'sitemap.xml'),
      sitemapXml,
      'utf8'
    );

    console.log(
      `Created: ${path.join(DIST_DIR, 'sitemap.xml')}`
    );
  } else {
    const sitemapFiles = [];

    for (
      let start = 0;
      start < uniqueUrls.length;
      start += MAX_URLS_PER_SITEMAP
    ) {
      const chunk =
        uniqueUrls.slice(
          start,
          start + MAX_URLS_PER_SITEMAP
        );

      const sitemapNumber =
        sitemapFiles.length + 1;

      const fileName =
        `sitemap-${sitemapNumber}.xml`;

      await fs.writeFile(
        path.join(DIST_DIR, fileName),
        createSitemapXml(chunk),
        'utf8'
      );

      sitemapFiles.push(fileName);

      console.log(
        `Created: ${fileName} (${chunk.length} URLs)`
      );
    }

    await fs.writeFile(
      path.join(DIST_DIR, 'sitemap.xml'),
      createSitemapIndexXml(sitemapFiles),
      'utf8'
    );

    console.log(
      `Created sitemap index with ${sitemapFiles.length} files`
    );
  }

  /*
   * robots.txt
   */
  await fs.writeFile(
    path.join(DIST_DIR, 'robots.txt'),
    createRobotsTxt(),
    'utf8'
  );

  console.log(
    `Created: ${path.join(DIST_DIR, 'robots.txt')}`
  );

  console.log('');
  console.log('SEO files generated successfully.');
  console.log('');
}

generate().catch((error) => {
  console.error('');
  console.error('SEO generation failed.');
  console.error('');
  console.error(error);
  console.error('');

  process.exit(1);
});