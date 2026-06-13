/**
 * Basic-Auth gate for everything under /admin/*. Credentials live ONLY in Pages
 * env vars (ADMIN_USER / ADMIN_PASS) — never in the repo, since this is a public
 * GitHub repo. Without them set, /admin returns 503 (fail closed). Auth happens
 * before the static admin page is served (we call next() on success).
 *
 * Note: this runs only in the Cloudflare Pages runtime — the local `astro dev`
 * server (dev-ikigai) does NOT execute Functions, so /admin is unprotected there.
 */
interface Env {
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  if (!env.ADMIN_USER || !env.ADMIN_PASS) {
    return new Response('Admin area not configured.', { status: 503 });
  }
  const expected = 'Basic ' + btoa(`${env.ADMIN_USER}:${env.ADMIN_PASS}`);
  const got = request.headers.get('Authorization') || '';

  // constant-ish time compare
  let ok = got.length === expected.length;
  for (let i = 0; i < expected.length; i++) ok = ok && got[i] === expected[i];

  if (!ok) {
    return new Response('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Ikigai Admin", charset="UTF-8"',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }
  const res = await next();
  // never let the authed admin page be cached/indexed anywhere
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'no-store');
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
};
