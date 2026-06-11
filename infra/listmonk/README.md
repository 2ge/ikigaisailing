# Listmonk — Ikigai Sailing mailing

Self-hosted Listmonk + Postgres for newsletters and transactional mail.

## Deploy (on aidev)

```bash
cd infra/listmonk
echo "LISTMONK_DB_PASSWORD=$(openssl rand -hex 16)" > .env   # gitignored
docker compose up -d
# first run creates the schema via --upgrade; create the admin user when prompted in the UI
```

Admin UI/API: `http://127.0.0.1:9000` (port 9000 claimed in `~/projects/PORTS.md`).
Expose via haproxy using `haproxy-stanza.cfg` → `news.ikigaisailing.com`.

## Lists to create (Listmonk UI → Lists)

| List | Type | Opt-in | Source |
|---|---|---|---|
| `newsletter` | public | **double** | footer / blog signup → `/api/subscribe` |
| `guests` | private | single | Stripe webhook on `checkout.session.completed` |
| `crew-leads` | private | single | "Work With Us" / crew-exchange form |

After creating, copy each list's numeric ID into the Pages env vars:
`LISTMONK_NEWSLETTER_LIST_ID`, `LISTMONK_GUESTS_LIST_ID`.

## API credentials

Listmonk UI → Settings → API users → create a user; the Pages Functions auth with
`Authorization: Basic base64(api_user:token)`. Put `api_user:token` in `LISTMONK_API_KEY`
and the base URL in `LISTMONK_URL` (e.g. `https://news.ikigaisailing.com`).

## SMTP

Settings → SMTP: point at the transactional provider (Resend SMTP or the box's maildev for
testing — maildev SMTP is `:1025`, web UI `:8025`). Production: use a real sender domain with
SPF/DKIM for `ikigaisailing.com`.

## Branded campaign template

`campaign-template.html` in this folder is a starter (ocean palette, logo, footer with
unsubscribe). Import it under Campaigns → Templates and set as default.
