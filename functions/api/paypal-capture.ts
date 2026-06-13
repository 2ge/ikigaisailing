/**
 * GET /api/paypal-capture — PayPal redirects the buyer here after approval
 * (?token=ORDER_ID&PayerID=…). Capture the order, email the crew + a guest
 * confirmation, subscribe to Listmonk, then redirect to /booking/thanks/.
 * Any failure redirects back to /trips/.
 */
import { Env, apiBase, paypalToken, sendEmail, subscribeListmonk } from './_paypal';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const u = new URL(request.url);
  const orderId = u.searchParams.get('token');
  const locale = u.searchParams.get('locale') || 'en';
  const origin = env.SITE_URL ?? u.origin;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const back = (p: string) => Response.redirect(`${origin}${prefix}${p}`, 302);

  if (!orderId || !env.PAYPAL_CLIENT_ID) return back('/trips/');
  try {
    const at = await paypalToken(env);
    if (!at) return back('/trips/');
    const res = await fetch(`${apiBase(env)}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    });
    const d: any = await res.json();
    if (res.ok && d.status === 'COMPLETED') {
      const payer = d.payer;
      const email = payer?.email_address;
      const name = `${payer?.name?.given_name ?? ''} ${payer?.name?.surname ?? ''}`.trim();
      const pu = d.purchase_units?.[0];
      const items = (pu?.items || []).map((i: any) => (Number(i.quantity) > 1 ? `${i.name} x${i.quantity}` : i.name)).join(', ');
      const amount = pu?.payments?.captures?.[0]?.amount?.value;
      await Promise.allSettled([
        sendEmail(env, env.CREW_EMAIL, `New booking: ${items}`, `${name} (${email}) booked: ${items}. Amount: EUR ${amount}.`),
        email && sendEmail(env, email, 'Your Ikigai Sailing booking', `Ciao ${name},\n\nThank you for booking aboard Ikigai:\n  ${items}\n\nWe'll be in touch shortly with the next steps.\n\nFair winds,\nThe Ikigai crew`),
        email && subscribeListmonk(env, email, name),
      ]);
      return back('/booking/thanks/');
    }
    return back('/trips/');
  } catch {
    return back('/trips/');
  }
};
