import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { getOptionalUser } from '@/features/auth/middleware'
import { useTranslation } from '@/features/i18n/provider'
import { LegalPage } from '@/components/marketing/legal-page'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/terms')({
  // Review draft: keep it out of search until the owner and counsel approve it.
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async () => ({ loggedIn: !!(await getOptionalUser()) }),
  component: Terms,
})

function Terms() {
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  const { t } = useTranslation()
  return <LegalPage theme={theme} loggedIn={loggedIn} title={t('legal.termsTitle')} kind="terms" />
}
