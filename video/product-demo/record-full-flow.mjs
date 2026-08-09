#!/usr/bin/env node

import { chromium } from 'playwright'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoDir = resolve(scriptDir, '../..')
const rawDir = join(scriptDir, 'raw')
const baseURL = process.env.DEMO_BASE_URL || 'http://localhost:3000'
const sourcePath = process.env.DEMO_SOURCE_MP4
  || resolve(repoDir, '../smart-clip/storage/source/20260806/1786021844459-dmfx5lmj.mp4')
const projectTitle = `Smart Clip workflow ${Date.now()}`
const email = `smart-clip-demo-${Date.now()}@example.com`
const password = 'demo-password-12345'
const viewport = { width: 1600, height: 900 }

async function addCursor(page) {
  await page.addStyleTag({
    content: `
      .demo-cursor {
        position: fixed;
        z-index: 2147483647;
        width: 22px;
        height: 22px;
        border: 3px solid rgba(255, 90, 31, .96);
        border-radius: 50%;
        background: rgba(255, 255, 255, .5);
        box-shadow: 0 0 0 5px rgba(255, 90, 31, .18);
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: transform 120ms ease;
      }
      .demo-cursor.is-clicking { transform: translate(-50%, -50%) scale(.72); }
    `,
  })
  await page.evaluate(() => {
    const cursor = document.createElement('div')
    cursor.className = 'demo-cursor'
    cursor.style.left = '50%'
    cursor.style.top = '50%'
    document.body.append(cursor)
    document.addEventListener('mousemove', (event) => {
      cursor.style.left = `${event.clientX}px`
      cursor.style.top = `${event.clientY}px`
    })
    document.addEventListener('mousedown', () => cursor.classList.add('is-clicking'))
    document.addEventListener('mouseup', () => cursor.classList.remove('is-clicking'))
  })
}

async function pointTo(page, locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) throw new Error('Could not resolve an element position for recording')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 22 })
  await page.waitForTimeout(350)
}

async function clickVisible(page, locator) {
  await pointTo(page, locator)
  await locator.click()
  await page.waitForTimeout(600)
}

async function saveRecording(context, page, destination) {
  const video = page.video()
  const temporaryPath = await video?.path()
  await context.close()
  if (!video) throw new Error('Playwright did not create a recording')
  await video.saveAs(destination)
  if (temporaryPath && temporaryPath !== destination) {
    await rm(temporaryPath, { force: true }).catch(() => undefined)
  }
}

async function register(context) {
  const origin = baseURL.replace(/\/$/, '')
  const response = await context.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { origin },
    data: { email, password, name: 'Demo Creator' },
  })
  if (!response.ok()) throw new Error(`Demo registration failed (${response.status()})`)
}

async function recordSubmission(browser, statePath, sourceBuffer) {
  const context = await browser.newContext({
    viewport,
    colorScheme: 'light',
    locale: 'en-US',
    recordVideo: { dir: rawDir, size: viewport },
  })
  await register(context)
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1800)
    await addCursor(page)

    await clickVisible(page, page.locator('section').getByRole('link', { name: 'Open render workspace' }).first())
    await page.getByRole('heading', { name: 'Create a video' }).waitFor()
    await page.waitForTimeout(1200)

    const titleInput = page.getByLabel('Project title')
    await pointTo(page, titleInput)
    await titleInput.click()
    await titleInput.pressSequentially(projectTitle, { delay: 45 })
    await page.waitForTimeout(500)

    const dropzone = page.locator('label.file-dropzone')
    await pointTo(page, dropzone)
    await page.getByLabel('Source video').setInputFiles({
      name: 'smart-clip-demo-source.mp4',
      mimeType: 'video/mp4',
      buffer: sourceBuffer,
    })
    await page.waitForTimeout(900)

    const browse = page.getByRole('button', { name: /Browse all \d+/ })
    await clickVisible(page, browse)
    const search = page.getByPlaceholder('Search animations')
    await pointTo(page, search)
    await search.fill('Deposit timeline')
    await page.waitForTimeout(900)
    await clickVisible(page, page.getByRole('radio', { name: 'Deposit timeline' }))

    const submit = page.getByRole('button', { name: 'Submit render' })
    await clickVisible(page, submit)
    await page.getByText('Render task submitted.').waitFor({ timeout: 60_000 })
    await page.getByText(projectTitle, { exact: true }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(4500)
    await context.storageState({ path: statePath })
    await saveRecording(context, page, join(rawDir, 'full-flow-submit.webm'))
  } catch (error) {
    await context.close().catch(() => undefined)
    throw error
  }
}

async function waitForCompletion(browser, statePath) {
  const context = await browser.newContext({ storageState: statePath, viewport })
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/app/render`, { waitUntil: 'domcontentloaded' })
    const deadline = Date.now() + 15 * 60_000
    while (Date.now() < deadline) {
      const completed = page.getByText('Completed', { exact: true })
      if (await completed.isVisible().catch(() => false)) return
      const failed = page.getByText('Failed', { exact: true })
      if (await failed.isVisible().catch(() => false)) {
        throw new Error('Smart Clip reported a failed render task')
      }
      await page.waitForTimeout(3000)
    }
    throw new Error('Timed out waiting for Smart Clip to complete')
  } finally {
    await context.close()
  }
}

async function recordDownload(browser, statePath) {
  const context = await browser.newContext({
    storageState: statePath,
    viewport,
    colorScheme: 'light',
    locale: 'en-US',
    acceptDownloads: true,
    recordVideo: { dir: rawDir, size: viewport },
  })
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/app/render`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Completed', { exact: true }).waitFor()
    await page.waitForTimeout(1600)
    await addCursor(page)

    const title = page.getByText(projectTitle, { exact: true })
    await title.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1200)
    const downloadLink = page.getByRole('link', { name: 'Download' }).first()
    await pointTo(page, downloadLink)
    const downloadPromise = page.waitForEvent('download')
    await downloadLink.click()
    const download = await downloadPromise
    if (!download.suggestedFilename().endsWith('.mp4')) {
      throw new Error(`Unexpected download filename: ${download.suggestedFilename()}`)
    }
    await page.evaluate(() => {
      const notice = document.createElement('div')
      notice.textContent = 'Download verified'
      notice.style.cssText = [
        'position:fixed', 'right:32px', 'bottom:32px', 'z-index:2147483646',
        'padding:14px 18px', 'border-radius:7px', 'background:#111827',
        'color:#fff', 'font:600 15px system-ui', 'box-shadow:0 12px 32px rgba(0,0,0,.24)',
      ].join(';')
      document.body.append(notice)
    })
    await page.waitForTimeout(2600)
    await saveRecording(context, page, join(rawDir, 'full-flow-download.webm'))
  } catch (error) {
    await context.close().catch(() => undefined)
    throw error
  }
}

async function main() {
  await mkdir(rawDir, { recursive: true })
  const sourceBuffer = await readFile(sourcePath)
  const tempDir = await mkdtemp(join(tmpdir(), 'flarestarter-demo-'))
  const statePath = join(tempDir, 'auth-state.json')
  const browser = await chromium.launch({ headless: true, slowMo: 45 })
  try {
    console.log(`[record] registering synthetic demo user ${email}`)
    await recordSubmission(browser, statePath, sourceBuffer)
    console.log('[record] submission captured; waiting for the real render task')
    await waitForCompletion(browser, statePath)
    console.log('[record] render completed; capturing verified download')
    await recordDownload(browser, statePath)
    console.log(`[record] raw browser footage saved in ${rawDir}`)
  } finally {
    await browser.close()
    await rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
