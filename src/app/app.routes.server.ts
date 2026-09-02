import { RenderMode, ServerRoute } from '@angular/ssr';

const PRODUCT_ALL_IDS_URL = 'https://tamaraland.runasp.net/api/Product/all-ids';
const CATEGORY_ALL_IDS_URL = 'https://tamaraland.runasp.net/api/Category/all-ids';
const BRAND_ALL_IDS_URL = 'https://tamaraland.runasp.net/api/Brand/all-ids';

async function fetchIds(url: string): Promise<number[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[prerender] Failed to fetch ${url}: ${res.status}`);
      return [];
    }

    const json = await res.json();

    // الباك اند بيلف النتيجة جوه { success, data } - نفكها هنا
    const raw = Array.isArray(json) ? json : json?.data;

    if (!Array.isArray(raw)) {
      console.error(`[prerender] Unexpected response shape from ${url}:`, json);
      return [];
    }

    return raw;
  } catch (err) {
    console.error(`[prerender] Error fetching ${url}:`, err);
    return [];
  }
}

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },

  { path: 'products', renderMode: RenderMode.Prerender },
  {
    path: 'products/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = await fetchIds(PRODUCT_ALL_IDS_URL);
      return ids.map((id) => ({ id: String(id) }));
    },
  },

  { path: 'new-in', renderMode: RenderMode.Prerender },
  { path: 'sale', renderMode: RenderMode.Prerender },
  { path: 'under-800', renderMode: RenderMode.Prerender },

  { path: 'categories', renderMode: RenderMode.Prerender },
  {
    path: 'categories/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = await fetchIds(CATEGORY_ALL_IDS_URL);
      return ids.map((id) => ({ id: String(id) }));
    },
  },

  { path: 'brands', renderMode: RenderMode.Prerender },
  {
    path: 'brands/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = await fetchIds(BRAND_ALL_IDS_URL);
      return ids.map((id) => ({ id: String(id) }));
    },
  },

  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'shipping', renderMode: RenderMode.Prerender },
  { path: 'faq', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },

  { path: 'login', renderMode: RenderMode.Client },
  { path: 'register', renderMode: RenderMode.Client },
  { path: 'forgot-password', renderMode: RenderMode.Client },
  { path: 'reset-password', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },

  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'orders', renderMode: RenderMode.Client },
  { path: 'wishlist', renderMode: RenderMode.Client },
  { path: 'addresses', renderMode: RenderMode.Client },

  { path: 'admin/**', renderMode: RenderMode.Client },

  { path: '**', renderMode: RenderMode.Client },
];