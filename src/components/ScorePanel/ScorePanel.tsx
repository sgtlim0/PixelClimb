import { LEVEL_ZONES } from '../../types/index.ts'
import styles from './ScorePanel.module.css'

interface ScorePanelProps {
  readonly score: number
  readonly bestScore: number
  readonly level: number
  readonly hasShield: boolean
  readonly doubleScoreLeft: number
  readonly streak: number
  readonly muted: boolean
  readonly onToggleMute: () => void
}

export default function ScorePanel({
  score,
  bestScore,
  level,
  hasShield,
  doubleScoreLeft,
  streak,
  muted,
  onToggleMute,
}: ScorePanelProps) {
  const zone = LEVEL_ZONES[level % LEVEL_ZONES.length]

  return (
    <header className={styles.panel}>
      <div className={styles.left}>
        <span className={styles.title}>Pixel Climb</span>
        {hasShield && (
          <span className={styles.shield}>{'\uD83D\uDEE1\uFE0F'}</span>
        )}
        {doubleScoreLeft > 0 && (
          <span className={styles.doubleScore}>x2</span>
        )}
        {streak >= 5 && (
          <span className={styles.streak}>{streak}</span>
        )}
      </div>
      <div className={styles.center}>
        <div className={styles.scoreBlock}>
          <span className={styles.scoreLabel}>Score</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
        <div className={styles.scoreBlock}>
          <span className={styles.scoreLabel}>Best</span>
          <span className={styles.bestValue}>{bestScore}</span>
        </div>
        {level > 0 && (
          <div className={styles.scoreBlock}>
            <span className={styles.scoreLabel}>Level</span>
            <span className={styles.levelValue} style={{ color: zone.stepColor }}>
              {level + 1}
            </span>
          </div>
        )}
      </div>
      <div className={styles.right}>
        <button
          className={styles.muteButton}
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
        </button>
      </div>
    </header>
  )
}
