export type FrontendStatus = 'available' | 'low' | 'critical' | 'expired'

// Single source of truth for deriving the frontend-facing status from a raw
// inventory document. Used by the list route, the by-id route, and the
// status filter so they always agree.
export function computeFrontendStatus(item: any): FrontendStatus {
  const isExpired = new Date(item.expirationDate) < new Date()
  if (isExpired) return 'expired'

  const dbStatus = item.status?.toLowerCase() || 'sufficient'
  if (dbStatus === 'out of stock' || item.units === 0) return 'critical'
  if (dbStatus === 'critical') return 'critical'
  if (dbStatus === 'low') return 'low'
  return 'available'
}