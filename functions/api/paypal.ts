/**
 * POST /api/paypal — create a PayPal order from the cart and return the approval
 * URL (the cart redirects the buyer there). Re-prices every line server-side from
 * CATALOG. 503 'not_configured' until PAYPAL_CLIENT_ID/SECRET are set, so the cart
 * degrades to the WhatsApp fallback.
 */
import { Env, CATALOG, apiBase, paypalToken, json } from './_paypal';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body: any = await request.json();
    const items: { sku: string; quantity: number }[] = Array.isArray(body?.items) ? body.items : [];
    const locale = typeof body?.locale === 'string' ? body.locale : 'en';
    if (!items.length) return json({ error: 'empty_cart' }, 400);
    if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) return json({ error: 'not_configured' }, 503);

    let total = 0;
    const pp: any[] = [];
    for (const it of items) {
      const c = CATALOG[it?.sku];
      if (!c) continue; // unknown SKU — ignore
      const q = Math.max(1, Math.min(31, Number(it.quantity) || 1));
      total += c.cents * q;
      pp.push({ name: c.name.slice(0, 127), quantity: String(q), unit_amount: { currency_code: 'EUR', value: (c.cents / 100).toFixed(2) } });
    }
    if (!pp.length) return json({ error: 'no_valid_items' }, 400);
    const value = (total / 100).toFixed(2);

    const at = await paypalToken(env);
    if (!at) return json({ error: 'paypal_auth' }, 502);

    const origin = env.SITE_URL ?? new URL(request.url).origin;
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const res = await fetch(`${apiBase(env)}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value, breakdown: { item_total: { currency_code: 'EUR', value } } },
          items: pp,
        }],
        application_context: {
          brand_name: 'Ikigai Sailing',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${origin}/api/paypal-capture?locale=${encodeURIComponent(locale)}`,
          cancel_url: `${origin}${prefix}/trips/`,
        },
      }),
    });
    const d: any = await res.json();
    if (!res.ok) return json({ error: d?.message ?? 'paypal_error' }, 502);
    const approve = (d.links || []).find((l: any) => l.rel === 'approve')?.href;
    if (!approve) return json({ error: 'no_approval_url' }, 502);
    return json({ url: approve });
  } catch (e: any) {
    return json({ error: e?.message ?? 'bad_request' }, 400);
  }
};
