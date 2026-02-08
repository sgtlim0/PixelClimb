import type { Direction } from '../../types/index.ts'
import styles from './Controls.module.css'

interface ControlsProps {
  readonly onMove: (dir: Direction) => void
  readonly visible: boolean
}

export default function Controls({ onMove, visible }: ControlsProps) {
  if (!visible) return null

  return (
    <div className={styles.controls}>
      <button
        className={styles.button}
        onPointerDown={() => onMove('left')}
        aria-label="Move left"
      >
        <span className={styles.arrow}>&larr;</span>
      </button>
      <button
        className={styles.button}
        onPointerDown={() => onMove('right')}
        aria-label="Move right"
      >
        <span className={styles.arrow}>&rarr;</span>
      </button>
    </div>
  )
}
