/**
 * POST /api/checkout — create a Stripe Checkout Session from a cart.
 * Body: { items: [{ sku, quantity }], locale }
 * Prices are ALWAYS re-derived here from CATALOG (cents, EUR) via inline
 * price_data — the client's prices are never trusted, and unknown SKUs are
 * dropped. No Stripe Products need to pre-exist. Returns 503 'not_configured'
 * until STRIPE_SECRET_KEY is set, so the cart degrades gracefully.
 *
 * ⚠️ Course prices below are PLACEHOLDERS pending the owner's confirmed rates;
 * the transfer (€150) is confirmed. Keep in sync with src/data/addons.ts and
 * trip frontmatter `price`.
 */
interface Env {
  STRIPE_SECRET_KEY?: string;
  SITE_URL?: string;
}

const CATALOG: Record<string, { cents: number; name: string }> = {
  // packages (mirror trip frontmatter `price`, EUR)
  'ikigai-experience': { cents: 30000, name: 'Ikigai Experience' },
  '10-days-on-board': { cents: 300000, name: '10 Days on Board' },
  // add-ons (mirror src/data/addons.ts)
  'addon:transfer': { cents: 15000, name: 'Transfer Panama City ↔ boat (return)' },
  'addon:freediving': { cents: 9000, name: 'Freediving discovery course' },
  'addon:aida1': { cents: 29000, name: 'AIDA 1 freediving certification' },
  'addon:aida2': { cents: 39000, name: 'AIDA 2 freediving certification' },
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<any>();
    const items: { sku: string; quantity: number }[] = Array.isArray(body?.items) ? body.items : [];
    const locale = typeof body?.locale === 'string' ? body.locale : 'en';
    if (!items.length) return json({ error: 'empty_cart' }, 400);
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'not_configured' }, 503);

    const origin = env.SITE_URL ?? new URL(request.url).origin;
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const params = new URLSearchParams();
    params.set('mode', 'payment');

    let li = 0;
    const summary: string[] = [];
    for (const it of items) {
      const cat = CATALOG[it?.sku];
      if (!cat) continue; // unknown SKU — ignore
      const qty = Math.max(1, Math.min(12, Number(it.quantity) || 1));
      params.set(`line_items[${li}][price_data][currency]`, 'eur');
      params.set(`line_items[${li}][price_data][unit_amount]`, String(cat.cents));
      params.set(`line_items[${li}][price_data][product_data][name]`, cat.name);
      params.set(`line_items[${li}][quantity]`, String(qty));
      summary.push(qty > 1 ? `${cat.name} ×${qty}` : cat.name);
      li++;
    }
    if (li === 0) return json({ error: 'no_valid_items' }, 400);
    params.set('metadata[items]', summary.join(', ').slice(0, 480)); // Stripe metadata cap

    params.set('customer_creation', 'always');
    params.set('billing_address_collection', 'required');
    params.set('success_url', `${origin}${prefix}/booking/thanks/?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${origin}${prefix}/trips/`);
    params.set('metadata[locale]', locale);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const session = await res.json<any>();
    if (!res.ok) return json({ error: session.error?.message ?? 'stripe_error' }, 502);
    return json({ url: session.url });
  } catch (e: any) {
    return json({ error: e?.message ?? 'bad_request' }, 400);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
