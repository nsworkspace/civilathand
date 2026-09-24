/**
 * Minimal, dependency-free HTML sanitizer.
 *
 * Blog content is stored as raw HTML (written from the admin Blogs panel)
 * and rendered client-side with dangerouslySetInnerHTML. That is a stored
 * XSS risk: any <script>, inline event handler (onerror=, onclick=...), or
 * javascript: URL saved into a post would execute in every visitor's
 * browser. Run all HTML through sanitizeHtml() before rendering it.
 *
 * This is intentionally conservative and dependency-free (no network
 * access is available to install a package like DOMPurify). It strips the
 * dangerous constructs while keeping normal formatting tags (p, h1-h6, ul,
 * ol, li, img, a, blockquote, pre, code, strong, em, span, div, etc.)
 * intact — it does not attempt to be a full HTML parser.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let out = html;

  // Remove <script>...</script> and <style>...</style> blocks entirely.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove dangerous embed/frame tags.
  out = out.replace(/<(iframe|object|embed|link|meta|base)\b[^>]*>/gi, "");
  out = out.replace(/<\/(iframe|object|embed)>/gi, "");

  // Strip any on*="..." / on*='...' inline event handler attributes.
  out = out.replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, "");
  out = out.replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, "");
  out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");

  // Neutralise javascript: / data:text/html URLs in href/src attributes.
  out = out.replace(
    /\s(href|src)\s*=\s*"(?:\s*javascript:[^"]*)"/gi,
    ' $1="#"'
  );
  out = out.replace(
    /\s(href|src)\s*=\s*'(?:\s*javascript:[^']*)'/gi,
    " $1='#'"
  );
  out = out.replace(/\s(href|src)\s*=\s*"(?:\s*data:text\/html[^"]*)"/gi, ' $1="#"');

  return out;
}
