import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { captureFirstTouchAttribution, setAnalyticsPageContext, trackPageView } from './ga4'

/**
 * Owns SPA analytics at the root of the app. TanStack Router changes location
 * without a document reload, so GA's automatic page_view is disabled and this
 * component emits one event per distinct client URL instead.
 */
export function AnalyticsTracker() {
  const locationHref = useRouterState({ select: (state) => state.location.href })
  const lastTrackedHref = useRef<string | null>(null)

  useEffect(() => {
    captureFirstTouchAttribution(locationHref)
    setAnalyticsPageContext(locationHref)
    if (lastTrackedHref.current === locationHref) return

    // Keep the URL in the dependency key, but only mark it as sent when the
    // wrapper accepted the event. This makes a missing GA script a harmless
    // no-op and permits a later retry if the script is injected asynchronously.
    if (trackPageView(locationHref)) {
      lastTrackedHref.current = locationHref
    }
  }, [locationHref])

  return null
}
