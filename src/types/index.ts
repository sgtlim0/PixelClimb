export type GamePhase = 'menu' | 'playing' | 'gameover'
export type Direction = 'left' | 'right'

export interface Step {
  readonly x: number
  readonly y: number
  readonly direction: Direction
  readonly index: number
}

export interface Particle {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly life: number
  readonly maxLife: number
  readonly color: string
  readonly size: number
}

export interface PlayerState {
  readonly x: number
  readonly y: number
  readonly targetX: number
  readonly targetY: number
  readonly isJumping: boolean
}

export const GAME_CONFIG = {
  width: 400,
  height: 700,
  stepWidth: 70,
  stepHeight: 12,
  stepGapY: 80,
  playerSize: 28,
  jumpDuration: 200,
  cameraSmooth: 0.08,
  initialSteps: 12,
  stepsAhead: 8,
  stepOffsetX: 65,
  baseY: 600,
} as const

export const COLORS = {
  bg: '#0a1628',
  stepNormal: '#3b82f6',
  stepGlow: '#60a5fa',
  stepMissed: '#ef4444',
  player: '#fbbf24',
  playerGlow: '#f59e0b',
  text: '#e2e8f0',
  textMuted: 'rgba(226, 232, 240, 0.5)',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  particles: ['#fbbf24', '#f59e0b', '#3b82f6', '#60a5fa', '#a78bfa', '#34d399'],
} as const

export const LEADERBOARD_KEY = 'pixel_climb_leaderboard'
export const BEST_SCORE_KEY = 'pixel_climb_best'
export const MAX_LEADERBOARD = 10

export interface LeaderboardEntry {
  readonly score: number
  readonly date: string
}
