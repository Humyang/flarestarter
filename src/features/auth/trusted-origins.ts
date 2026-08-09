/** Parse the explicit comma-separated Better Auth origin allowlist. */
export function parseTrustedOrigins(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin)
}

function isPrivateNetworkHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return true

  const octets = host.split('.').map(Number)
  if (octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    )
  }

  return /^(?:fc|fd)[0-9a-f]{2}:/.test(host) || host.startsWith('fe80:')
}

/**
 * In local development, trust the exact private-network Origin making the
 * request. Production base URLs stay restricted to the explicit allowlist.
 */
export function resolveTrustedOrigins(value: string | undefined, baseURL: string, request?: Request): string[] {
  const configured = parseTrustedOrigins(value)
  if (!request || !isPrivateNetworkHostname(new URL(baseURL).hostname)) return configured

  const header = request.headers.get('origin')
  if (!header) return configured

  try {
    const origin = new URL(header)
    if (!['http:', 'https:'].includes(origin.protocol) || !isPrivateNetworkHostname(origin.hostname)) {
      return configured
    }
    return configured.includes(origin.origin) ? configured : [...configured, origin.origin]
  } catch {
    return configured
  }
}
