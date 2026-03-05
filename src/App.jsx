import { useState, useEffect, useCallback } from 'react';
import './App.css';

// --- FUNCIONES DE LÓGICA (Helpers) ---
const createBoard = (size, mines) => {
  let board = Array(size).fill(null).map(() => Array(size).fill(null).map(() => ({
    isMine: false, neighborMines: 0, revealed: false, flagged: false
  })));

  // Ubicar minas aleatoriamente
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    let r = Math.floor(Math.random() * size);
    let c = Math.floor(Math.random() * size);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calcular números adyacentes
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c].isMine) {
        let mines = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc].isMine) {
              mines++;
            }
          }
        }
        board[r][c].neighborMines = mines;
      }
    }
  }
  return board;
};

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [size, setSize] = useState(8);
  const [mines, setMines] = useState(10);
  const [board, setBoard] = useState(() => createBoard(size, mines));
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [timer, setTimer] = useState(0);
  const [active, setActive] = useState(false);
  const [bestTime, setBestTime] = useState(() => localStorage.getItem('bestTime') || Infinity);

  // Reiniciar
  const resetGame = useCallback(() => {
    setBoard(createBoard(size, mines));
    setGameOver(false);
    setWin(false);
    setTimer(0);
    setActive(false);
  }, [size, mines]);

  useEffect(() => resetGame(), [resetGame]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (active && !gameOver && !win) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [active, gameOver, win]);

  // --- LÓGICA CLIC ---
  const handleCellClick = (r, c) => {
    if (gameOver || win || board[r][c].revealed || board[r][c].flagged) return;
    if (!active) setActive(true);

    let newBoard = [...board.map(row => row.map(cell => ({ ...cell })) )];
    
    if (newBoard[r][c].isMine) {
      // Game Over
      newBoard.forEach(row => row.forEach(cell => { if (cell.isMine) cell.revealed = true; }));
      setGameOver(true);
      setActive(false);
    } else {
      // Revelar y expansión (0)
      revealCell(newBoard, r, c, size);
      
      // Chequear victoria
      if (checkWin(newBoard, size, mines)) {
        setWin(true);
        setActive(false);
        if (timer < bestTime) {
          localStorage.setItem('bestTime', timer);
          setBestTime(timer);
        }
      }
    }
    setBoard(newBoard);
  };

  const handleContextMenu = (e, r, c) => {
    e.preventDefault();
    if (gameOver || win || board[r][c].revealed) return;
    let newBoard = [...board.map(row => row.map(cell => ({ ...cell })) )];
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
  };

  // Función recursiva para revelar 0
  const revealCell = (board, r, c, size) => {
    if (r < 0 || r >= size || c < 0 || c >= size || board[r][c].revealed || board[r][c].flagged) return;
    board[r][c].revealed = true;
    if (board[r][c].neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          revealCell(board, r + dr, c + dc, size);
        }
      }
    }
  };

  const checkWin = (board, size, mines) => {
    let unrevealedNonMines = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!board[r][c].isMine && !board[r][c].revealed) unrevealedNonMines++;
      }
    }
    return unrevealedNonMines === 0;
  };

  return (
    <div className="minesweeper-app">
      <h1>Buscaminas</h1>
      <div className="controls">
        <select onChange={(e) => {
          const s = parseInt(e.target.value);
          setSize(s);
          setMines(s === 8 ? 10 : 40);
        }}>
          <option value={8}>Fácil (8x8)</option>
          <option value={16}>Medio (16x16)</option>
        </select>
        <button onClick={resetGame}>Reiniciar</button>
      </div>
      <div className="info">Tiempo: {timer}s | Mejor: {bestTime === Infinity ? '0' : bestTime}s</div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${size}, 30px)` }}>
        {board.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} 
               className={`cell ${cell.revealed ? 'revealed' : ''} ${cell.isMine && gameOver ? 'mine' : ''} ${cell.flagged ? 'flagged' : ''}`}
               onClick={() => handleCellClick(r, c)}
               onContextMenu={(e) => handleContextMenu(e, r, c)}>
            {cell.revealed && !cell.isMine && cell.neighborMines > 0 ? cell.neighborMines : ''}
            {cell.flagged ? '🚩' : ''}
            {cell.revealed && cell.isMine ? '💣' : ''}
          </div>
        )))}
      </div>
      {gameOver && <h2>Game Over</h2>}
      {win && <h2>¡Ganaste!</h2>}
    </div>
  );
}

export default App;
