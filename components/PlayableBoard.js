'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function normalizeFen(fen) {
  // Strip halfmove clock and fullmove number so the same board position
  // matches regardless of when it was reached in the game
  return fen.split(' ').slice(0, 4).join(' ');
}

export function makeGhostMove(fen, ghostBook) {
  const normalizedFen = normalizeFen(fen);
  const moves = ghostBook[normalizedFen];
  if (!moves) return null;

  const total = Object.values(moves).reduce((sum, count) => sum + count, 0);
  let threshold = Math.random() * total;

  for (const [move, count] of Object.entries(moves)) {
    threshold -= count;
    if (threshold <= 0) return move;
  }
  return null;
}

// --- Lichess mpchess Piece Set ---

const LICHESS_PIECE_CDN = 'https://lichess1.org/assets/piece/icpieces';

const customPieces = Object.fromEntries(
  ['P', 'R', 'N', 'B', 'Q', 'K'].flatMap((piece) => [
    [`w${piece}`, ({ squareWidth }) => (
      <img src={`${LICHESS_PIECE_CDN}/w${piece}.svg`} width={squareWidth} height={squareWidth} alt={`w${piece}`} style={{ pointerEvents: 'none' }} />
    )],
    [`b${piece}`, ({ squareWidth }) => (
      <img src={`${LICHESS_PIECE_CDN}/b${piece}.svg`} width={squareWidth} height={squareWidth} alt={`b${piece}`} style={{ pointerEvents: 'none' }} />
    )],
  ])
);

// --- End Pieces ---

