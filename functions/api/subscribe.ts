/**
 * POST /api/subscribe — newsletter signup (double opt-in via Listmonk).
 * Body: form-data { email, consent }. Subscriber created with status=unconfirmed
 * so Listmonk sends the confirmation email.
 */
interface Env {
  LISTMONK_URL?: string;
  LISTMONK_API_KEY?: string;
  LISTMONK_NEWSLETTER_LIST_ID?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const consent = form.get('consent');
  if (!email || !consent) return json({ error: 'Email and consent required' }, 400);
  if (!env.LISTMONK_URL || !env.LISTMONK_API_KEY || !env.LISTMONK_NEWSLETTER_LIST_ID) {
    return json({ error: 'Newsletter not configured' }, 503);
  }
  const res = await fetch(`${env.LISTMONK_URL}/api/subscribers`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(env.LISTMONK_API_KEY)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: email.split('@')[0],
      lists: [Number(env.LISTMONK_NEWSLETTER_LIST_ID)],
      status: 'enabled',
      preconfirm_subscriptions: false, // triggers double opt-in email
    }),
  });
  if (!res.ok && res.status !== 409) {
    return json({ error: 'Subscription failed' }, 502);
  }
  return json({ ok: true });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
