import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { getOptionalUser } from '@/features/auth/middleware'
import { useTranslation } from '@/features/i18n/provider'
import { LegalPage } from '@/components/marketing/legal-page'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/privacy')({
  // Review draft: keep it out of search until the owner and counsel approve it.
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async () => ({ loggedIn: !!(await getOptionalUser()) }),
  component: Privacy,
})

function Privacy() {
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  const { t } = useTranslation()
  return <LegalPage theme={theme} loggedIn={loggedIn} title={t('legal.privacyTitle')} kind="privacy" />
}
