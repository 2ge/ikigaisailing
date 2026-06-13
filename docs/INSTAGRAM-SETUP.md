# Instagram feed — setup (the owner does this once)

The home page shows your latest Instagram posts + reels. They're fetched **at
build time** and rendered as fast static images (no Instagram script, no
cookies). A rebuild every 6 hours (and every deploy) pulls fresh posts.

Until the token below is set, the section shows a clean "Follow us on
Instagram" band — nothing breaks.

**This is Phase A (public feed).** Reading/replying to DMs (the `/admin` inbox)
is Phase B/C and needs Meta App Review — separate effort, started later.

---

## What you need (all confirmed ✓ except verification)

- `@ikigaisailing_asd` is an Instagram **Business** account ✓
- It's linked to a **Facebook Page** you admin ✓
- The Page is owned by the **Meta Business Portfolio** for the ASD

## Step 1 — create a Meta app

1. Go to **https://developers.facebook.com/apps** → **Create app**.
2. Use case: choose **"Other"** → type **"Business"**.
3. Name it `Ikigai Sailing Site`, contact = your email, attach the **ASD
   business portfolio**. Create.

## Step 2 — add the Instagram product

1. In the app dashboard → **Add product** → **Instagram** → *Set up*
   (the "Instagram API with Instagram Login" / Graph API box).
2. Under **API setup with Instagram business login**, you'll see your
   connected IG account(s). Note the **Instagram-scoped user id** shown —
   that's `IG_USER_ID`.

## Step 3 — generate a long-lived token

1. Still in the Instagram setup panel, click **Generate access token** for
   `@ikigaisailing_asd`. Approve the popup (permissions: `instagram_basic`,
   `instagram_manage_insights` — read only).
2. Copy the token. By default it's short-lived (1 hour) — exchange it for a
   **long-lived** (60-day) one. Easiest: in the same panel there's often a
   "long-lived token" button; otherwise run once:

   ```
   curl -s "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=APP_SECRET&access_token=SHORT_TOKEN"
   ```

   (App secret is under **App settings → Basic**.) Copy the returned token =
   `IG_ACCESS_TOKEN`.

> Tokens last ~60 days. The 6-hourly rebuild can auto-refresh it later (a small
> step we add in Phase B); for now, if the feed ever goes quiet, regenerate the
> token and update the secret. I'll remind you.

## Step 4 — give the values to the site

Add **both** as repository secrets so CI builds and the scheduled rebuild can
fetch:

1. **https://github.com/2ge/ikigaisailing** → **Settings → Secrets and
   variables → Actions → New repository secret**.
2. Add:
   - `IG_ACCESS_TOKEN` = the long-lived token
   - `IG_USER_ID` = the Instagram business account id from Step 2
3. (Optional, for local testing) put the same two lines in `.env` /
   `.dev.vars` — never commit them.

That's it. The next build (push, or the 6-hourly cron) renders your latest 9
posts/reels on the home page. To pull more/fewer, set `IG_FEED_COUNT`.

---

## How it works (for reference)

- `scripts/fetch-instagram.ts` (prebuild) → calls the Graph API → writes
  `src/data/instagram.json`.
- `src/components/InstagramFeed.astro` renders that JSON as optimized
  `astro:assets` cards (AVIF/WebP), linking each to its Instagram permalink.
- No token / API hiccup → the script keeps the last cache and **never fails the
  build**.

## Later — the `/admin` message inbox (Phase B/C)

Reading IG DMs + Facebook Messenger inside `/admin` needs extra permissions
(`instagram_manage_messages`, `pages_messaging`) which require **Meta App
Review + Business Verification**, plus webhooks and a small backend on
Cloudflare Pages Functions. We start that approval clock separately — the docs
for it will live alongside this file when we build it.
