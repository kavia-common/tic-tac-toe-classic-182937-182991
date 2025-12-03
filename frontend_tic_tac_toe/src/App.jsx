import { useEffect, useMemo, useRef, useState } from 'react'
import { useTizenKeys } from './hooks/useTizenKeys'
import './App.css'

/**
 * Game helpers and constants
 */
const EMPTY = null
const X = 'X'
const O = 'O'

const WIN_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // columns
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
]

function calcWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }
  return null
}

function isBoardFull(board) {
  return board.every((c) => c !== EMPTY)
}

// Inline SVG icons (lightweight, no external deps)
function KnightIcon({ title = 'Knight', className = '', color = 'currentColor' }) {
  // Simplified chess knight SVG path
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <title>{title}</title>
      <path
        d="M20 54h28v4H16v-4l6-6v-8c0-4 3-7 7-7h3c2 0 4-2 4-4 0-5-9-10-9-16 0-5 4-9 9-9 6 0 10 5 10 11 0 3-1 6-3 8 3 1 5 4 5 7 0 5-4 9-9 9h-1c-2 0-3 1-3 3v7l-6 6z"
        fill={color}
      />
    </svg>
  )
}

function QueenIcon({ title = 'Queen', className = '', color = 'currentColor' }) {
  // Simplified chess queen SVG path
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <title>{title}</title>
      <path
        d="M12 50c6-4 12-6 20-6s14 2 20 6l-2 8H14l-2-8zm40-26l-6-6-6 6-6-10-6 10-6-6-6 6 8 16h20l8-16z"
        fill={color}
      />
      <rect x="18" y="58" width="28" height="4" fill={color} />
    </svg>
  )
}

// PUBLIC_INTERFACE
function App() {
  /** This is the main Tic Tac Toe application component for Tizen web/React. */

  // Game state
  const [board, setBoard] = useState(Array(9).fill(EMPTY))
  const [current, setCurrent] = useState(X)
  const [gameOver, setGameOver] = useState(false)
  const [winningLine, setWinningLine] = useState([])
  const [focusIndex, setFocusIndex] = useState(0)

  // Refs for cell buttons to manage programmatic focus
  const cellRefs = useRef(Array.from({ length: 9 }, () => null))
  const statusLiveRef = useRef(null)

  const status = useMemo(() => {
    const result = calcWinner(board)
    if (result) return `${result.winner === X ? 'Knight' : 'Queen'} wins!`
    if (isBoardFull(board)) return 'Draw!'
    return `Player ${current === X ? 'Knight' : 'Queen'}'s turn`
  }, [board, current])

  // Update ARIA live region without causing layout shift
  useEffect(() => {
    if (statusLiveRef.current) {
      statusLiveRef.current.textContent = status
    }
  }, [status])

  // Check for game end after each move
  useEffect(() => {
    const result = calcWinner(board)
    if (result) {
      setGameOver(true)
      setWinningLine(result.line)
      return
    }
    if (isBoardFull(board)) {
      setGameOver(true)
    }
  }, [board])

  // Keyboard / remote navigation using our Tizen remote hook
  useTizenKeys({
    onLeft: () => moveFocus(-1, 'h'),
    onRight: () => moveFocus(1, 'h'),
    onUp: () => moveFocus(-1, 'v'),
    onDown: () => moveFocus(1, 'v'),
    onEnter: () => handlePlace(focusIndex),
    onBack: () => {
      // Optional: Could map to restart or no-op.
      // For now, do nothing to avoid accidental resets.
    },
  })

  function moveFocus(step, axis) {
    // grid positions r,c
    const r = Math.floor(focusIndex / 3)
    const c = focusIndex % 3
    let nr = r
    let nc = c
    if (axis === 'h') {
      nc = (c + step + 3) % 3
    } else {
      nr = (r + step + 3) % 3
    }
    const ni = nr * 3 + nc
    setFocusIndex(ni)
    setTimeout(() => {
      cellRefs.current[ni]?.focus()
    }, 0)
  }

  function handlePlace(index) {
    if (gameOver) return
    if (board[index] !== EMPTY) return

    setBoard((prev) => {
      const next = prev.slice()
      next[index] = current
      return next
    })
    setCurrent((prev) => (prev === X ? O : X))
  }

  function restart() {
    setBoard(Array(9).fill(EMPTY))
    setCurrent(X)
    setGameOver(false)
    setWinningLine([])
    setFocusIndex(0)
    // move focus to first cell after reset
    setTimeout(() => {
      cellRefs.current[0]?.focus()
    }, 0)
  }

  function cellAriaLabel(i) {
    const row = Math.floor(i / 3) + 1
    const col = (i % 3) + 1
    const val = board[i]
    const content = val ? (val === X ? 'Knight' : 'Queen') : 'empty'
    return `Row ${row} Column ${col}, ${content}`
  }

  const hasWinner = winningLine.length > 0
  const isDraw = !hasWinner && gameOver

  const badgeClass = hasWinner ? 'badge win' : isDraw ? 'badge draw' : 'badge'

  return (
    <div className="tv-app">
      <div className="app-container" role="application" aria-label="Tic Tac Toe game">
        {/* Header */}
        <header className="header">
          <h1 className="title">Tic Tac Toe</h1>
          <div className="status" aria-live="off">
            <span className={badgeClass}>
              {hasWinner
                ? 'Winner'
                : isDraw
                ? 'Draw'
                : `Player ${current === X ? 'Knight' : 'Queen'}`}
            </span>
            <span>{status}</span>
          </div>
          {/* ARIA live region for SR only updates, prevents layout shift */}
          <div
            ref={statusLiveRef}
            className="status-region"
            aria-live="polite"
            aria-atomic="true"
          />
        </header>

        {/* Board */}
        <main className="board-wrapper">
          <section
            className="board"
            role="grid"
            aria-label="3 by 3 tic tac toe board"
          >
            {board.map((cell, i) => {
              const isWinning = winningLine.includes(i)
              const isX = cell === X
              const isO = cell === O
              const filled = cell !== EMPTY
              const disabled = filled || gameOver
              const className =
                'cell' +
                (isWinning ? ' winning' : '') +
                (isX ? ' x' : '') +
                (isO ? ' o' : '') +
                (filled ? ' filled' : '')

              const iconColor = isX ? 'var(--primary)' : '#0ea5e9'

              return (
                <button
                  key={i}
                  ref={(el) => (cellRefs.current[i] = el)}
                  role="gridcell"
                  className={className}
                  aria-label={cellAriaLabel(i)}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => handlePlace(i)}
                  onFocus={() => setFocusIndex(i)}
                  tabIndex={i === focusIndex ? 0 : -1}
                >
                  <span className="cell-content" aria-hidden={filled ? 'true' : 'false'}>
                    {cell === X ? (
                      <KnightIcon
                        title="Knight"
                        className="piece-svg"
                        color={iconColor}
                      />
                    ) : cell === O ? (
                      <QueenIcon
                        title="Queen"
                        className="piece-svg"
                        color={iconColor}
                      />
                    ) : (
                      ''
                    )}
                  </span>
                </button>
              )
            })}
          </section>
        </main>

        {/* Controls */}
        <footer className="footer">
          <button
            className="btn"
            onClick={restart}
            aria-label="Restart game"
          >
            Restart
          </button>
        </footer>
      </div>
    </div>
  )
}

export default App
