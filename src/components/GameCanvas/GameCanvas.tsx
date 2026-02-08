import { useRef, useEffect, useCallback } from 'react'
import { GAME_CONFIG, LEVEL_ZONES, COLORS } from '../../types/index.ts'
import type { Direction, Step, Particle, PlayerState } from '../../types/index.ts'
import type { ScaleInfo } from '../../hooks/useResponsiveScale.ts'
import styles from './GameCanvas.module.css'

interface GameCanvasProps {
  readonly phase: 'menu' | 'playing' | 'gameover'
  readonly score: number
  readonly scaleInfo: ScaleInfo
  readonly getGameState: () => {
    steps: Step[]
    player: PlayerState
    currentStep: number
    cameraY: number
    particles: Particle[]
    failedStep: number | null
    level: number
    hasShield: boolean
    doubleScoreLeft: number
    streak: number
    shake: number
  }
  readonly updateCamera: () => void
  readonly updateParticles: () => void
  readonly updatePlayer: () => void
  readonly onMove: (dir: Direction) => void
}

function getZone(level: number) {
  return LEVEL_ZONES[level % LEVEL_ZONES.length]
}

function getStepWidth(stepIndex: number): number {
  const level = Math.floor(stepIndex / GAME_CONFIG.levelInterval)
  return Math.max(
    GAME_CONFIG.minStepWidth,
    GAME_CONFIG.stepWidth - level * GAME_CONFIG.stepWidthShrink,
  )
}

