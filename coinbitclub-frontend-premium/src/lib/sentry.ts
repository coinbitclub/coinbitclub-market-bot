import * as Sentry from '@sentry/browser'

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })
}
