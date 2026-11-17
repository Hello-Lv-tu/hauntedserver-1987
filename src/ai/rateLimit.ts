export interface RateLimits {
  perMinute: number
  perDay: number
}

export const DEFAULT_LIMITS: RateLimits = { perMinute: 12, perDay: 200 }

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
/** Forget clients after this many entries to keep memory bounded. */
const MAX_CLIENTS = 5000

/**
 * In-memory, per-instance limiter. Not a hard guarantee across instances,
 * but it stops one browser from hammering the endpoint; the provider's
 * prepaid balance is the hard cap on cost.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>()
  private readonly limits: RateLimits

  constructor(limits: RateLimits = DEFAULT_LIMITS) {
    this.limits = limits
  }

  /** Record a request; returns false if the client is over a limit. */
  allow(client: string, now: number): boolean {
    const recent = (this.hits.get(client) ?? []).filter((t) => now - t < DAY)
    const lastMinute = recent.filter((t) => now - t < MINUTE).length
    if (lastMinute >= this.limits.perMinute || recent.length >= this.limits.perDay) {
      this.hits.set(client, recent)
      return false
    }
    recent.push(now)
    this.hits.delete(client)
    this.hits.set(client, recent)
    if (this.hits.size > MAX_CLIENTS) {
      const oldest = this.hits.keys().next().value
      if (oldest !== undefined) this.hits.delete(oldest)
    }
    return true
  }
}
