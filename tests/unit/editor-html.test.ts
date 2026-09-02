import { toEditorHtml } from '@/lib/editor-html';

describe('toEditorHtml', () => {
  it('escapes plain text and converts line breaks for the rich-text editor', () => {
    expect(toEditorHtml('Rent is < $2,000\nCall "Alex" & confirm')).toBe(
      'Rent is &lt; $2,000<br>Call &quot;Alex&quot; &amp; confirm',
    );
  });

  it('preserves existing HTML without double escaping it', () => {
    const html = '<p>Move-in ready <strong>today</strong>.</p>';

    expect(toEditorHtml(html)).toBe(html);
  });

  it('returns an empty string for blank content', () => {
    expect(toEditorHtml('  \n  ')).toBe('');
  });
});