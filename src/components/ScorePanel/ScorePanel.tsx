import styles from './ScorePanel.module.css'

interface ScorePanelProps {
  readonly score: number
  readonly bestScore: number
  readonly muted: boolean
  readonly onToggleMute: () => void
}

export default function ScorePanel({
  score,
  bestScore,
  muted,
  onToggleMute,
}: ScorePanelProps) {
  return (
    <header className={styles.panel}>
      <div className={styles.left}>
        <span className={styles.title}>Pixel Climb</span>
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
