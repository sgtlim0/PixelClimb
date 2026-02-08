export type GamePhase = 'menu' | 'playing' | 'gameover'
export type Direction = 'left' | 'right'
export type PowerUpType = 'shield' | 'doubleScore'

export interface Step {
  readonly x: number
  readonly y: number
  readonly direction: Direction
  readonly index: number
  readonly powerUp: PowerUpType | null
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
  jumpDuration: 180,
  cameraSmooth: 0.1,
  initialSteps: 12,
  stepsAhead: 8,
  stepOffsetX: 65,
  baseY: 600,
  // Difficulty
  levelInterval: 10,
  minStepWidth: 45,
  stepWidthShrink: 2,
  maxOffsetVariance: 20,
  // Power-ups
  shieldInterval: 15,
  doubleScoreInterval: 22,
  doubleScoreDuration: 10,
  // Streak
  streakMilestone: 5,
} as const

export interface LevelZone {
  readonly name: string
  readonly stepColor: string
  readonly stepGlow: string
  readonly bgTop: string
  readonly bgBottom: string
  readonly particleColors: readonly string[]
}

export const LEVEL_ZONES: readonly LevelZone[] = [
  { name: 'Sky', stepColor: '#3b82f6', stepGlow: '#60a5fa', bgTop: '#060e1a', bgBottom: '#0a1628', particleColors: ['#fbbf24', '#f59e0b', '#3b82f6', '#60a5fa', '#a78bfa', '#34d399'] },
  { name: 'Forest', stepColor: '#22c55e', stepGlow: '#4ade80', bgTop: '#052e16', bgBottom: '#0a1628', particleColors: ['#22c55e', '#4ade80', '#a3e635', '#fbbf24', '#86efac'] },
  { name: 'Sunset', stepColor: '#f97316', stepGlow: '#fb923c', bgTop: '#1c0a00', bgBottom: '#1a0a0a', particleColors: ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#fca5a5'] },
  { name: 'Ocean', stepColor: '#06b6d4', stepGlow: '#22d3ee', bgTop: '#001a24', bgBottom: '#0a1628', particleColors: ['#06b6d4', '#22d3ee', '#67e8f9', '#3b82f6', '#a5f3fc'] },
  { name: 'Neon', stepColor: '#a855f7', stepGlow: '#c084fc', bgTop: '#150030', bgBottom: '#0a0020', particleColors: ['#a855f7', '#c084fc', '#ec4899', '#f472b6', '#e879f9'] },
  { name: 'Inferno', stepColor: '#ef4444', stepGlow: '#f87171', bgTop: '#1a0505', bgBottom: '#200a0a', particleColors: ['#ef4444', '#f87171', '#fbbf24', '#f97316', '#fca5a5'] },
  { name: 'Arctic', stepColor: '#38bdf8', stepGlow: '#7dd3fc', bgTop: '#0c1929', bgBottom: '#0a1628', particleColors: ['#38bdf8', '#7dd3fc', '#e0f2fe', '#bae6fd', '#f0f9ff'] },
  { name: 'Cosmos', stepColor: '#e879f9', stepGlow: '#f0abfc', bgTop: '#1a002e', bgBottom: '#0d001a', particleColors: ['#e879f9', '#f0abfc', '#c084fc', '#fbbf24', '#f472b6'] },
] as const

export const COLORS = {
  bg: '#0a1628',
  stepNormal: '#3b82f6',
  stepGlow: '#60a5fa',
  stepMissed: '#ef4444',
  player: '#fbbf24',
  playerGlow: '#f59e0b',
  playerShield: '#60a5fa',
  text: '#e2e8f0',
  textMuted: 'rgba(226, 232, 240, 0.5)',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  shield: '#3b82f6',
  doubleScore: '#fbbf24',
  particles: ['#fbbf24', '#f59e0b', '#3b82f6', '#60a5fa', '#a78bfa', '#34d399'],
} as const

export const LEADERBOARD_KEY = 'pixel_climb_leaderboard'
export const BEST_SCORE_KEY = 'pixel_climb_best'
export const MAX_LEADERBOARD = 10

export interface LeaderboardEntry {
  readonly score: number
  readonly date: string
}
