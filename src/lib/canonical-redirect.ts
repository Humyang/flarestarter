/** Redirect the www host to the canonical origin while preserving path/query. */
export function redirectToCanonicalHost(request: Request, canonicalBaseUrl: string): Response | null {
  const requested = new URL(request.url)
  const canonical = new URL(canonicalBaseUrl)
  const isWwwHost = requested.hostname === `www.${canonical.hostname}`
  const needsCanonicalHttps = canonical.protocol === 'https:' && requested.protocol !== canonical.protocol
  if (!isWwwHost && !needsCanonicalHttps) return null

  requested.protocol = canonical.protocol
  if (isWwwHost) requested.hostname = canonical.hostname
  if (canonical.port) requested.port = canonical.port
  return Response.redirect(requested.toString(), 308)
}
