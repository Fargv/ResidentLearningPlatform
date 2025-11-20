export const stripHtmlText = (html?: string | null): string =>
  html ? html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

const createDomParser = () => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return null;
  }
  return new DOMParser();
};

const sanitizeNodeTree = (doc: Document) => {
  const forbiddenTags = ['script', 'style', 'iframe', 'object', 'embed'];
  forbiddenTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((node) => node.parentNode?.removeChild(node));
  });

  doc.body.querySelectorAll('*').forEach((element) => {
    // 🔧 FIX — reemplazado [...element.attributes] por Array.from()
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();

      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }

      if (name === 'style') {
        element.removeAttribute(attr.name);
      }
    });

    if (element.tagName.toLowerCase() === 'a') {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });
};


export const normalizeRichText = (html?: string | null): string => {
  if (!html) {
    return '';
  }

  const parser = createDomParser();
  if (!parser) {
    return html;
  }

  const doc = parser.parseFromString(html, 'text/html');
  sanitizeNodeTree(doc);
  return doc.body.innerHTML;
};

export const richTextOrUndefined = (html?: string | null): string | undefined => {
  const normalized = normalizeRichText(html);
  return stripHtmlText(normalized) ? normalized : undefined;
};
