import { describe, test, expect } from 'vitest'
import { wechatChargeMinor, usdCentsFallback, formatMinor } from './currency'
import { sponsorConfig } from './sponsor.config'

const { currency, usdRate } = sponsorConfig.wechat

describe('wechatChargeMinor', () => {
  test('默认配置（hkd @ 7.8）：USD 分 → HKD 分', () => {
    expect(currency).toBe('hkd')
    expect(usdRate).toBe(7.8)
    expect(wechatChargeMinor(1500)).toBe(11700)  // $15  → HK$117.00
    expect(wechatChargeMinor(7500)).toBe(58500)  // $75  → HK$585.00
    expect(wechatChargeMinor(30000)).toBe(234000) // $300 → HK$2340.00
  })

  test('取整到最小单位，不产生小数分', () => {
    expect(wechatChargeMinor(1)).toBe(8)
    expect(Number.isInteger(wechatChargeMinor(333))).toBe(true)
  })

  test('0 换算为 0', () => {
    expect(wechatChargeMinor(0)).toBe(0)
  })
})

describe('usdCentsFallback', () => {
  test('USD 原样返回', () => {
    expect(usdCentsFallback(2500, 'usd')).toBe(2500)
    expect(usdCentsFallback(2500, 'USD')).toBe(2500)
  })

  test('配置的微信币种按当前汇率反算，是 wechatChargeMinor 的逆', () => {
    for (const usd of [1500, 7500, 30000]) {
      expect(usdCentsFallback(wechatChargeMinor(usd), currency)).toBe(usd)
    }
  })

  test('既非 USD 又非配置币种 → 原样返回，不瞎猜', () => {
    // A wrong guess would silently corrupt wall tiers; a low tier is admin-fixable
    expect(usdCentsFallback(5000, 'eur')).toBe(5000)
  })
})

describe('formatMinor', () => {
  test('按币种加符号与小数位', () => {
    expect(formatMinor(58500, 'hkd')).toBe('HK$585.00')
    expect(formatMinor(2500, 'usd')).toBe('$25.00')
    expect(formatMinor(54000, 'cny')).toBe('¥540.00')
  })

  test('零小数币种（jpy）不除 100', () => {
    expect(formatMinor(11000, 'jpy')).toBe('¥11000')
  })

  test('未知币种回落到大写代码前缀', () => {
    expect(formatMinor(1000, 'pln')).toBe('PLN 10.00')
  })
})