export default function PlayableBoard({ ghostBook = null, playerColor = 'black', onGameUpdate = null }) {
  const [game, setGame] = useState(new Chess());
  const [stockfish, setStockfish] = useState(null);
  const [engineReady, setEngineReady] = useState(false);
  const gameRef = useRef(game);
  const playerColorRef = useRef(playerColor);
  const moveTimeoutRef = useRef(null);
  const searchActiveRef = useRef(false);
  // Track full move history separately — new Chess(fen) loses history,
  // so game.history() only ever returns the last move
  const moveHistoryRef = useRef([]);

  // Keep refs in sync so async callbacks always see latest state
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);

  // Helper: record a move in our history and update game state
  function commitMove(gameCopy, moveSan) {
    moveHistoryRef.current = [...moveHistoryRef.current, moveSan];
    setGame(gameCopy);
  }

  // Notify parent of game state changes
  useEffect(() => {
    if (onGameUpdate) {
      let result = null;
      if (game.isGameOver()) {
        if (game.isCheckmate()) result = 'checkmate';
        else if (game.isStalemate()) result = 'stalemate';
        else if (game.isThreefoldRepetition()) result = 'repetition';
        else if (game.isInsufficientMaterial()) result = 'insufficient';
        else if (game.isDraw()) result = 'draw';
      }
      onGameUpdate({
        turn: game.turn(),
        moves: moveHistoryRef.current,
        isGameOver: game.isGameOver(),
        result,
        fen: game.fen(),
      });
    }
  }, [game, onGameUpdate]);

  // Initialize Stockfish with proper UCI handshake
  useEffect(() => {
    const worker = new Worker('/stockfish/stockfish.js');

    worker.onmessage = (event) => {
      const data = typeof event.data === 'string' ? event.data : String(event.data);

      if (data === 'uciok') {
        worker.postMessage('isready');
        return;
      }

      if (data === 'readyok') {
        setEngineReady(true);
        return;
      }

      if (!data.startsWith('bestmove')) return;

      searchActiveRef.current = false;

      const bestMove = data.split(' ')[1];
      if (!bestMove || bestMove === '(none)') return;

      const currentGame = gameRef.current;
      const playerTurn = playerColorRef.current === 'white' ? 'w' : 'b';

      // Ignore stale responses (e.g. from a previous `stop` command)
      if (currentGame.turn() === playerTurn || currentGame.isGameOver()) return;

      // Clear safety timeout only after validating this is a real move
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = null;
      }

      try {
        const gameCopy = new Chess(currentGame.fen());
        const result = gameCopy.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.length > 4 ? bestMove.substring(4, 5) : 'q',
        });
        moveHistoryRef.current = [...moveHistoryRef.current, result.san];
        setGame(gameCopy);
      } catch (error) {
        console.error('Stockfish move failed:', bestMove, error);
        // Fallback: make a random legal move so the game never freezes
        const currentGame = gameRef.current;
        const moves = currentGame.moves();
        if (moves.length > 0) {
          const gameCopy = new Chess(currentGame.fen());
          const randomSan = moves[Math.floor(Math.random() * moves.length)];
          gameCopy.move(randomSan);
          moveHistoryRef.current = [...moveHistoryRef.current, randomSan];
          setGame(gameCopy);
        }
      }
    };

    worker.onerror = (error) => {
      console.error('Stockfish worker error:', error);
    };

    worker.postMessage('uci');
    setStockfish(worker);

    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      worker.terminate();
      setEngineReady(false);
      searchActiveRef.current = false;
    };
  }, []);

  // Engine move logic
  useEffect(() => {
    const playerTurn = playerColor === 'white' ? 'w' : 'b';
    if (game.isGameOver() || game.turn() === playerTurn) return;
    if (!stockfish || !engineReady) return;

    const timeout = setTimeout(() => {
      const ghostMove = ghostBook ? makeGhostMove(game.fen(), ghostBook) : null;

      if (ghostMove) {
        try {
          const gameCopy = new Chess(game.fen());
          const result = gameCopy.move(ghostMove);
          commitMove(gameCopy, result.san);
          return;
        } catch (error) {
          console.error('Ghost move failed, falling back to Stockfish:', ghostMove, error);
        }
      }

      // Stockfish fallback
      if (searchActiveRef.current) {
        stockfish.postMessage('stop');
      }
      stockfish.postMessage(`position fen ${game.fen()}`);
      stockfish.postMessage('go depth 10');
      searchActiveRef.current = true;

      // Safety timeout: if no bestmove within 5s, make a random legal move
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        const currentGame = gameRef.current;
        const pTurn = playerColorRef.current === 'white' ? 'w' : 'b';
        if (currentGame.turn() !== pTurn && !currentGame.isGameOver()) {
          console.warn('Stockfish response timeout — making random legal move');
          const moves = currentGame.moves();
          if (moves.length > 0) {
            const gameCopy = new Chess(currentGame.fen());
            const randomSan = moves[Math.floor(Math.random() * moves.length)];
            gameCopy.move(randomSan);
            moveHistoryRef.current = [...moveHistoryRef.current, randomSan];
            setGame(gameCopy);
          }
        }
      }, 5000);
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = null;
      }
    };
  }, [game, ghostBook, stockfish, playerColor, engineReady]);

  function onDrop(sourceSquare, targetSquare) {
    // Prevent moves when it's not the player's turn
    const playerTurn = playerColor === 'white' ? 'w' : 'b';
    if (game.turn() !== playerTurn) return false;

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      commitMove(gameCopy, move.san);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Checkmate indicator state
  const [checkmateSquare, setCheckmateSquare] = useState(null);

  useEffect(() => {
    if (game.isCheckmate()) {
      const board = game.board();
      const kingColor = game.turn(); // side that is checkmated
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === kingColor) {
            setCheckmateSquare(String.fromCharCode(97 + f) + (8 - r));
            return;
          }
        }
      }
    } else {
      setCheckmateSquare(null);
    }
  }, [game]);

  // External coordinate labels based on orientation
  const isBlack = playerColor === 'black';
  const ranks = isBlack ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = isBlack ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const coordStyle = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#9ca3af',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes checkmate-fade-in {
          from { opacity: 0; transform: translate(-50%, -120%); }
          to { opacity: 1; transform: translate(-50%, -140%); }
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr',
          gridTemplateRows: '1fr 20px',
        }}
      >
        {/* Rank labels (left column) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ranks.map((r) => (
            <div key={r} style={{ ...coordStyle, flex: 1 }}>{r}</div>
          ))}
        </div>

        {/* Board */}
        <div style={{ position: 'relative' }}>
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            customPieces={customPieces}
            customLightSquareStyle={{ backgroundColor: '#EBF0F7' }}
            customDarkSquareStyle={{ backgroundColor: '#2563eb' }}
            customDropSquareStyle={{ boxShadow: 'inset 0 0 0 4px #2563eb' }}
            animationDuration={200}
            showBoardNotation={false}
          />
          {checkmateSquare && (() => {
            const fileIdx = checkmateSquare.charCodeAt(0) - 97;
            const rankIdx = parseInt(checkmateSquare[1]) - 1;
            const col = isBlack ? 7 - fileIdx : fileIdx;
            const row = isBlack ? rankIdx : 7 - rankIdx;
            const topPct = row * 12.5 + 6.25;
            const leftPct = col * 12.5 + 6.25;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  transform: 'translate(-50%, -140%)',
                  background: '#000',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '3px 8px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                  animation: 'checkmate-fade-in 0.3s ease-out',
                }}
              >
                CHECKMATE
              </div>
            );
          })()}
        </div>

        {/* Spacer (bottom-left corner) */}
        <div />

        {/* File labels (bottom row) */}
        <div style={{ display: 'flex' }}>
          {files.map((f) => (
            <div key={f} style={{ ...coordStyle, flex: 1 }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
