/** Adds a scheme if missing, validates, and strips a harmless bare-path trailing slash. */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.pathname === "/") u.pathname = "";
    return u.toString();
  } catch {
    return null;
  }
}
