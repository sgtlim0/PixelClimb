import { useCallback } from 'react'
import { useClimbGame } from './hooks/useClimbGame.ts'
import { useResponsiveScale } from './hooks/useResponsiveScale.ts'
import { hapticLight, hapticMedium } from './engine/sound.ts'
import GameCanvas from './components/GameCanvas/GameCanvas.tsx'
import ScorePanel from './components/ScorePanel/ScorePanel.tsx'
import Controls from './components/Controls/Controls.tsx'
import GameOver from './components/GameOver/GameOver.tsx'
import MenuScreen from './components/MenuScreen/MenuScreen.tsx'
import type { Direction } from './types/index.ts'
import styles from './App.module.css'

const HEADER_HEIGHT = 48

export default function App() {
  const {
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
  } = useClimbGame()

  const scaleInfo = useResponsiveScale(HEADER_HEIGHT)

  const isGameOver = phase === 'gameover'
  const isNewBest = isGameOver && score >= bestScore && score > 0

  const onMove = useCallback(
    (dir: Direction) => {
      hapticLight()
      handleMove(dir)
    },
    [handleMove],
  )

  const onStart = useCallback(() => {
    hapticMedium()
    startGame()
  }, [startGame])

  const onRestart = useCallback(() => {
    hapticMedium()
    startGame()
  }, [startGame])

  return (
    <div className={styles.app}>
      <ScorePanel
        score={score}
        bestScore={bestScore}
        muted={muted}
        onToggleMute={toggleMute}
      />

      <div className={styles.gameArea}>
        <div
          className={styles.canvasWrapper}
          style={{
            width: scaleInfo.containerWidth,
            height: scaleInfo.containerHeight,
          }}
        >
          <GameCanvas
            phase={phase}
            score={score}
            scaleInfo={scaleInfo}
            getGameState={getGameState}
            updateCamera={updateCamera}
            updateParticles={updateParticles}
            updatePlayer={updatePlayer}
            onMove={onMove}
          />
        </div>
      </div>

      <Controls onMove={onMove} visible={phase === 'playing'} />

      {phase === 'menu' && (
        <MenuScreen bestScore={bestScore} onStart={onStart} />
      )}

      {isGameOver && (
        <GameOver
          score={score}
          bestScore={bestScore}
          isNewBest={isNewBest}
          leaderboard={leaderboard}
          onRestart={onRestart}
        />
      )}
    </div>
  )
}
