import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: 'Smart Clip 指南' },
    links: [{ text: '首页', url: '/' }],
  }
}
