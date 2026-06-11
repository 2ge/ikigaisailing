/**
 * POST /api/checkout — create a Stripe Checkout Session for a trip.
 * Body: { tripSlug, quantity, locale, deposit? }
 * Price IDs are looked up server-side from TRIP_PRICES (never trusted from the client).
 * Members-only trips return 403 (they use the request-access flow instead).
 */
interface Env {
  STRIPE_SECRET_KEY: string;
  SITE_URL?: string;
}

// slug → { priceId, depositPriceId?, membersOnly }
// Mirror of trip frontmatter stripePriceId; filled once products exist (see README Phase 4).
const TRIP_PRICES: Record<string, { price?: string; deposit?: string; membersOnly?: boolean }> = {
  'ikigai-experience': { price: '' },
  '10-days-on-board': { price: '' },
  'one-month': { price: '', membersOnly: true },
  'pacific-crossing': { price: '', membersOnly: true },
  'crew-exchange': { membersOnly: true },
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { tripSlug, quantity = 1, locale = 'en', deposit = false } = await request.json<any>();
    const trip = TRIP_PRICES[tripSlug];
    if (!trip) return json({ error: 'Unknown trip' }, 400);
    if (trip.membersOnly) return json({ error: 'Members only — use request access' }, 403);

    const priceId = deposit ? trip.deposit : trip.price;
    if (!priceId) return json({ error: 'Price not configured yet' }, 503);

    const origin = env.SITE_URL ?? new URL(request.url).origin;
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', String(Math.max(1, Math.min(12, Number(quantity)))));
    params.set('customer_creation', 'always');
    params.set('billing_address_collection', 'required');
    params.set('success_url', `${origin}${prefix}/booking/thanks/?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${origin}${prefix}/trips/${tripSlug}/`);
    params.set('metadata[tripSlug]', tripSlug);
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
    if (!res.ok) return json({ error: session.error?.message ?? 'Stripe error' }, 502);
    return json({ url: session.url });
  } catch (e: any) {
    return json({ error: e.message ?? 'Bad request' }, 400);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
