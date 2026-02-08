import styles from './MenuScreen.module.css'

interface MenuScreenProps {
  readonly bestScore: number
  readonly onStart: () => void
}

export default function MenuScreen({ bestScore, onStart }: MenuScreenProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h1 className={styles.title}>Pixel Climb</h1>
        <p className={styles.subtitle}>Choose the right direction to climb higher</p>

        {bestScore > 0 && (
          <div className={styles.best}>
            <span className={styles.bestLabel}>Best Score</span>
            <span className={styles.bestValue}>{bestScore}</span>
          </div>
        )}

        <button className={styles.startBtn} onClick={onStart}>
          Start Game
        </button>

        <div className={styles.controls}>
          <div className={styles.controlItem}>
            <span className={styles.controlKey}>&larr; &rarr;</span>
            <span className={styles.controlDesc}>Arrow keys or swipe</span>
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlKey}>Tap</span>
            <span className={styles.controlDesc}>Tap left/right half</span>
          </div>
        </div>
      </div>
    </div>
  )
}
