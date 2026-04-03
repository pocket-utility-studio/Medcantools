import { useState, useCallback } from 'react'

export function useSettings() {
  const [lowStockThresholdG, setLowStockThresholdGState] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem('dg_low_stock_threshold') ?? '')
    return isFinite(v) ? v : 3.5
  })

  const [gearCleanIntervalDays, setGearCleanIntervalDaysState] = useState<number>(() => {
    const v = parseInt(localStorage.getItem('dg_gear_clean_interval') ?? '', 10)
    return isFinite(v) && v > 0 ? v : 7
  })

  const setLowStockThresholdG = useCallback((v: number) => {
    localStorage.setItem('dg_low_stock_threshold', String(v))
    setLowStockThresholdGState(v)
  }, [])

  const setGearCleanIntervalDays = useCallback((v: number) => {
    localStorage.setItem('dg_gear_clean_interval', String(v))
    setGearCleanIntervalDaysState(v)
  }, [])

  return { lowStockThresholdG, setLowStockThresholdG, gearCleanIntervalDays, setGearCleanIntervalDays }
}
