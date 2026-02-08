import { useRef, useEffect, useCallback } from 'react'
import { GAME_CONFIG, COLORS } from '../../types/index.ts'
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
  }
  readonly updateCamera: () => void
  readonly updateParticles: () => void
  readonly updatePlayer: () => void
  readonly onMove: (dir: Direction) => void
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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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
    (ctx: CanvasRenderingContext2D, step: Step, cameraY: number, currentStep: number, failedStep: number | null) => {
      const { stepWidth, stepHeight } = GAME_CONFIG
      const screenY = step.y - cameraY
      const isActive = step.index === currentStep
      const isFailed = step.index === failedStep
      const isPast = step.index < currentStep

      if (screenY < -50 || screenY > GAME_CONFIG.height + 50) return

      const x = step.x - stepWidth / 2
      const y = screenY - stepHeight / 2

      ctx.save()

      if (isFailed) {
        ctx.shadowColor = COLORS.stepMissed
        ctx.shadowBlur = 15
        ctx.fillStyle = COLORS.stepMissed
      } else if (isActive) {
        ctx.shadowColor = COLORS.stepGlow
        ctx.shadowBlur = 12
        ctx.fillStyle = COLORS.stepNormal
      } else if (isPast) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)'
      }

      // Draw rounded step
      const radius = 6
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + stepWidth - radius, y)
      ctx.quadraticCurveTo(x + stepWidth, y, x + stepWidth, y + radius)
      ctx.lineTo(x + stepWidth, y + stepHeight - radius)
      ctx.quadraticCurveTo(x + stepWidth, y + stepHeight, x + stepWidth - radius, y + stepHeight)
      ctx.lineTo(x + radius, y + stepHeight)
      ctx.quadraticCurveTo(x, y + stepHeight, x, y + stepHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()

      // Step highlight
      if (isActive || (!isPast && !isFailed)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + stepWidth - radius, y)
        ctx.quadraticCurveTo(x + stepWidth, y, x + stepWidth, y + radius)
        ctx.lineTo(x + stepWidth, y + stepHeight / 2)
        ctx.lineTo(x, y + stepHeight / 2)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    },
    [],
  )

  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, player: PlayerState, cameraY: number) => {
      const { playerSize } = GAME_CONFIG
      const screenY = player.y - cameraY

      ctx.save()

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
    (ctx: CanvasRenderingContext2D, cameraY: number) => {
      const { width, height } = GAME_CONFIG

      // Dark gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, '#060e1a')
      grad.addColorStop(1, '#0a1628')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Subtle grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)'
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

      // Stars / dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
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
      const { cameraY } = state

      ctx!.clearRect(0, 0, width, height)

      drawBackground(ctx!, cameraY)

      // Draw steps
      for (const step of state.steps) {
        drawStep(ctx!, step, cameraY, state.currentStep, state.failedStep)
      }

      // Draw particles
      drawParticles(ctx!, state.particles, cameraY)

      // Draw player
      if (props.phase !== 'menu') {
        drawPlayer(ctx!, state.player, cameraY)
      }

      // Score display during playing
      if (props.phase === 'playing') {
        ctx!.save()
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx!.font = 'bold 80px -apple-system, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'
        ctx!.fillText(String(props.score), width / 2, 120)
        ctx!.restore()
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [drawBackground, drawStep, drawParticles, drawPlayer])

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const minSwipe = 20

      if (Math.abs(dx) > minSwipe) {
        onMove(dx < 0 ? 'left' : 'right')
      }
      touchStartRef.current = null
    },
    [onMove],
  )

  // Click handler (left/right half)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
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
