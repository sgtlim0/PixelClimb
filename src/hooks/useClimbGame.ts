import { useState, useCallback, useRef } from 'react'
import {
  GAME_CONFIG,
  LEVEL_ZONES,
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
  PowerUpType,
} from '../types/index.ts'
import {
  playJump,
  playFail,
  playMilestone,
  playLevelUp,
  playShield,
  playShieldBreak,
  playDoubleScore,
  playStreak,
} from '../engine/sound.ts'

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

function getPowerUp(index: number): PowerUpType | null {
  if (index < 5) return null
  const { shieldInterval, doubleScoreInterval } = GAME_CONFIG
  if (index % shieldInterval === 0) return 'shield'
  if (index % doubleScoreInterval === 0) return 'doubleScore'
  return null
}

function getStepWidthForLevel(level: number): number {
  const { stepWidth, minStepWidth, stepWidthShrink } = GAME_CONFIG
  return Math.max(minStepWidth, stepWidth - level * stepWidthShrink)
}

function getOffsetForLevel(level: number): number {
  const { stepOffsetX, maxOffsetVariance } = GAME_CONFIG
  const variance = Math.min(level * 3, maxOffsetVariance)
  return stepOffsetX + (Math.random() - 0.5) * variance
}

function generateStep(index: number, prevStep: Step | null): Step {
  const { stepGapY, baseY, width } = GAME_CONFIG

  if (index === 0) {
    return { x: width / 2, y: baseY, direction: 'right', index: 0, powerUp: null }
  }

  const level = Math.floor(index / GAME_CONFIG.levelInterval)
  const stepW = getStepWidthForLevel(level)
  const dir = randomDirection()
  const prevX = prevStep!.x
  const offset = getOffsetForLevel(level)
  const offsetX = dir === 'left' ? -offset : offset
  const newX = Math.max(
    stepW / 2 + 20,
    Math.min(width - stepW / 2 - 20, prevX + offsetX),
  )
  const newY = prevStep!.y - stepGapY

  return { x: newX, y: newY, direction: dir, index, powerUp: getPowerUp(index) }
}

function generateInitialSteps(): Step[] {
  const steps: Step[] = []
  for (let i = 0; i < GAME_CONFIG.initialSteps; i++) {
    steps.push(generateStep(i, i > 0 ? steps[i - 1] : null))
  }
  return steps
}

function getZone(level: number) {
  return LEVEL_ZONES[level % LEVEL_ZONES.length]
}

