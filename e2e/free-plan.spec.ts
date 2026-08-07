import { expect, test, type BrowserContext } from '@playwright/test'
import { execFileSync } from 'node:child_process'

function queryLocalD1(sql: string): Array<Record<string, unknown>> {
  const output = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'flarestarter-db', '--local', '--command', sql, '--json'],
    { cwd: process.cwd(), encoding: 'utf8' },
  )
  const result = JSON.parse(output) as Array<{ results: Array<Record<string, unknown>> }>
  return result[0]?.results ?? []
}

async function registerFreeUser(context: BrowserContext, baseURL: string, email: string) {
  const origin = baseURL.replace(/\/$/, '')
  const response = await context.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { origin },
    data: { email, password: 'password12345', name: 'Free User' },
  })

  expect(response.ok(), 'free user registration should succeed').toBeTruthy()
}

test('new user stays free without creating billing state', async ({ page, context, baseURL }) => {
  const email = `free-${Date.now()}@example.com`
  await registerFreeUser(context, baseURL ?? 'http://localhost:3000', email)

  await page.goto('/app')
  await expect(page.getByText(`Logged in as ${email}`)).toBeVisible()
  await expect(page.getByText('Free', { exact: true }).last()).toBeVisible()

  await page.goto('/app/account')
  await expect(page.getByRole('heading', { name: 'Current plan' })).toBeVisible()
  await expect(page.getByText('Free', { exact: true }).last()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Upgrade' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Manage subscription' })).toHaveCount(0)

  await page.goto('/app/pro')
  await expect(page.getByText("You're previewing the Pro area. Upgrade to unlock it.")).toBeVisible()
  await expect(
    page.locator('[aria-hidden="true"]').filter({ hasText: 'This is Pro-only content' }),
  ).toHaveCount(1)
  await page.getByRole('link', { name: 'Upgrade' }).click()
  await expect(page).toHaveURL(/\/pricing$/)

  const rows = queryLocalD1(
    `SELECT COUNT(*) AS count FROM subscription WHERE user_id = ` +
      `(SELECT id FROM user WHERE email = '${email}')`,
  )
  expect(rows).toEqual([{ count: 0 }])
})
