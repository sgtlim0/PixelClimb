import { useState, useCallback, useRef } from 'react'
import {
  GAME_CONFIG,
  BEST_SCORE_KEY,
  LEADERBOARD_KEY,
  MAX_LEADERBOARD,
} from '../types/index.ts'
import type {
  GamePhase,
  Direction,
  Step,
  Particle,
  PlayerState,
  LeaderboardEntry,
} from '../types/index.ts'
import { COLORS } from '../types/index.ts'
import { playJump, playFail, playMilestone } from '../engine/sound.ts'

function loadBestScore(): number {
  try {
    return parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10)
  } catch {
    return 0
  }
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch {
    // ignore
  }
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LeaderboardEntry[]
  } catch {
    return []
  }
}

function saveLeaderboardEntries(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries))
  } catch {
    // ignore
  }
}

function randomDirection(): Direction {
  return Math.random() < 0.5 ? 'left' : 'right'
}

function generateStep(index: number, prevStep: Step | null): Step {
  const { stepOffsetX, stepGapY, baseY, width, stepWidth } = GAME_CONFIG

  if (index === 0) {
    return { x: width / 2, y: baseY, direction: 'right', index: 0 }
  }

  const dir = randomDirection()
  const prevX = prevStep!.x
  const offsetX = dir === 'left' ? -stepOffsetX : stepOffsetX
  const newX = Math.max(
    stepWidth / 2 + 20,
    Math.min(width - stepWidth / 2 - 20, prevX + offsetX),
  )
  const newY = prevStep!.y - stepGapY

  return { x: newX, y: newY, direction: dir, index }
}

function generateInitialSteps(): Step[] {
  const steps: Step[] = []
  for (let i = 0; i < GAME_CONFIG.initialSteps; i++) {
    steps.push(generateStep(i, i > 0 ? steps[i - 1] : null))
  }
  return steps
}

function createParticles(x: number, y: number, count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = 1.5 + Math.random() * 3
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 1,
      color: COLORS.particles[Math.floor(Math.random() * COLORS.particles.length)],
      size: 2 + Math.random() * 3,
    })
  }
  return particles
}