function createParticles(x: number, y: number, count: number, colors: readonly string[]): Particle[] {
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
      color: colors[Math.floor(Math.random() * colors.length)],
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
  const [level, setLevel] = useState(0)
  const [hasShield, setHasShield] = useState(false)
  const [doubleScoreLeft, setDoubleScoreLeft] = useState(0)
  const [streak, setStreak] = useState(0)

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
  const levelRef = useRef(0)
  const hasShieldRef = useRef(false)
  const doubleScoreLeftRef = useRef(0)
  const streakRef = useRef(0)
  const shakeRef = useRef(0)

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
    levelRef.current = 0
    hasShieldRef.current = false
    doubleScoreLeftRef.current = 0
    streakRef.current = 0
    shakeRef.current = 0
    setScore(0)
    setLevel(0)
    setHasShield(false)
    setDoubleScoreLeft(0)
    setStreak(0)
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
    const currentStep = stepsRef.current[currentIdx]
    const isCorrect =
      (direction === 'left' && nextStep.x < currentStep.x) ||
      (direction === 'right' && nextStep.x >= currentStep.x)

    if (isCorrect) {
      // Successful jump
      playerRef.current = {
        ...playerRef.current,
        targetX: nextStep.x,
        targetY: nextStep.y,
        isJumping: true,
      }
      currentStepRef.current = nextIdx

      // Scoring: base 1 point, doubled if doubleScore active
      const multiplier = doubleScoreLeftRef.current > 0 ? 2 : 1
      const earned = multiplier
      scoreRef.current += earned
      setScore(scoreRef.current)

      if (doubleScoreLeftRef.current > 0) {
        doubleScoreLeftRef.current -= 1
        setDoubleScoreLeft(doubleScoreLeftRef.current)
      }

      // Streak
      streakRef.current += 1
      setStreak(streakRef.current)

      // Level check
      const newLevel = Math.floor(nextIdx / GAME_CONFIG.levelInterval)
      if (newLevel > levelRef.current) {
        levelRef.current = newLevel
        setLevel(newLevel)
        if (!mutedRef.current) playLevelUp()
        // Level-up burst particles
        const zone = getZone(newLevel)
        particlesRef.current = [
          ...particlesRef.current.slice(-10),
          ...createParticles(nextStep.x, nextStep.y, 20, zone.particleColors),
        ]
      }

      // Power-up pickup
      if (nextStep.powerUp === 'shield') {
        hasShieldRef.current = true
        setHasShield(true)
        if (!mutedRef.current) playShield()
      } else if (nextStep.powerUp === 'doubleScore') {
        doubleScoreLeftRef.current = GAME_CONFIG.doubleScoreDuration
        setDoubleScoreLeft(GAME_CONFIG.doubleScoreDuration)
        if (!mutedRef.current) playDoubleScore()
      }

      // Sound
      if (!mutedRef.current) {
        playJump(nextIdx)
        if (streakRef.current > 0 && streakRef.current % GAME_CONFIG.streakMilestone === 0) {
          setTimeout(() => playStreak(streakRef.current), 80)
        }
        if (nextIdx > 0 && nextIdx % 25 === 0) {
          setTimeout(() => playMilestone(), 100)
        }
      }

      // Particles at landing
      const zone = getZone(levelRef.current)
      particlesRef.current = [
        ...particlesRef.current.slice(-20),
        ...createParticles(nextStep.x, nextStep.y, 8, zone.particleColors),
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
      // Wrong direction
      if (hasShieldRef.current) {
        // Shield absorbs the mistake
        hasShieldRef.current = false
        setHasShield(false)
        streakRef.current = 0
        setStreak(0)
        shakeRef.current = 8
        if (!mutedRef.current) playShieldBreak()

        // Visual feedback: shake + particles
        const zone = getZone(levelRef.current)
        particlesRef.current = [
          ...particlesRef.current.slice(-10),
          ...createParticles(currentStep.x, currentStep.y, 12, ['#3b82f6', '#60a5fa', '#93c5fd']),
          ...createParticles(currentStep.x, currentStep.y, 6, zone.particleColors),
        ]
        return
      }

      // Game over
      failedStepRef.current = nextIdx
      streakRef.current = 0
      setStreak(0)
      shakeRef.current = 12

      const wrongX = direction === 'left'
        ? currentStep.x - GAME_CONFIG.stepOffsetX
        : currentStep.x + GAME_CONFIG.stepOffsetX
      const wrongY = currentStep.y - GAME_CONFIG.stepGapY

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
    level: levelRef.current,
    hasShield: hasShieldRef.current,
    doubleScoreLeft: doubleScoreLeftRef.current,
    streak: streakRef.current,
    shake: shakeRef.current,
  }), [])

  const updateCamera = useCallback(() => {
    const player = playerRef.current
    const targetCameraY = Math.max(0, (GAME_CONFIG.baseY - player.targetY) - 100)
    cameraYRef.current += (targetCameraY - cameraYRef.current) * GAME_CONFIG.cameraSmooth

    // Decay screen shake
    if (shakeRef.current > 0) {
      shakeRef.current *= 0.85
      if (shakeRef.current < 0.5) shakeRef.current = 0
    }
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
    level,
    hasShield,
    doubleScoreLeft,
    streak,
    startGame,
    handleMove,
    toggleMute,
    getGameState,
    updateCamera,
    updateParticles,
    updatePlayer,
  }
}
