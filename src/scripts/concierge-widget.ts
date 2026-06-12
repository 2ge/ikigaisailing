/**
 * Concierge chat panel — loaded lazily on first FAB click (see Concierge.astro).
 * Builds the panel DOM, streams /api/concierge over SSE, renders deltas.
 * Keeps initial page JS at ~0 KB until the user engages.
 */
interface Strings {
  title: string;
  subtitle: string;
  placeholder: string;
  open: string;
  send: string;
  whatsapp: string;
}

type Msg = { role: 'user' | 'assistant'; content: string };

export function initConcierge(root: HTMLElement) {
  const locale = root.dataset.locale ?? 'en';
  const siteKey = root.dataset.turnstile ?? '';
  const chips: string[] = JSON.parse(root.dataset.chips ?? '[]');
  const s: Strings = JSON.parse(root.dataset.strings ?? '{}');

  const history: Msg[] = [];
  let turnstileToken: string | null = null;
  let busy = false;

  const panel = document.createElement('div');
  panel.className =
    'fixed bottom-5 right-5 z-50 flex h-[32rem] max-h-[80vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-sand-50 shadow-2xl shadow-ocean-950/30 ring-1 ring-ocean-950/10';
  panel.hidden = true;
  panel.innerHTML = `
    <header class="flex items-center justify-between gap-2 bg-ocean-800 px-4 py-3 text-sand-50">
      <div>
        <p class="font-display text-lg leading-tight">${esc(s.title)}</p>
        <p class="text-xs text-ocean-200">${esc(s.subtitle)}</p>
      </div>
      <button data-close aria-label="Close" class="rounded-full p-1.5 hover:bg-ocean-700">
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/></svg>
      </button>
    </header>
    <div data-log class="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"></div>
    <div data-chips class="flex flex-wrap gap-1.5 px-4 pb-2"></div>
    <form data-form class="flex items-center gap-2 border-t border-ocean-950/10 p-3">
      <input data-input maxlength="500" autocomplete="off" placeholder="${esc(s.placeholder)}"
        class="min-w-0 flex-1 rounded-full border border-ocean-950/10 bg-white px-3.5 py-2 text-sm focus:border-ocean-400 focus:outline-none" />
      <button type="submit" aria-label="${esc(s.send)}" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ocean-700 text-sand-50 hover:bg-ocean-600">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10l16-7-7 16-2.5-6.5L2 10z"/></svg>
      </button>
    </form>
    <div data-turnstile-holder class="hidden"></div>`;
  root.appendChild(panel);

  const log = panel.querySelector('[data-log]') as HTMLElement;
  const chipsEl = panel.querySelector('[data-chips]') as HTMLElement;
  const form = panel.querySelector('[data-form]') as HTMLFormElement;
  const input = panel.querySelector('[data-input]') as HTMLInputElement;

  // greeting
  addBubble('assistant', s.subtitle);
  // chips
  for (const c of chips) {
    const b = document.createElement('button');
    b.className = 'rounded-full border border-ocean-300 px-3 py-1 text-xs text-ocean-700 hover:bg-ocean-100';
    b.textContent = c;
    b.addEventListener('click', () => {
      input.value = c;
      form.requestSubmit();
    });
    chipsEl.appendChild(b);
  }

  panel.querySelector('[data-close]')?.addEventListener('click', () => (panel.hidden = true));
  window.addEventListener('concierge:toggle', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      input.focus();
      ensureTurnstile();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    chipsEl.style.display = 'none';
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    await stream();
  });

  async function stream() {
    busy = true;
    const bubble = addBubble('assistant', '');
    bubble.classList.add('opacity-60');
    let acc = '';
    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, locale, turnstileToken }),
      });
      if (!res.body) throw new Error('no stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const p of parts) {
          const line = p.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const evt = JSON.parse(line.slice(5).trim());
          if (evt.type === 'delta') {
            acc += evt.text;
            bubble.innerHTML = render(acc);
            log.scrollTop = log.scrollHeight;
          } else if (evt.type === 'error') {
            acc = acc || evt.message;
            bubble.innerHTML = render(acc);
          }
        }
      }
    } catch {
      bubble.innerHTML = render('Sorry — please message us on WhatsApp: https://wa.me/393313292629');
    } finally {
      bubble.classList.remove('opacity-60');
      if (acc) history.push({ role: 'assistant', content: acc });
      busy = false;
      turnstileToken = null; // one-shot; re-fetched next turn if needed
      log.scrollTop = log.scrollHeight;
    }
  }

  function addBubble(role: 'user' | 'assistant', text: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
    const b = document.createElement('div');
    b.className =
      role === 'user'
        ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-ocean-700 px-3.5 py-2 text-sand-50'
        : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-ocean-100 px-3.5 py-2 text-ink';
    b.innerHTML = render(text);
    wrap.appendChild(b);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  // minimal, safe markdown: escape, then linkify [text](url) and bare urls, **bold**
  function render(t: string): string {
    let h = esc(t);
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="font-semibold text-ocean-700 underline">$1</a>');
    h = h.replace(/(^|[^"=])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener" class="font-semibold text-ocean-700 underline">$2</a>');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return h.replace(/\n/g, '<br>');
  }

  // Turnstile: render invisibly on first open to get a token for message 1
  function ensureTurnstile() {
    if (!siteKey || turnstileToken) return;
    const holder = panel.querySelector('[data-turnstile-holder]') as HTMLElement;
    const go = () => {
      // @ts-expect-error global injected by the Turnstile script
      window.turnstile?.render(holder, {
        sitekey: siteKey,
        appearance: 'interaction-only', // only shows a challenge if one is needed
        callback: (tok: string) => (turnstileToken = tok),
      });
    };
    // @ts-expect-error
    if (window.turnstile) return go();
    if (document.getElementById('cf-turnstile-js')) return;
    const sc = document.createElement('script');
    sc.id = 'cf-turnstile-js';
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    sc.async = true;
    sc.defer = true;
    sc.onload = go;
    document.head.appendChild(sc);
  }
}

function esc(t: string): string {
  return t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
