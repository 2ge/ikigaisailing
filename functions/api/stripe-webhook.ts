/**
 * POST /api/stripe-webhook — verify signature, then on checkout.session.completed:
 *  - email the crew + a confirmation to the guest (Resend)
 *  - subscribe the guest to the Listmonk "guests" list
 * Uses Web Crypto for Stripe signature verification (Workers-compatible).
 */
interface Env {
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY?: string;
  CREW_EMAIL?: string;
  LISTMONK_URL?: string;
  LISTMONK_API_KEY?: string;
  LISTMONK_GUESTS_LIST_ID?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sig = request.headers.get('stripe-signature') ?? '';
  const payload = await request.text();
  const ok = await verifyStripe(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(payload);
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const email = s.customer_details?.email;
    const name = s.customer_details?.name ?? '';
    // cart summary (multi-item) with single-trip fallback for legacy sessions
    const items = s.metadata?.items ?? s.metadata?.tripSlug ?? 'your booking';

    await Promise.allSettled([
      sendEmail(env, env.CREW_EMAIL, `New booking: ${items}`, `${name} (${email}) booked: ${items}. Amount: ${(s.amount_total ?? 0) / 100} ${s.currency?.toUpperCase()}.`),
      email && sendEmail(env, email, 'Your Ikigai Sailing booking', `Ciao ${name},\n\nThank you for booking aboard Ikigai:\n  ${items}\n\nWe'll be in touch shortly with the next steps.\n\nFair winds,\nThe Ikigai crew`),
      email && subscribeListmonk(env, email, name),
    ]);
  }
  return new Response('ok', { status: 200 });
};

async function verifyStripe(payload: string, header: string, secret: string): Promise<boolean> {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // constant-time-ish compare
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

async function sendEmail(env: Env, to: string | undefined, subject: string, text: string) {
  if (!env.RESEND_API_KEY || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Ikigai Sailing <crew@ikigaisailing.com>', to, subject, text }),
  });
}

async function subscribeListmonk(env: Env, email: string, name: string) {
  if (!env.LISTMONK_URL || !env.LISTMONK_API_KEY || !env.LISTMONK_GUESTS_LIST_ID) return;
  await fetch(`${env.LISTMONK_URL}/api/subscribers`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(env.LISTMONK_API_KEY)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, lists: [Number(env.LISTMONK_GUESTS_LIST_ID)], status: 'enabled', preconfirm_subscriptions: true }),
  });
}
