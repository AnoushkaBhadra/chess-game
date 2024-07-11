import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function App() {
  const [game, setGame] = useState(new Chess()); // Starting a new game
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [promotion, setPromotion] = useState(null); // Track promotion state
  const [pendingMove, setPendingMove] = useState(null); // Track the pending move

  // Function to safely mutate the game state
  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  // Function to perform a move after the user
  function makeRandomMove() {
    const possibleMoves = game.moves();

    if (game.game_over() || game.in_draw() || possibleMoves.length === 0) {
      setGameOver(true);
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      setWinner(winner);
      return;
    }

    // Play a random move
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    safeGameMutate((game) => {
      game.move(possibleMoves[randomIndex]);
    });
  }

  function onDrop(source, target) {
    if (gameOver) return false;

    // Make a temporary move to validate it
    const move = game.move({
      from: source,
      to: target,
      promotion: 'q', // Default promotion to queen
    });

    // Illegal move
    if (move === null) return false;

    // Check if the move involves a pawn reaching the last rank
    if (move.flags.includes('p')) {
      // Undo the temporary move and show promotion dialog
      game.undo();
      setPendingMove({ source, target });
      setPromotion(true);
      return false;
    }

    // Valid move
    setTimeout(makeRandomMove, 300);
    return true;
  }

  function handlePromotion(choice) {
    if (!pendingMove) return;

    safeGameMutate((game) => {
      game.move({
        from: pendingMove.source,
        to: pendingMove.target,
        promotion: choice,
      });
    });

    setPromotion(null);
    setPendingMove(null);
    setTimeout(makeRandomMove, 300);
  }

  function restartGame() {
    setGame(new Chess());
    setGameOver(false);
    setWinner(null);
  }

  // Listening for enter key press to restart the game
  useEffect(() => {
    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        restartGame();
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="App">
      <Chessboard
        position={game.fen()}
        onPieceDrop={(source, target) => onDrop(source, target)}
      />
      {gameOver && <h2>Game Over! Winner: {winner}</h2>}
      <button onClick={restartGame}>Restart Game</button>
      <p>Press "Enter" to restart the game.</p>
      {promotion && (
        <div className="promotion-dialog">
          <h3>Choose a piece for promotion:</h3>
          <button onClick={() => handlePromotion('q')}>Queen</button>
          <button onClick={() => handlePromotion('r')}>Rook</button>
          <button onClick={() => handlePromotion('b')}>Bishop</button>
          <button onClick={() => handlePromotion('n')}>Knight</button>
        </div>
      )}
    </div>
  );
}

export default App;
