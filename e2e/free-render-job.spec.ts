import { expect, test, type BrowserContext } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

async function register(context: BrowserContext, baseURL: string, email: string) {
  const origin = baseURL.replace(/\/$/, '')
  const response = await context.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { origin },
    data: { email, password: 'password12345', name: 'Free Render User' },
  })
  expect(response.ok()).toBeTruthy()
}

function localSubscriptionCount(email: string): number {
  const output = execFileSync('npx', [
    'wrangler', 'd1', 'execute', 'flarestarter-db', '--local', '--command',
    `SELECT COUNT(*) AS count FROM subscription WHERE user_id = (SELECT id FROM user WHERE email = '${email}')`,
    '--json',
  ], { cwd: process.cwd(), encoding: 'utf8' })
  return JSON.parse(output)[0].results[0].count as number
}

test('free user uploads, renders and downloads an mp4', async ({ page, context, baseURL }) => {
  test.setTimeout(900_000)
  const email = `free-render-${Date.now()}@example.com`
  await register(context, baseURL ?? 'http://localhost:3000', email)

  await page.goto('/app/render')
  await expect(page.getByRole('heading', { name: 'Create a video' })).toBeVisible()
  await page.waitForTimeout(1000)
  await page.getByLabel('Project title').fill('Free local render')
  await page.getByLabel('Source video').setInputFiles(
    path.resolve(process.cwd(), '../smart-clip/storage/source/20260806/1786021844459-dmfx5lmj.mp4'),
  )
  await page.getByRole('button', { name: 'Submit render' }).click()
  await expect(page.getByText('Render task submitted.')).toBeVisible({ timeout: 60_000 })

  await expect(page.getByText('Free local render')).toBeVisible()
  await expect(page.getByText('Completed')).toBeVisible({ timeout: 840_000 })
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download' }).first().click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.mp4$/)
  expect(localSubscriptionCount(email)).toBe(0)
})
