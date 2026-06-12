/**
 * POST /api/concierge — "Ask Ikigai" AI concierge (Google Gemini).
 * Streams a Gemini Flash model over SSE, answering strictly from the bundled
 * knowledge corpus. Rate-limits per IP, caps daily spend, requires Turnstile on
 * the first message, logs hand-offs for the monthly SEO loop.
 *
 * Client protocol (text/event-stream): `data: {"type":"delta","text":"…"}`,
 * then `data: {"type":"done"}`, or `data: {"type":"error","message":"…"}`.
 */
import { SYSTEM_PROMPT, KNOWLEDGE } from './_knowledge';

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string; // default below; validated live when the key is added
  TURNSTILE_SECRET?: string;
  CONCIERGE_KV?: KVNamespace;
  CONCIERGE_DAILY_BUDGET_USD?: string; // default "2"
}

const DEFAULT_MODEL = 'gemini-flash-latest';
const MAX_TURNS = 10;
const MAX_USER_CHARS = 500;
const RATE_LIMIT_PER_HOUR = 20;
// Gemini Flash-Lite pricing ($/MTok), used only for the daily safety cap.
const PRICE = { input: 0.1, output: 0.4 };

const enc = new TextEncoder();
const sse = (obj: unknown) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GEMINI_API_KEY) return fail('Concierge is not configured yet.', 503);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return fail('Bad request', 400);
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const locale = typeof body?.locale === 'string' ? body.locale : 'en';
  const turnstileToken = body?.turnstileToken;

  // shape + limits
  const userTurns = messages.filter((m: any) => m.role === 'user');
  if (userTurns.length === 0) return fail('No message', 400);
  if (messages.length > MAX_TURNS * 2) return fail('Conversation too long — please start a new chat.', 400);
  const last = messages[messages.length - 1];
  if (last?.role !== 'user' || typeof last.content !== 'string') return fail('Bad message', 400);
  if (last.content.length > MAX_USER_CHARS) return fail('Message too long (max 500 characters).', 400);

  // Turnstile on the first message of a conversation
  if (userTurns.length === 1 && env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, turnstileToken, request);
    if (!ok) return fail('Verification failed — please retry.', 403);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  const kv = env.CONCIERGE_KV;
  const day = new Date().toISOString().slice(0, 10);

  // rate limit (per IP per hour)
  if (kv) {
    const hour = new Date().toISOString().slice(0, 13);
    const rlKey = `rl:${ip}:${hour}`;
    const n = Number((await kv.get(rlKey)) ?? '0') + 1;
    if (n > RATE_LIMIT_PER_HOUR) return fail("You've reached the hourly limit — message us on WhatsApp instead: https://wa.me/393313292629", 429);
    await kv.put(rlKey, String(n), { expirationTtl: 3700 });

    // daily budget cap (first line of defense)
    const capUsd = Number(env.CONCIERGE_DAILY_BUDGET_USD ?? '2');
    const spentMicro = Number((await kv.get(`budget:${day}`)) ?? '0');
    if (spentMicro >= capUsd * 1_000_000) {
      return fail('Our assistant is resting for today — please message the crew on WhatsApp: https://wa.me/393313292629', 429);
    }
  }

  // Gemini request. System prompt + knowledge go in system_instruction.
  // Roles: user → "user", assistant → "model".
  const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const geminiReq = {
    system_instruction: {
      parts: [{ text: `${SYSTEM_PROMPT}\n\n=== KNOWLEDGE ===\n${KNOWLEDGE}` }],
    },
    contents: messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content).slice(0, 2000) }],
    })),
    // thinkingBudget:0 disables the model's default thinking — the concierge
    // gives short direct answers, so thinking is wasted latency + tokens.
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.4,
      topP: 0.9,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify(geminiReq),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    console.log('concierge gemini error', upstream.status, errText.slice(0, 300));
    const friendly =
      upstream.status === 429
        ? 'Our assistant is busy right now — please message the crew on WhatsApp: https://wa.me/393313292629'
        : 'Sorry, our assistant had a hiccup. Please message the crew on WhatsApp: https://wa.me/393313292629';
    return fail(friendly, 502);
  }

  // Transform Gemini SSE → our simplified SSE; tap usage + detect hand-off.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullText = '';
      let usage: any = {};

      const pump = async () => {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          // Gemini terminates SSE events with CRLF-CRLF; handle both.
          const events = buf.split(/\r\n\r\n|\n\n/);
          buf = events.pop() ?? '';
          for (const ev of events) {
            const dataLine = ev.split(/\r?\n/).find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            let payload: any;
            try {
              payload = JSON.parse(dataLine.slice(5).trim());
            } catch {
              continue;
            }
            const parts = payload?.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              for (const p of parts) {
                if (typeof p.text === 'string' && p.text) {
                  fullText += p.text;
                  controller.enqueue(sse({ type: 'delta', text: p.text }));
                }
              }
            }
            if (payload?.usageMetadata) usage = payload.usageMetadata;
          }
        }
      };

      try {
        await pump();
        controller.enqueue(sse({ type: 'done' }));
      } catch {
        controller.enqueue(sse({ type: 'error', message: 'stream interrupted' }));
      } finally {
        controller.close();
      }

      // --- post-stream bookkeeping (best-effort) ---
      if (kv) {
        const micro = costMicroUsd(usage);
        if (micro > 0) {
          const key = `budget:${day}`;
          const cur = Number((await kv.get(key)) ?? '0');
          await kv.put(key, String(cur + micro), { expirationTtl: 90_000 });
        }
        if (/wa\.me\/393313292629/.test(fullText)) {
          const q = String(last.content).slice(0, 400);
          const id = crypto.randomUUID().slice(0, 8);
          await kv.put(`esc:${day}:${id}`, JSON.stringify({ q, locale, at: new Date().toISOString() }), {
            expirationTtl: 7_776_000, // 90 days
          });
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
};

function costMicroUsd(u: any): number {
  if (!u) return 0;
  const inTok = u.promptTokenCount ?? 0;
  const outTok = u.candidatesTokenCount ?? 0;
  return Math.round(inTok * PRICE.input + outTok * PRICE.output); // $/MTok × tokens = micro-USD
}

async function verifyTurnstile(secret: string, token: unknown, request: Request): Promise<boolean> {
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: request.headers.get('CF-Connecting-IP') }),
  });
  const v: any = await res.json().catch(() => ({}));
  return !!v.success;
}

function fail(message: string, status: number): Response {
  return new Response(`data: ${JSON.stringify({ type: 'error', message })}\n\n`, {
    status,
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' },
  });
}
