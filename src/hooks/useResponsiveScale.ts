import { useState, useEffect, useCallback } from 'react'
import { GAME_CONFIG } from '../types/index.ts'

export interface ScaleInfo {
  readonly scale: number
  readonly containerWidth: number
  readonly containerHeight: number
}

export function useResponsiveScale(headerHeight: number): ScaleInfo {
  const calculate = useCallback((): ScaleInfo => {
    const vw = window.innerWidth
    const vh = window.innerHeight - headerHeight
    const gameW = GAME_CONFIG.width
    const gameH = GAME_CONFIG.height

    const scaleX = vw / gameW
    const scaleY = vh / gameH
    const scale = Math.min(scaleX, scaleY, 1.4)

    return {
      scale,
      containerWidth: gameW * scale,
      containerHeight: gameH * scale,
    }
  }, [headerHeight])

  const [info, setInfo] = useState<ScaleInfo>(calculate)

  useEffect(() => {
    function handleResize() {
      setInfo(calculate())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
    }
  }, [calculate])

  return info
}
