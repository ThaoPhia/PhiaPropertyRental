import { escapeHtml } from '@/lib/escape-html';

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<a href="?q=one&two">It\'s safe</a>')).toBe(
      '&lt;a href=&quot;?q=one&amp;two&quot;&gt;It&#39;s safe&lt;/a&gt;',
    );
  });
});