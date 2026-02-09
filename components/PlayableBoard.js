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

export function getGhostStats(fen, ghostBook) {
  if (!ghostBook) return null;
  const normalizedFen = normalizeFen(fen);
  const moves = ghostBook[normalizedFen];
  if (!moves) return null;

  const total = Object.values(moves).reduce((sum, count) => sum + count, 0);
  const entries = Object.entries(moves)
    .map(([move, count]) => ({ move, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  return { total, entries };
}

// --- Illegal Move Sound ---

let _audioCtx = null;
function playIllegalMoveSound() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    _audioCtx = new AC();
  }
  if (_audioCtx.state !== 'running') _audioCtx.resume().catch(() => {});
  const now = _audioCtx.currentTime + 0.02;
  const o = _audioCtx.createOscillator();
  const g = _audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(200, now);
  o.frequency.linearRampToValueAtTime(150, now + 0.12);
  o.connect(g);
  g.connect(_audioCtx.destination);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.06, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  o.start(now);
  o.stop(now + 0.12);
  o.onended = () => { o.disconnect(); g.disconnect(); };
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

// --- Captured Pieces ---

const PIECE_ORDER = ['q', 'r', 'b', 'n', 'p'];
const STARTING_PIECES = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };

function getCapturedPieces(game) {
  const board = game.board();
  const count = { w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 }, b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 } };

  for (const row of board) {
    for (const piece of row) {
      if (piece) count[piece.color][piece.type]++;
    }
  }

  const captured = { w: [], b: [] };
  for (const type of PIECE_ORDER) {
    for (let i = 0; i < Math.max(0, STARTING_PIECES[type] - count.w[type]); i++) captured.w.push(type);
    for (let i = 0; i < Math.max(0, STARTING_PIECES[type] - count.b[type]); i++) captured.b.push(type);
  }
  return captured;
}

