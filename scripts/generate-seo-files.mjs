import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE_URL = 'https://tamaraland.runasp.net';
const SITE_URL = 'https://www.tamaraland.shop';

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  'dist',
  'tmaraland-frontend',
  'browser'
);

const PRODUCTS_IDS_URL =
  `${API_BASE_URL}/api/Product/all-ids`;

const CATEGORIES_IDS_URL =
  `${API_BASE_URL}/api/Categories/all-ids`;

const BRANDS_IDS_URL =
  `${API_BASE_URL}/api/Brand/all-ids`;


const STATIC_ROUTES = [
  '/',
  '/products',
  '/new-in',
  '/sale',
  '/under-800',

  '/categories',
  '/brands',

  '/contact',
  '/shipping',
  '/faq',
  '/privacy',
  '/terms',
];


const DISALLOW_ROUTES = [
  '/admin',
  '/checkout',
  '/orders',
  '/wishlist',
  '/cart',
  '/addresses',
];


const MAX_URLS_PER_SITEMAP = 50000;


/* =========================================================
   HTTP
   ========================================================= */

async function fetchJson(url) {
  console.log(`[seo] Fetching: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `[seo] Request failed: ${response.status} ${response.statusText} - ${url}`
    );
  }

  return response.json();
}


async function fetchIds(url, name) {
  const json = await fetchJson(url);

  if (!json?.success) {
    throw new Error(
      `[seo] ${name} API returned success=false`
    );
  }

  if (!Array.isArray(json.data)) {
    throw new Error(
      `[seo] ${name} API returned invalid data format`
    );
  }

  return json.data
    .map(Number)
    .filter(Number.isInteger)
    .filter((id) => id > 0);
}


/* =========================================================
   URL HELPERS
   ========================================================= */

function normalizeRoute(route) {
  if (!route) {
    return '/';
  }

  const normalized =
    route.startsWith('/')
      ? route
      : `/${route}`;

  if (normalized === '/') {
    return '/';
  }

  return normalized.replace(/\/+$/, '');
}


function toAbsoluteUrl(route) {
  return `${SITE_URL}${normalizeRoute(route)}`;
}


function uniqueSorted(values) {
  return [...new Set(values.map(normalizeRoute))]
    .sort();
}


/* =========================================================
   XML
   ========================================================= */

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


function buildSitemapXml(urls) {
  const body = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}


function buildSitemapIndexXml(sitemapFiles) {
  const body = sitemapFiles
    .map(
      (file) => `  <sitemap>
    <loc>${escapeXml(`${SITE_URL}/${file}`)}</loc>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}


/* =========================================================
   ROBOTS
   ========================================================= */

function buildRobotsTxt() {
  const disallowLines = DISALLOW_ROUTES
    .map((route) => `Disallow: ${route}`)
    .join('\n');

  return `User-agent: *
Allow: /

${disallowLines}

Sitemap: ${SITE_URL}/sitemap.xml
`;
}


/* =========================================================
   MAIN
   ========================================================= */

async function main() {

  console.log('');
  console.log('========================================');
  console.log(' Tamara Land SEO File Generator');
  console.log('========================================');
  console.log('');


  await mkdir(OUTPUT_DIR, {
    recursive: true,
  });


  /* ---------------------------------------------------------
     Fetch IDs
     --------------------------------------------------------- */

  const [
    productIds,
    categoryIds,
    brandIds,
  ] = await Promise.all([

    fetchIds(
      PRODUCTS_IDS_URL,
      'Products'
    ),

    fetchIds(
      CATEGORIES_IDS_URL,
      'Categories'
    ),

    fetchIds(
      BRANDS_IDS_URL,
      'Brands'
    ),

  ]);


  console.log('');

  console.log(
    `[seo] Products: ${productIds.length}`
  );

  console.log(
    `[seo] Categories: ${categoryIds.length}`
  );

  console.log(
    `[seo] Brands: ${brandIds.length}`
  );


  /* ---------------------------------------------------------
     Build routes
     --------------------------------------------------------- */

  const productRoutes =
    productIds.map(
      (id) => `/products/${id}`
    );


  const categoryRoutes =
    categoryIds.map(
      (id) => `/categories/${id}`
    );


  const brandRoutes =
    brandIds.map(
      (id) => `/brands/${id}`
    );


  const allRoutes = uniqueSorted([
    ...STATIC_ROUTES,

    ...productRoutes,
    ...categoryRoutes,
    ...brandRoutes,
  ]);


  console.log('');

  console.log(
    `[seo] Total sitemap URLs: ${allRoutes.length}`
  );


  /* ---------------------------------------------------------
     Sitemap
     --------------------------------------------------------- */

  let sitemapFiles = [];


  // --------------------------------------------------------
  // Case 1:
  // One sitemap is enough.
  // Generate sitemap.xml directly.
  // --------------------------------------------------------

  if (
    allRoutes.length <=
    MAX_URLS_PER_SITEMAP
  ) {

    const sitemapXml =
      buildSitemapXml(
        allRoutes.map(toAbsoluteUrl)
      );


    await writeFile(
      path.join(
        OUTPUT_DIR,
        'sitemap.xml'
      ),
      sitemapXml,
      'utf8'
    );


    sitemapFiles = [
      'sitemap.xml',
    ];


    console.log(
      `[seo] Generated sitemap.xml: ${allRoutes.length} URLs`
    );

  }


  // --------------------------------------------------------
  // Case 2:
  // More than 50,000 URLs.
  // Generate multiple sitemap files + index.
  // --------------------------------------------------------

  else {

    const chunks = [];


    for (
      let index = 0;
      index < allRoutes.length;
      index += MAX_URLS_PER_SITEMAP
    ) {

      chunks.push(
        allRoutes.slice(
          index,
          index + MAX_URLS_PER_SITEMAP
        )
      );

    }


    const childSitemapFiles = [];


    for (
      let index = 0;
      index < chunks.length;
      index++
    ) {

      const filename =
        `sitemap-${index + 1}.xml`;


      const xml =
        buildSitemapXml(
          chunks[index].map(
            toAbsoluteUrl
          )
        );


      await writeFile(
        path.join(
          OUTPUT_DIR,
          filename
        ),
        xml,
        'utf8'
      );


      childSitemapFiles.push(
        filename
      );


      console.log(
        `[seo] Generated ${filename}: ${chunks[index].length} URLs`
      );

    }


    const sitemapIndexXml =
      buildSitemapIndexXml(
        childSitemapFiles
      );


    await writeFile(
      path.join(
        OUTPUT_DIR,
        'sitemap.xml'
      ),
      sitemapIndexXml,
      'utf8'
    );


    sitemapFiles = [
      'sitemap.xml',
      ...childSitemapFiles,
    ];


    console.log(
      `[seo] Generated sitemap.xml index`
    );

  }


  /* ---------------------------------------------------------
     robots.txt
     --------------------------------------------------------- */

  const robotsTxt =
    buildRobotsTxt();


  await writeFile(
    path.join(
      OUTPUT_DIR,
      'robots.txt'
    ),
    robotsTxt,
    'utf8'
  );


  console.log(
    '[seo] Generated robots.txt'
  );


  /* ---------------------------------------------------------
     Validation
     --------------------------------------------------------- */

  const sitemapPath =
    path.join(
      OUTPUT_DIR,
      'sitemap.xml'
    );


  const robotsPath =
    path.join(
      OUTPUT_DIR,
      'robots.txt'
    );


  const sitemapContent =
    await readFile(
      sitemapPath,
      'utf8'
    );


  const robotsContent =
    await readFile(
      robotsPath,
      'utf8'
    );


  if (!sitemapContent.includes(
    '<?xml version="1.0" encoding="UTF-8"?>'
  )) {
    throw new Error(
      '[seo] sitemap.xml validation failed'
    );
  }


  if (!robotsContent.includes(
    `Sitemap: ${SITE_URL}/sitemap.xml`
  )) {
    throw new Error(
      '[seo] robots.txt validation failed'
    );
  }


  /* ---------------------------------------------------------
     Summary
     --------------------------------------------------------- */

  console.log('');

  console.log('========================================');
  console.log(' SEO generation completed successfully');
  console.log('========================================');

  console.log(
    `[seo] Output: ${OUTPUT_DIR}`
  );

  console.log(
    `[seo] Sitemap URLs: ${allRoutes.length}`
  );

  console.log(
    `[seo] Sitemap files: ${sitemapFiles.length}`
  );

  console.log('');

}


main().catch((error) => {

  console.error('');

  console.error(
    '[seo] SEO generation failed:'
  );

  console.error(error);

  process.exit(1);

});