export default function GameCanvas({
  phase,
  score,
  scaleInfo,
  getGameState,
  updateCamera,
  updateParticles,
  updatePlayer,
  onMove,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isTouchRef = useRef(false)

  const propsRef = useRef({
    phase,
    score,
    getGameState,
    updateCamera,
    updateParticles,
    updatePlayer,
  })

  useEffect(() => {
    propsRef.current = {
      phase,
      score,
      getGameState,
      updateCamera,
      updateParticles,
      updatePlayer,
    }
  }, [phase, score, getGameState, updateCamera, updateParticles, updatePlayer])

  const drawStep = useCallback(
    (ctx: CanvasRenderingContext2D, step: Step, cameraY: number, currentStep: number, failedStep: number | null, level: number) => {
      const stepW = getStepWidth(step.index)
      const { stepHeight } = GAME_CONFIG
      const screenY = step.y - cameraY
      const isActive = step.index === currentStep
      const isFailed = step.index === failedStep
      const isPast = step.index < currentStep
      const isNext = step.index === currentStep + 1

      if (screenY < -50 || screenY > GAME_CONFIG.height + 50) return

      const x = step.x - stepW / 2
      const y = screenY - stepHeight / 2
      const zone = getZone(level)

      ctx.save()

      if (isFailed) {
        ctx.shadowColor = COLORS.stepMissed
        ctx.shadowBlur = 15
        ctx.fillStyle = COLORS.stepMissed
      } else if (isActive) {
        ctx.shadowColor = zone.stepGlow
        ctx.shadowBlur = 14
        ctx.fillStyle = zone.stepColor
      } else if (isPast) {
        ctx.fillStyle = `${zone.stepColor}33`
      } else if (isNext) {
        ctx.shadowColor = zone.stepGlow
        ctx.shadowBlur = 8
        ctx.fillStyle = `${zone.stepColor}cc`
      } else {
        ctx.fillStyle = `${zone.stepColor}99`
      }

      // Rounded step
      const radius = 6
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + stepW - radius, y)
      ctx.quadraticCurveTo(x + stepW, y, x + stepW, y + radius)
      ctx.lineTo(x + stepW, y + stepHeight - radius)
      ctx.quadraticCurveTo(x + stepW, y + stepHeight, x + stepW - radius, y + stepHeight)
      ctx.lineTo(x + radius, y + stepHeight)
      ctx.quadraticCurveTo(x, y + stepHeight, x, y + stepHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()

      // Step highlight
      if (isActive || isNext || (!isPast && !isFailed)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + stepW - radius, y)
        ctx.quadraticCurveTo(x + stepW, y, x + stepW, y + radius)
        ctx.lineTo(x + stepW, y + stepHeight / 2)
        ctx.lineTo(x, y + stepHeight / 2)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
      }

      // Power-up icon on step
      if (step.powerUp && !isPast) {
        ctx.shadowBlur = 0
        ctx.font = 'bold 14px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (step.powerUp === 'shield') {
          ctx.fillStyle = COLORS.shield
          ctx.fillText('\uD83D\uDEE1\uFE0F', step.x, screenY - 18)
        } else if (step.powerUp === 'doubleScore') {
          ctx.fillStyle = COLORS.doubleScore
          ctx.fillText('x2', step.x, screenY - 18)
        }
      }

      ctx.restore()
    },
    [],
  )

  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, player: PlayerState, cameraY: number, hasShield: boolean) => {
      const { playerSize } = GAME_CONFIG
      const screenY = player.y - cameraY

      ctx.save()

      // Shield aura
      if (hasShield) {
        ctx.shadowColor = COLORS.playerShield
        ctx.shadowBlur = 25
        ctx.strokeStyle = `${COLORS.playerShield}66`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(player.x, screenY - playerSize / 2 - 3, playerSize / 2 + 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Player glow
      ctx.shadowColor = COLORS.playerGlow
      ctx.shadowBlur = 20

      // Player body (rounded square)
      const half = playerSize / 2
      const px = player.x - half
      const py = screenY - playerSize - 3
      const r = 6

      ctx.fillStyle = COLORS.player
      ctx.beginPath()
      ctx.moveTo(px + r, py)
      ctx.lineTo(px + playerSize - r, py)
      ctx.quadraticCurveTo(px + playerSize, py, px + playerSize, py + r)
      ctx.lineTo(px + playerSize, py + playerSize - r)
      ctx.quadraticCurveTo(px + playerSize, py + playerSize, px + playerSize - r, py + playerSize)
      ctx.lineTo(px + r, py + playerSize)
      ctx.quadraticCurveTo(px, py + playerSize, px, py + playerSize - r)
      ctx.lineTo(px, py + r)
      ctx.quadraticCurveTo(px, py, px + r, py)
      ctx.closePath()
      ctx.fill()

      // Face - eyes
      ctx.shadowBlur = 0
      ctx.fillStyle = '#1a1a2e'
      ctx.beginPath()
      ctx.arc(player.x - 5, screenY - playerSize + 10, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(player.x + 5, screenY - playerSize + 10, 3, 0, Math.PI * 2)
      ctx.fill()

      // Smile
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(player.x, screenY - playerSize + 14, 5, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()

      ctx.restore()
    },
    [],
  )

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particles: Particle[], cameraY: number) => {
      for (const p of particles) {
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 5
        ctx.beginPath()
        ctx.arc(p.x, p.y - cameraY, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    },
    [],
  )

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, cameraY: number, level: number) => {
      const { width, height } = GAME_CONFIG
      const zone = getZone(level)

      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, zone.bgTop)
      grad.addColorStop(1, zone.bgBottom)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Subtle grid with zone color
      ctx.strokeStyle = `${zone.stepColor}0a`
      ctx.lineWidth = 1
      const gridSize = 40
      const offsetY = cameraY % gridSize

      for (let y = -offsetY; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      const starSeed = Math.floor(cameraY / 200)
      for (let i = 0; i < 30; i++) {
        const hash = ((starSeed + i) * 2654435761) >>> 0
        const sx = (hash % width)
        const sy = ((hash * 7) % height)
        ctx.beginPath()
        ctx.arc(sx, sy, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [],
  )

  const drawHUD = useCallback(
    (ctx: CanvasRenderingContext2D, scoreVal: number, streak: number, doubleScoreLeft: number, level: number) => {
      const { width } = GAME_CONFIG
      const zone = getZone(level)

      // Big score watermark
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.font = 'bold 80px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(scoreVal), width / 2, 120)
      ctx.restore()

      // Level zone name
      if (level > 0) {
        ctx.save()
        ctx.fillStyle = `${zone.stepColor}55`
        ctx.font = 'bold 14px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Lv.${level + 1} ${zone.name}`, width / 2, 170)
        ctx.restore()
      }

      // Streak indicator
      if (streak >= 5) {
        ctx.save()
        ctx.fillStyle = `${COLORS.doubleScore}aa`
        ctx.font = 'bold 16px -apple-system, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${streak} streak`, width - 15, 30)
        ctx.restore()
      }

      // Double score indicator
      if (doubleScoreLeft > 0) {
        ctx.save()
        ctx.fillStyle = `${COLORS.doubleScore}cc`
        ctx.font = 'bold 14px -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`x2 (${doubleScoreLeft})`, 15, 30)
        ctx.restore()
      }
    },
    [],
  )

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = GAME_CONFIG
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    function render() {
      const props = propsRef.current
      props.updateCamera()
      props.updateParticles()
      props.updatePlayer()

      const state = props.getGameState()
      const { cameraY, shake } = state

      ctx!.clearRect(0, 0, width, height)

      // Screen shake offset
      ctx!.save()
      if (shake > 0) {
        const sx = (Math.random() - 0.5) * shake
        const sy = (Math.random() - 0.5) * shake
        ctx!.translate(sx, sy)
      }

      drawBackground(ctx!, cameraY, state.level)

      // Draw steps
      for (const step of state.steps) {
        drawStep(ctx!, step, cameraY, state.currentStep, state.failedStep, state.level)
      }

      // Draw particles
      drawParticles(ctx!, state.particles, cameraY)

      // Draw player
      if (props.phase !== 'menu') {
        drawPlayer(ctx!, state.player, cameraY, state.hasShield)
      }

      // HUD during playing
      if (props.phase === 'playing') {
        drawHUD(ctx!, props.score, state.streak, state.doubleScoreLeft, state.level)
      }

      ctx!.restore()

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [drawBackground, drawStep, drawParticles, drawPlayer, drawHUD])

  // Touch/swipe handlers - prevents double-fire with click
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchRef.current = true
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dt = Date.now() - touchStartRef.current.time

      // Swipe detection: min 15px drag or tap (< 200ms, < 10px move)
      if (Math.abs(dx) > 15) {
        onMove(dx < 0 ? 'left' : 'right')
      } else if (dt < 200) {
        // Tap: use position on canvas
        const rect = (e.target as HTMLElement).getBoundingClientRect()
        const tapX = touch.clientX - rect.left
        onMove(tapX < rect.width / 2 ? 'left' : 'right')
      }
      touchStartRef.current = null
    },
    [onMove],
  )

  // Click handler - only fires for mouse, not touch
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchRef.current) {
        isTouchRef.current = false
        return
      }
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const half = rect.width / 2
      onMove(x < half ? 'left' : 'right')
    },
    [onMove],
  )

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        onMove('left')
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        onMove('right')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onMove])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{
        width: scaleInfo.containerWidth,
        height: scaleInfo.containerHeight,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    />
  )
}
