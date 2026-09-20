import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "metadata.google.internal"]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (also covers cloud metadata endpoints)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.split(":").pop()!;
    if (net.isIPv4(v4)) return isPrivateIPv4(v4);
  }
  return false;
}

function isPrivateAddress(address: string): boolean {
  return net.isIPv4(address) ? isPrivateIPv4(address) : isPrivateIPv6(address);
}

export class BlockedUrlError extends Error {}

/**
 * Best-effort SSRF guard for endpoints that fetch a user-supplied URL
 * server-side (link metadata, link-health checks). Resolves DNS so a
 * hostname can't simply be pointed at an internal/cloud-metadata address.
 *
 * This is not resilient to DNS-rebinding (the same hostname could resolve
 * differently a moment after this check) — that would need to pin the
 * resolved IP for the actual fetch too, which fetch() doesn't expose
 * directly. Treat this as a meaningful reduction of the obvious, low-effort
 * SSRF cases, appropriate for a single-operator personal app, not a
 * complete guarantee.
 */
export async function assertPubliclyRoutable(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedUrlError("Only http(s) URLs are allowed.");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new BlockedUrlError("This host is not allowed.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new BlockedUrlError("This host is not allowed.");
    }
    return;
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    // Unresolvable — let the caller's own fetch fail naturally with its usual handling.
    return;
  }

  if (addresses.some(isPrivateAddress)) {
    throw new BlockedUrlError("This host resolves to a private address and is not allowed.");
  }
}