export function useClimbGame() {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(loadBestScore)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard())
  const [muted, setMuted] = useState(false)

  const stepsRef = useRef<Step[]>(generateInitialSteps())
  const playerRef = useRef<PlayerState>({
    x: GAME_CONFIG.width / 2,
    y: GAME_CONFIG.baseY,
    targetX: GAME_CONFIG.width / 2,
    targetY: GAME_CONFIG.baseY,
    isJumping: false,
  })
  const currentStepRef = useRef(0)
  const cameraYRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const scoreRef = useRef(0)
  const phaseRef = useRef<GamePhase>('menu')
  const mutedRef = useRef(false)
  const failedStepRef = useRef<number | null>(null)

  const startGame = useCallback(() => {
    stepsRef.current = generateInitialSteps()
    playerRef.current = {
      x: GAME_CONFIG.width / 2,
      y: GAME_CONFIG.baseY,
      targetX: GAME_CONFIG.width / 2,
      targetY: GAME_CONFIG.baseY,
      isJumping: false,
    }
    currentStepRef.current = 0
    cameraYRef.current = 0
    particlesRef.current = []
    scoreRef.current = 0
    failedStepRef.current = null
    setScore(0)
    setPhase('playing')
    phaseRef.current = 'playing'
  }, [])

  const handleMove = useCallback((direction: Direction) => {
    if (phaseRef.current !== 'playing') return
    if (playerRef.current.isJumping) return

    const currentIdx = currentStepRef.current
    const nextIdx = currentIdx + 1

    if (nextIdx >= stepsRef.current.length) return

    const nextStep = stepsRef.current[nextIdx]
    const isCorrect =
      (direction === 'left' && nextStep.x < stepsRef.current[currentIdx].x) ||
      (direction === 'right' && nextStep.x >= stepsRef.current[currentIdx].x)

    if (isCorrect) {
      // Successful jump
      playerRef.current = {
        ...playerRef.current,
        targetX: nextStep.x,
        targetY: nextStep.y,
        isJumping: true,
      }
      currentStepRef.current = nextIdx

      const newScore = nextIdx
      scoreRef.current = newScore
      setScore(newScore)

      if (!mutedRef.current) {
        playJump(newScore)
        if (newScore > 0 && newScore % 25 === 0) {
          setTimeout(() => playMilestone(), 100)
        }
      }

      // Particles at landing
      particlesRef.current = [
        ...particlesRef.current.slice(-20),
        ...createParticles(nextStep.x, nextStep.y, 8),
      ]

      // Generate more steps ahead
      while (stepsRef.current.length < nextIdx + GAME_CONFIG.stepsAhead + 2) {
        const lastStep = stepsRef.current[stepsRef.current.length - 1]
        stepsRef.current = [
          ...stepsRef.current,
          generateStep(stepsRef.current.length, lastStep),
        ]
      }

      // End jump after duration
      setTimeout(() => {
        playerRef.current = {
          ...playerRef.current,
          x: playerRef.current.targetX,
          y: playerRef.current.targetY,
          isJumping: false,
        }
      }, GAME_CONFIG.jumpDuration)
    } else {
      // Failed jump - game over
      failedStepRef.current = nextIdx

      // Show player jumping to wrong position then falling
      const wrongX = direction === 'left'
        ? stepsRef.current[currentIdx].x - GAME_CONFIG.stepOffsetX
        : stepsRef.current[currentIdx].x + GAME_CONFIG.stepOffsetX
      const wrongY = stepsRef.current[currentIdx].y - GAME_CONFIG.stepGapY

      playerRef.current = {
        ...playerRef.current,
        targetX: wrongX,
        targetY: wrongY,
        isJumping: true,
      }

      if (!mutedRef.current) playFail()

      setTimeout(() => {
        phaseRef.current = 'gameover'
        setPhase('gameover')

        const finalScore = scoreRef.current
        setBestScore((prev) => {
          const newBest = Math.max(prev, finalScore)
          saveBestScore(newBest)
          return newBest
        })

        const entry: LeaderboardEntry = {
          score: finalScore,
          date: new Date().toISOString().slice(0, 10),
        }
        setLeaderboard((prev) => {
          const updated = [...prev, entry]
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_LEADERBOARD)
          saveLeaderboardEntries(updated)
          return updated
        })
      }, 500)
    }
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      mutedRef.current = !prev
      return !prev
    })
  }, [])

  const getGameState = useCallback(() => ({
    steps: stepsRef.current,
    player: playerRef.current,
    currentStep: currentStepRef.current,
    cameraY: cameraYRef.current,
    particles: particlesRef.current,
    failedStep: failedStepRef.current,
  }), [])

  const updateCamera = useCallback(() => {
    const player = playerRef.current
    const targetCameraY = Math.max(0, (GAME_CONFIG.baseY - player.targetY) - 100)
    cameraYRef.current += (targetCameraY - cameraYRef.current) * GAME_CONFIG.cameraSmooth
  }, [])

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1,
        life: p.life - 0.02,
      }))
      .filter((p) => p.life > 0)
  }, [])

  const updatePlayer = useCallback(() => {
    const p = playerRef.current
    if (p.isJumping) {
      const dx = p.targetX - p.x
      const dy = p.targetY - p.y
      const lerp = 0.15
      playerRef.current = {
        ...p,
        x: p.x + dx * lerp,
        y: p.y + dy * lerp,
      }
    }
  }, [])

  return {
    phase,
    score,
    bestScore,
    leaderboard,
    muted,
    startGame,
    handleMove,
    toggleMute,
    getGameState,
    updateCamera,
    updateParticles,
    updatePlayer,
  }
}
