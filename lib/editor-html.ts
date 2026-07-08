import { escapeHtml } from '@/lib/escape-html';

export function toEditorHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const containsHtmlTag = /<([a-z][a-z0-9]*)\b[^>]*>/i.test(trimmed);
  if (containsHtmlTag) {
    return value;
  }

  return escapeHtml(value).replace(/\n/g, '<br>');
}
