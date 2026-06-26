/**
 * Prepend Next.js basePath to API routes for correct routing behind reverse proxies.
 *
 * Next.js basePath handles page navigation automatically, but does NOT
 * intercept raw fetch() calls — those still use bare "/api/..." which
 * misses the basePath prefix when behind a reverse proxy (e.g. nginx).
 *
 * Usage: fetch(apiUrl("/api/rubricas"), { ... })
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path}`;
}