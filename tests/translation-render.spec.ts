import { test, expect } from '@playwright/test';
import { translationToHtml } from '../src/lib/format';

/**
 * Locks the testimonial "show translation" rendering. The original bug: stored
 * translations use markdown hard breaks (`  \n`, a single newline) which the old
 * `.replace(/\n\n/g,'<br><br>')` ignored — so the translated text collapsed into
 * one run-on block while the English original (rendered via markdown) kept its
 * line breaks. translationToHtml must mirror markdown's break behaviour.
 */

test.describe('translationToHtml', () => {
  test('a single hard break (incl. trailing-space markdown break) becomes <br>', () => {
    expect(translationToHtml('Line one.  \nLine two.')).toBe('<p>Line one.<br>Line two.</p>');
    expect(translationToHtml('Line one.\nLine two.')).toBe('<p>Line one.<br>Line two.</p>');
  });

  test('a blank line becomes a paragraph break', () => {
    expect(translationToHtml('Para one.\n\nPara two.')).toBe('<p>Para one.</p><p>Para two.</p>');
  });

  test('never produces a run-on: every newline yields a break tag', () => {
    const html = translationToHtml('a\nb  \nc\n\nd');
    expect(html).not.toMatch(/[^>\n]\n[^<]/); // no lone newline left rendering as a space
    expect((html.match(/<br>/g) || []).length).toBe(2);
    expect((html.match(/<\/p><p>/g) || []).length).toBe(1);
  });

  test('escapes HTML so review text cannot inject markup', () => {
    expect(translationToHtml('5 < 10 & "great" <b>x</b>')).toBe('<p>5 &lt; 10 &amp; "great" &lt;b&gt;x&lt;/b&gt;</p>');
  });

  test('preserves emoji and trims surrounding whitespace', () => {
    expect(translationToHtml('  Gracias 💙  ')).toBe('<p>Gracias 💙</p>');
  });
});
