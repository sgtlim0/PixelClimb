import type { LeaderboardEntry } from '../../types/index.ts'
import styles from './GameOver.module.css'

interface GameOverProps {
  readonly score: number
  readonly bestScore: number
  readonly isNewBest: boolean
  readonly leaderboard: LeaderboardEntry[]
  readonly onRestart: () => void
}

export default function GameOver({
  score,
  bestScore,
  isNewBest,
  leaderboard,
  onRestart,
}: GameOverProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Game Over</h2>

        {isNewBest && <span className={styles.newBest}>New Best!</span>}

        <div className={styles.scoreRow}>
          <div className={styles.scoreBlock}>
            <span className={styles.label}>Score</span>
            <span className={styles.value}>{score}</span>
          </div>
          <div className={styles.scoreBlock}>
            <span className={styles.label}>Best</span>
            <span className={styles.bestValue}>{bestScore}</span>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className={styles.leaderboard}>
            <h3 className={styles.lbTitle}>Top Scores</h3>
            <ol className={styles.lbList}>
              {leaderboard.slice(0, 5).map((entry, i) => (
                <li
                  key={`${entry.score}-${entry.date}-${i}`}
                  className={
                    entry.score === score
                      ? styles.lbItemActive
                      : styles.lbItem
                  }
                >
                  <span className={styles.lbRank}>#{i + 1}</span>
                  <span className={styles.lbScore}>{entry.score}</span>
                  <span className={styles.lbDate}>{entry.date}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button className={styles.restartBtn} onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  )
}