function CapturedRow({ pieces, color }) {
  if (pieces.length === 0) return <div style={{ height: 24 }} />;
  const prefix = color === 'w' ? 'w' : 'b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 24, gap: 0 }}>
      {pieces.map((type, i) => (
        <img
          key={`${type}-${i}`}
          src={`${LICHESS_PIECE_CDN}/${prefix}${type.toUpperCase()}.svg`}
          width={22}
          height={22}
          alt={`${prefix}${type}`}
          style={{ opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

// --- End Pieces ---

// --- Napoleon: Remusat Opening Line (1804) ---
// Each entry is the normalized FEN (white to move) and Napoleon's response.
// Built from the Napoleon vs Madame de Remusat game.
const REMUSAT_LINE = [
  { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', move: 'Nc3' },
  { fen: 'rnbqkbnr/pppp1ppp/8/4p3/8/2N5/PPPPPPPP/R1BQKBNR w KQkq -', move: 'Nf3' },
  { fen: 'rnbqkbnr/ppp2ppp/3p4/4p3/8/2N2N2/PPPPPPPP/R1BQKB1R w KQkq -', move: 'e4' },
  { fen: 'rnbqkbnr/ppp3pp/3p4/4pp2/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq -', move: 'h3' },
  { fen: 'rnbqkbnr/ppp3pp/3p4/4p3/4p3/2N2N1P/PPPP1PP1/R1BQKB1R w KQkq -', move: 'Nxe4' },
  { fen: 'r1bqkbnr/ppp3pp/2np4/4p3/4N3/5N1P/PPPP1PP1/R1BQKB1R w KQkq -', move: 'Nfg5' },
  { fen: 'r1bqkbnr/ppp3pp/2n5/3pp1N1/4N3/7P/PPPP1PP1/R1BQKB1R w KQkq -', move: 'Qh5+' },
  { fen: 'r1bqkbnr/ppp4p/2n3p1/3pp1NQ/4N3/7P/PPPP1PP1/R1B1KB1R w KQkq -', move: 'Qf3' },
  { fen: 'r1bqkb1r/ppp4p/2n3pn/3pp1N1/4N3/5Q1P/PPPP1PP1/R1B1KB1R w KQkq -', move: 'Nf6+' },
  { fen: 'r1bq1b1r/ppp1k2p/2n2Npn/3pp1N1/8/5Q1P/PPPP1PP1/R1B1KB1R w KQ -', move: 'Nxd5+' },
  { fen: 'r1bq1b1r/ppp4p/2nk2pn/3Np1N1/8/5Q1P/PPPP1PP1/R1B1KB1R w KQ -', move: 'Ne4+' },
  { fen: 'r1bq1b1r/ppp4p/2n3pn/3kp3/4N3/5Q1P/PPPP1PP1/R1B1KB1R w KQ -', move: 'Bc4+' },
  { fen: 'r1bq1b1r/ppp4p/2n3pn/4p3/2k1N3/5Q1P/PPPP1PP1/R1B1K2R w KQ -', move: 'Qb3+' },
  { fen: 'r1bq1b1r/ppp4p/2n3pn/4p3/3kN3/1Q5P/PPPP1PP1/R1B1K2R w KQ -', move: 'Qd3#' },
];

export default function PlayableBoard({ ghostBook = null, playerColor = 'black', onGameUpdate = null, onAIMove = null, onPlayerMove = null, displayPosition = null, napoleonMode = false }) {
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
  const [lastMove, setLastMove] = useState(null);
  const onAIMoveRef = useRef(onAIMove);
  const onPlayerMoveRef = useRef(onPlayerMove);

  // Napoleon mode refs
  const remusatActiveRef = useRef(false);
  const candidatesRef = useRef([]);

  // Keep refs in sync so async callbacks always see latest state
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { onAIMoveRef.current = onAIMove; }, [onAIMove]);
  useEffect(() => { onPlayerMoveRef.current = onPlayerMove; }, [onPlayerMove]);

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
        if (napoleonMode) {
          worker.postMessage('setoption name Contempt value 100');
          worker.postMessage('setoption name MultiPV value 3');
        }
        worker.postMessage('isready');
        return;
      }

      if (data === 'readyok') {
        setEngineReady(true);
        return;
      }

      // Napoleon mode: collect MultiPV candidate info lines
      if (napoleonMode && data.startsWith('info') && data.includes('multipv') && data.includes(' pv ')) {
        const pvMatch = data.match(/multipv (\d+)/);
        const scoreMatch = data.match(/score cp (-?\d+)/);
        const pvMoves = data.match(/ pv (.+)/);
        if (pvMatch && scoreMatch && pvMoves) {
          const pvNum = parseInt(pvMatch[1]);
          const score = parseInt(scoreMatch[1]);
          const firstMove = pvMoves[1].split(' ')[0];
          // Store/update candidate for this PV number
          const existing = candidatesRef.current;
          const idx = existing.findIndex(c => c.pv === pvNum);
          const entry = { pv: pvNum, score, uci: firstMove };
          if (idx >= 0) existing[idx] = entry;
          else existing.push(entry);
        }
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
        let chosenUci = bestMove;

        // Napoleon mode: pick the most aggressive candidate within 150cp of the best
        if (napoleonMode && candidatesRef.current.length > 1) {
          const candidates = [...candidatesRef.current].sort((a, b) => b.score - a.score);
          const bestScore = candidates[0].score;
          const viable = candidates.filter(c => bestScore - c.score <= 150);

          if (viable.length > 1) {
            // Score aggressiveness for each viable candidate
            let bestAggression = -1;
            let bestCandidate = viable[0];

            for (const cand of viable) {
              try {
                const probe = new Chess(currentGame.fen());
                const m = probe.move({ from: cand.uci.substring(0, 2), to: cand.uci.substring(2, 4), promotion: cand.uci.length > 4 ? cand.uci.substring(4, 5) : 'q' });
                if (!m) continue;
                let aggro = 0;
                if (m.san.includes('+') || m.san.includes('#')) aggro += 5;
                if (m.piece === 'q') aggro += 3;
                if (m.captured) aggro += 2;
                if (m.piece === 'p' && m.to[1] >= '5') aggro += 1;
                if (aggro > bestAggression) {
                  bestAggression = aggro;
                  bestCandidate = cand;
                }
              } catch (_) {}
            }
            chosenUci = bestCandidate.uci;
          }
        }
        candidatesRef.current = [];

        const gameCopy = new Chess(currentGame.fen());
        const result = gameCopy.move({
          from: chosenUci.substring(0, 2),
          to: chosenUci.substring(2, 4),
          promotion: chosenUci.length > 4 ? chosenUci.substring(4, 5) : 'q',
        });
        moveHistoryRef.current = [...moveHistoryRef.current, result.san];
        setLastMove({ from: result.from, to: result.to });
        setGame(gameCopy);
        if (onAIMoveRef.current) {
          onAIMoveRef.current({ move: result.san, source: 'stockfish', ghostData: null, moveNumber: moveHistoryRef.current.length });
        }
      } catch (error) {
        console.error('Stockfish move failed:', bestMove, error);
        // Fallback: make a random legal move so the game never freezes
        const currentGame = gameRef.current;
        const moves = currentGame.moves({ verbose: true });
        if (moves.length > 0) {
          const gameCopy = new Chess(currentGame.fen());
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          gameCopy.move(randomMove.san);
          moveHistoryRef.current = [...moveHistoryRef.current, randomMove.san];
          setLastMove({ from: randomMove.from, to: randomMove.to });
          setGame(gameCopy);
          if (onAIMoveRef.current) {
            onAIMoveRef.current({ move: randomMove.san, source: 'stockfish', ghostData: null, moveNumber: moveHistoryRef.current.length });
          }
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
      // Napoleon mode: try Remusat opening line first
      if (napoleonMode) {
        const currentFen = normalizeFen(game.fen());

        // On first white move, roll 45/55 for Remusat vs ghost book
        if (moveHistoryRef.current.length === 0) {
          remusatActiveRef.current = Math.random() < 0.45;
        }

        // If Remusat is active, try to follow the line
        if (remusatActiveRef.current) {
          const lineEntry = REMUSAT_LINE.find(e => e.fen === currentFen);
          if (lineEntry) {
            try {
              const gameCopy = new Chess(game.fen());
              const result = gameCopy.move(lineEntry.move);
              setLastMove({ from: result.from, to: result.to });
              commitMove(gameCopy, result.san);
              if (onAIMoveRef.current) {
                onAIMoveRef.current({ move: result.san, source: 'remusat', ghostData: null, moveNumber: moveHistoryRef.current.length });
              }
              return;
            } catch (error) {
              console.error('Remusat move failed, falling through:', lineEntry.move, error);
              remusatActiveRef.current = false;
            }
          } else {
            // Position diverged from Remusat line
            remusatActiveRef.current = false;
          }
        }
      }

      const ghostMove = ghostBook ? makeGhostMove(game.fen(), ghostBook) : null;

      if (ghostMove) {
        try {
          const ghostData = getGhostStats(game.fen(), ghostBook);
          const gameCopy = new Chess(game.fen());
          const result = gameCopy.move(ghostMove);
          setLastMove({ from: result.from, to: result.to });
          commitMove(gameCopy, result.san);
          if (onAIMoveRef.current) {
            onAIMoveRef.current({ move: result.san, source: 'ghost', ghostData, moveNumber: moveHistoryRef.current.length });
          }
          return;
        } catch (error) {
          console.error('Ghost move failed, falling back to Stockfish:', ghostMove, error);
        }
      }

      // Stockfish fallback
      candidatesRef.current = [];
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
          const moves = currentGame.moves({ verbose: true });
          if (moves.length > 0) {
            const gameCopy = new Chess(currentGame.fen());
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            gameCopy.move(randomMove.san);
            moveHistoryRef.current = [...moveHistoryRef.current, randomMove.san];
            setLastMove({ from: randomMove.from, to: randomMove.to });
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
  }, [game, ghostBook, stockfish, playerColor, engineReady, napoleonMode]);

  function tryMove(sourceSquare, targetSquare) {
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

      setLastMove({ from: move.from, to: move.to });
      commitMove(gameCopy, move.san);
      setSelectedSquare(null);
      setLegalMoveSquares({});
      if (onPlayerMoveRef.current) {
        onPlayerMoveRef.current({
          move: move.san,
          isCapture: move.san.includes('x'),
          isCheck: move.san.includes('+') || move.san.includes('#'),
          moveNumber: moveHistoryRef.current.length,
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    const moved = tryMove(sourceSquare, targetSquare);
    if (!moved) playIllegalMoveSound();
    return moved;
  }

  // Click-to-move
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState({});

  function onSquareClick(square) {
    const playerTurn = playerColor === 'white' ? 'w' : 'b';
    if (game.turn() !== playerTurn || game.isGameOver()) return;

    // If a piece is already selected, try to move to the clicked square
    if (selectedSquare) {
      const moved = tryMove(selectedSquare, square);
      if (moved) return;
      // If the move failed and they didn't click another of their own pieces, play illegal sound
      const piece = game.get(square);
      if (!piece || piece.color !== playerTurn) {
        playIllegalMoveSound();
        setSelectedSquare(null);
        setLegalMoveSquares({});
        return;
      }
    }

    // Select a piece (only player's own pieces)
    const piece = game.get(square);
    if (piece && piece.color === playerTurn) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      const highlights = {};
      moves.forEach((m) => {
        const isCapture = game.get(m.to) || m.flags.includes('e');
        highlights[m.to] = {
          background: isCapture
            ? 'radial-gradient(circle, rgba(0,0,0,0.3) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      });
      setLegalMoveSquares(highlights);
    } else {
      setSelectedSquare(null);
      setLegalMoveSquares({});
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

  const isReviewing = displayPosition !== null;
  const isBlack = playerColor === 'black';

  const captured = getCapturedPieces(game);
  // Top of board = opponent side, bottom = player side
  // Show pieces each side has captured (opponent's pieces they took)
  const topCaptured = isBlack ? captured.b : captured.w;   // white (AI) captured these black pieces
  const bottomCaptured = isBlack ? captured.w : captured.b; // black (player) captured these white pieces
  const topColor = isBlack ? 'b' : 'w';
  const bottomColor = isBlack ? 'w' : 'b';

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes checkmate-fade-in {
          from { opacity: 0; transform: translate(-50%, -120%); }
          to { opacity: 1; transform: translate(-50%, -140%); }
        }
      `}</style>
      <div style={{ marginBottom: 4 }}>
        <CapturedRow pieces={topCaptured} color={topColor} />
      </div>
      <div style={{ position: 'relative' }}>
        <Chessboard
          position={isReviewing ? displayPosition : game.fen()}
          onPieceDrop={isReviewing ? () => false : onDrop}
          onSquareClick={isReviewing ? () => {} : onSquareClick}
          boardOrientation={playerColor}
          customPieces={customPieces}
          customLightSquareStyle={{ backgroundColor: '#EBF0F7' }}
          customDarkSquareStyle={{ backgroundColor: '#2563eb' }}
          customDropSquareStyle={{ boxShadow: 'inset 0 0 0 4px #2563eb' }}
          customSquareStyles={isReviewing ? {} : {
            ...(lastMove ? {
              [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
              [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
            } : {}),
            ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.6)' } } : {}),
            ...legalMoveSquares,
          }}
          isDraggablePiece={isReviewing ? () => false : ({ piece }) => piece.startsWith(playerColor === 'white' ? 'w' : 'b')}
          animationDuration={200}
          showBoardNotation={true}
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
      <div style={{ marginTop: 4 }}>
        <CapturedRow pieces={bottomCaptured} color={bottomColor} />
      </div>
    </div>
  );
}
