/**
 * Shared PayPal helpers + the server-side price catalog (the cart's prices are
 * never trusted — every order is re-priced from here). Underscore prefix = not a
 * route. ⚠️ Course/package amounts are PLACEHOLDERS pending the owner's confirmed
 * rates; the transfer (€150) is confirmed. Keep in sync with src/data/addons.ts.
 */
export interface Env {
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_SECRET?: string;
  PAYPAL_ENV?: string; // 'live' | 'sandbox' (default sandbox)
  SITE_URL?: string;
  RESEND_API_KEY?: string;
  CREW_EMAIL?: string;
  LISTMONK_URL?: string;
  LISTMONK_API_KEY?: string;
  LISTMONK_GUESTS_LIST_ID?: string;
}

export const CATALOG: Record<string, { cents: number; name: string }> = {
  'ikigai-experience': { cents: 30000, name: 'Ikigai Experience' },
  '10-days-on-board': { cents: 300000, name: '10 Days on Board' },
  'addon:transfer': { cents: 15000, name: 'Transfer Panama City - boat (return)' },
  'addon:freediving': { cents: 9000, name: 'Freediving discovery course' },
  'addon:aida1': { cents: 29000, name: 'AIDA 1 freediving certification' },
  'addon:aida2': { cents: 39000, name: 'AIDA 2 freediving certification' },
};

export const apiBase = (env: Env) =>
  env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export async function paypalToken(env: Env): Promise<string | null> {
  const r = await fetch(`${apiBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) return null;
  const d: any = await r.json();
  return d.access_token ?? null;
}

export async function sendEmail(env: Env, to: string | undefined, subject: string, text: string) {
  if (!env.RESEND_API_KEY || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Ikigai Sailing <crew@ikigaisailing.com>', to, subject, text }),
  });
}

export async function subscribeListmonk(env: Env, email: string, name: string) {
  if (!env.LISTMONK_URL || !env.LISTMONK_API_KEY || !env.LISTMONK_GUESTS_LIST_ID) return;
  await fetch(`${env.LISTMONK_URL}/api/subscribers`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(env.LISTMONK_API_KEY)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, lists: [Number(env.LISTMONK_GUESTS_LIST_ID)], status: 'enabled', preconfirm_subscriptions: true }),
  });
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
