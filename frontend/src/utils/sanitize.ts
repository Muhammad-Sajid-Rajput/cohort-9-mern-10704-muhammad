const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'data']);
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const stripControlAndWhitespace = (str: string): string => {
  let result = '';
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code > 32 && (code < 127 || code > 159)) {
      result += str[i];
    }
  }
  return result;
};

const isSafeUrl = (url: string): boolean => {
  const normalized = stripControlAndWhitespace(url);
  if (
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return true;
  }
  try {
    const parsed = new URL(normalized, 'https://clean.local');
    return ALLOWED_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
};

export const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined' || !html) return html || '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'style', 'base', 'meta', 'link'];
  dangerousTags.forEach((tag) => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
};
