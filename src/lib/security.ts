/**
 * Security & Anti-Vulnerability Helper Library (Arc-AA Standard)
 */

/**
 * CWE-601: Open Redirect Defense
 * Validates redirect targets against a strict internal relative path regex.
 * Rejects external URLs, protocol-relative URLs (//evil.com), javascript: URI schemes, and backslashes.
 */
export function sanitizeRedirectUrl(url: string | null | undefined, fallback = "/"): string {
  if (!url) return fallback;

  // Strict relative path regex: starts with single slash, followed by valid path chars, never starting with //
  const relativePathRegex = /^\/(?!\/)[a-zA-Z0-9_\-\.\/]*$/;

  if (relativePathRegex.test(url)) {
    return url;
  }

  return fallback;
}

/**
 * CWE-1236: CSV Formula Injection Defense
 * Neutralizes potentially executable cells (=, +, -, @, \t, \r) by prefixing a single quote (').
 */
export function sanitizeCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  let str = String(cell);

  // If the cell begins with dangerous formula trigger characters, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates an uppercase unique order number formatted according to Arc-AA standard:
 * e.g., "ORD-2026-92F1"
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `ORD-${year}-${randomHex}`;
}
