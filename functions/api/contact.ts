/**
 * POST /api/contact — contact form handler.
 * Honeypot + Turnstile verification, then email the crew via Resend.
 * Accepts multipart/form-data (the form posts FormData).
 */
interface Env {
  RESEND_API_KEY?: string;
  CREW_EMAIL?: string;
  TURNSTILE_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  // honeypot
  if (form.get('company')) return new Response('ok', { status: 200 });

  // Turnstile
  const token = form.get('cf-turnstile-response');
  if (env.TURNSTILE_SECRET && token) {
    const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token }),
    }).then((r) => r.json<any>());
    if (!v.success) return json({ error: 'Verification failed' }, 400);
  }

  const name = String(form.get('name') ?? '').slice(0, 200);
  const email = String(form.get('email') ?? '').slice(0, 200);
  const message = String(form.get('message') ?? '').slice(0, 5000);
  const trip = String(form.get('trip') ?? '');
  if (!name || !email || !message) return json({ error: 'Missing fields' }, 400);

  if (env.RESEND_API_KEY && env.CREW_EMAIL) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Ikigai Website <crew@ikigaisailing.com>',
        to: env.CREW_EMAIL,
        reply_to: email,
        subject: `Contact${trip ? ` · ${trip}` : ''} — ${name}`,
        text: `From: ${name} <${email}>\nTrip: ${trip || '—'}\n\n${message}`,
      }),
    });
  }
  return json({ ok: true });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
