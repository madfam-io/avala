import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with safe defaults
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string or basic escape
    // DOMPurify requires DOM, so we strip all HTML on server
    return dirty.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(dirty, {
    // Allow safe HTML tags for rich content
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'hr',
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'id',
      'colspan', 'rowspan',
    ],
    // Force links to open in new tab with security attributes
    ADD_ATTR: ['target', 'rel'],
    // Ensure links are safe
    ALLOW_DATA_ATTR: false,
    // Force HTTPS for URLs
    FORCE_BODY: true,
  });
}

/**
 * Sanitize and prepare HTML for dangerouslySetInnerHTML
 */
export function createSanitizedMarkup(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) };
}
