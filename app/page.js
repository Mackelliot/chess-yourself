'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Cpu, User, Zap, Grid3X3, Crown, X, Upload, Play, AlertCircle, Check, Volume2, VolumeX, MessageSquare, MoreVertical, Flag, RotateCcw, LogOut, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Chess } from 'chess.js';
import PlayableBoard from '../components/PlayableBoard';
import {
  generateIntroMessage,
  generateFirstMoveMessage,
  generateGhostMoveMessage,
  generateStockfishMessage,
  generatePlayerMoveReaction,
  generateGameOverMessage,
  generateResignMessage,
} from '../lib/commentary';

/**
 * UTILS & HOOKS
 */
const useInterval = (callback, delay) => {
  const savedCallback = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

/**
 * THINKING LOADER
 */
const THINKING_MESSAGES = [
  "Analyzing your games...",
  "Studying your opening repertoire...",
  "Learning your questionable sacrifices...",
  "Memorizing your favorite blunders...",
  "Reverse-engineering your brilliance...",
  "Downloading your chess trauma...",
  "Judging your endgame technique...",
  "Finding patterns in your chaos...",
  "Your Sicilian needs work, just saying...",
  "Cataloging every premove gone wrong...",
  "Training your digital doppelganger...",
  "Building a clone worthy of your ELO...",
  "Absorbing decades of chess theory...",
  "Compiling your greatest hits (and misses)...",
  "Teaching AI to play like a human (scary)...",
  "This clone is going to be terrifying...",
  "Extracting pure chess energy...",
  "Almost done, the clone is stretching...",
];

const SHAPE_KEYFRAMES = `
@keyframes morph-shape {
  0%   { border-radius: 4px;  transform: rotate(0deg) scale(1); }
  15%  { border-radius: 50%;  transform: rotate(45deg) scale(0.9); }
  30%  { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(90deg) scale(1.05); }
  45%  { border-radius: 50% 20% 50% 20%; transform: rotate(135deg) scale(0.95); }
  60%  { border-radius: 20% 50% 20% 50% / 50% 20% 50% 20%; transform: rotate(225deg) scale(1.1); }
  75%  { border-radius: 50%; transform: rotate(315deg) scale(0.9); }
  85%  { border-radius: 10% 40% 60% 20% / 50% 30% 40% 60%; transform: rotate(350deg) scale(1.05); }
  100% { border-radius: 4px;  transform: rotate(360deg) scale(1); }
}
`;

const LONG_WAIT_HINTS = [
  'Almost done — turns out you\'re quite the interesting player. Our AI is taking an extra look.',
  'Hang tight — your game history is deeper than most. The clone is studying hard.',
  'Still crunching. You\'ve got a lot of games in there. The clone wants to get this right.',
];

const ThinkingLoader = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const longHintRef = useRef(null);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % THINKING_MESSAGES.length);
    }, 3000);
    const timerInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => { clearInterval(msgInterval); clearInterval(timerInterval); };
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const displayTime = elapsed > 0
    ? minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
    : null;

  let hint = null;
  if (elapsed >= 120) {
    if (!longHintRef.current) {
      longHintRef.current = LONG_WAIT_HINTS[Math.floor(Math.random() * LONG_WAIT_HINTS.length)];
    }
    hint = longHintRef.current;
  } else if (elapsed >= 30) {
    hint = 'This usually takes 1\u20132 minutes.';
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <style>{SHAPE_KEYFRAMES}</style>
      <div
        style={{
          width: 36,
          height: 36,
          backgroundColor: '#2563eb',
          animation: 'morph-shape 4s ease-in-out infinite',
        }}
      />
      <p className="font-mono text-sm text-gray-700 text-center animate-pulse">
        {THINKING_MESSAGES[messageIndex]}
      </p>
      {displayTime && (
        <span className="font-mono text-xs text-gray-400">{displayTime}</span>
      )}
      {hint && (
        <p className="font-mono text-xs text-gray-400 text-center max-w-xs">{hint}</p>
      )}
    </div>
  );
};

/**
 * PIXEL FONT DATA
 */
const CHAR_MAP = {
  'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
  'H': [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
  'E': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
  'S': [[0,1,1,1,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
  'Y': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'R': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,1]],
  'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  'F': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  '_': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
};

// Component to render a single pixel-art character
const PixelChar = ({ char, size = "md" }) => {
  const grid = CHAR_MAP[char] || CHAR_MAP['_'];
  const pixelSize = size === "sm" ? "w-[2px] h-[2px] md:w-[3px] md:h-[3px]" : "w-[3px] h-[3px] md:w-[5px] md:h-[5px]";
  const gapSize = "gap-[1px]";

  return (
    <div className={`flex flex-col ${gapSize}`}>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className={`flex ${gapSize}`}>
          {row.map((pixel, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`}
              className={`${pixelSize} ${pixel ? 'bg-blue-600' : 'bg-transparent'} transition-opacity duration-75`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const PixelWord = ({ word }) => (
  <div className="flex gap-2 md:gap-4 items-end">
    {word.split('').map((char, i) => <PixelChar key={i} char={char} />)}
  </div>
);

// --- HEADER ---
const PixelHeader = () => {
  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-start md:items-center py-6 px-6 md:px-12 border-b-4 border-black bg-[#FDFBF7] sticky top-0 z-40">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 md:gap-3">
           <PixelWord word="CHESS" /> 
           <PixelWord word="YOURSELF" />
        </div>
      </div>
      <div className="mt-6 md:mt-0 max-w-xs text-xs md:text-sm font-medium font-mono leading-tight text-right md:text-right text-gray-600">
        <p>
          AI-DRIVEN PLAYSTYLE CLONING.<br/>
          VERSION 2.0.4 (BETA)
        </p>
      </div>
    </header>
  );
};

// --- DYNAMIC GRID ---
const DynamicGrid = () => {
  const rows = 6;
  const cols = 12;
  const [gridState, setGridState] = useState([]);

  useEffect(() => {
    const initialGrid = Array(rows * cols).fill(0).map((_, i) => ({
      id: i,
      active: Math.random() > 0.7,
      shape: Math.floor(Math.random() * 2),
      color: Math.random() > 0.5 ? 'bg-blue-500' : 'bg-indigo-600'
    }));
    setGridState(initialGrid);
  }, []);

  useInterval(() => {
    setGridState(prev => prev.map(cell => {
      if (Math.random() > 0.95) {
        return {
          ...cell,
          active: !cell.active,
          shape: Math.random() > 0.5 ? 0 : 1,
          color: Math.random() > 0.5 ? 'bg-blue-500' : 'bg-indigo-600'
        };
      }
      return cell;
    }));
  }, 200);

  return (
    <div className="w-full overflow-hidden border-y-4 border-black bg-[#FDFBF7]">
      <div 
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${cols}/${rows}` }}
      >
        {gridState.map((cell) => (
          <div 
            key={cell.id} 
            className={`w-full h-full border-[0.5px] border-black/10 flex items-center justify-center transition-all duration-500 ${cell.active ? 'bg-blue-100' : 'bg-transparent'}`}
          >
            {cell.active && (
              <div 
                className={`w-[70%] h-[70%] transition-all duration-300 transform ${cell.color} ${cell.shape === 0 ? 'rounded-none' : 'rounded-full'} ${cell.shape === 0 ? 'rotate-0' : 'rotate-180'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- AUDIO SYSTEM ---
let audioCtx = null;

const initAudio = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state !== 'running') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const playSound = (type) => {
  const ctx = initAudio();
  if (!ctx) return;

  const now = ctx.currentTime + 0.02;

  // Helper to create a tone with smooth envelope
  const tone = (freq, wave, vol, start, dur) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, start);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.start(start);
    o.stop(start + dur);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    return o;
  };

  switch (type) {
    case 'move':
      // Soft tap — quick sine ping
      tone(880, 'sine', 0.04, now, 0.06);
      break;
    case 'capture':
      // Two-note knock — gentle presence
      tone(660, 'sine', 0.05, now, 0.07);
      tone(440, 'triangle', 0.03, now + 0.04, 0.08);
      break;
    case 'check':
      // Soft rising double-ping
      tone(660, 'sine', 0.05, now, 0.1);
      tone(990, 'sine', 0.04, now + 0.08, 0.12);
      break;
    case 'win': {
      // Gentle ascending arpeggio — C5 E5 G5 C6
      const winNotes = [523.25, 659.25, 783.99, 1046.50];
      winNotes.forEach((freq, i) => {
        tone(freq, 'sine', 0.035, now + i * 0.12, 0.25);
      });
      return;
    }
    case 'loss':
      // Soft descending pair
      tone(440, 'sine', 0.04, now, 0.2);
      tone(330, 'triangle', 0.03, now + 0.15, 0.3);
      break;
  }
};

// --- GAME COMPONENTS ---

const MoveList = ({ moves }) => {
  const listRef = useRef(null);
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ num: Math.floor(i / 2) + 1, white: moves[i], black: moves[i + 1] || '' });
  }

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moves]);

  return (
    <div className="border-4 border-black bg-white flex flex-col h-full">
      <div className="font-mono text-xs font-bold px-4 py-3 text-gray-400 border-b-2 border-black/10 flex justify-between shrink-0">
        <span>NOTATION</span>
        <span>{moves.length} MOVES</span>
      </div>
      <div ref={listRef} className="overflow-y-auto flex-1 font-mono text-sm">
        {pairs.length === 0 ? (
          <div className="p-4 text-gray-400 text-xs">Waiting for first move...</div>
        ) : (
          pairs.map((pair) => (
            <div key={pair.num} className={`flex items-center border-b border-black/5 ${pair.num % 2 === 0 ? 'bg-gray-50' : ''}`}>
              <span className="w-10 text-center text-xs text-gray-400 py-2 shrink-0 border-r border-black/5">{pair.num}.</span>
              <span className="flex-1 px-3 py-2 font-medium">{pair.white}</span>
              <span className="flex-1 px-3 py-2 font-medium text-gray-600">{pair.black}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GLITCH_CHARS = ['x', '*', 'o', '+', '·', '×', '░'];

const AvatarGlitchChar = () => {
  const [glyph, setGlyph] = useState(null);

  useEffect(() => {
    const schedule = () => {
      const delay = 3000 + Math.random() * 8000;
      return setTimeout(() => {
        const char = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        const top = 10 + Math.random() * 75;
        const left = 10 + Math.random() * 75;
        setGlyph({ char, top, left });
        const clearTimer = setTimeout(() => setGlyph(null), 300 + Math.random() * 400);
        const nextTimer = schedule();
        return () => { clearTimeout(clearTimer); clearTimeout(nextTimer); };
      }, delay);
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  if (!glyph) return null;

  return (
    <span
      className="absolute font-mono text-blue-300/40 pointer-events-none select-none"
      style={{
        top: `${glyph.top}%`,
        left: `${glyph.left}%`,
        fontSize: '10px',
        fontWeight: 700,
        zIndex: 4,
        textShadow: '0 0 2px rgba(37,99,235,0.3)',
      }}
    >
      {glyph.char}
    </span>
  );
};

const AvatarImage = ({ avatarUrl, username, size = 16 }) => (
  <div className={`relative shrink-0 crt-container rounded overflow-hidden`}
    style={{ width: size * 4, height: size * 4 }}
  >
    {avatarUrl ? (
      <>
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover crt-avatar" />
        <div className="absolute inset-0 bg-blue-600/50 mix-blend-color" />
        <div className="crt-scanlines" />
        <AvatarGlitchChar />
      </>
    ) : (
      <div className="w-full h-full bg-blue-600 flex items-center justify-center">
        <Cpu size={size > 10 ? 20 : 16} className="text-white" />
      </div>
    )}
  </div>
);

const AICloneChat = ({ message, avatarUrl, username }) => {
  return (
    <>
      {/* Mobile: compact inline bar */}
      <div className="lg:hidden border-4 border-black bg-white flex items-center gap-3 px-3 py-3">
        <AvatarImage avatarUrl={avatarUrl} username={username} size={20} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-xs font-bold truncate">{username}</p>
            <span className="font-mono text-[9px] text-blue-600 shrink-0">CLONE</span>
          </div>
          {message && (
            <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2">
              <p className="font-mono text-xs leading-relaxed text-gray-900">
                {message.text}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: full card */}
      <div className="hidden lg:flex border-4 border-black bg-white flex-col h-full">
        <div className="font-mono text-xs font-bold px-4 py-3 text-gray-400 border-b-2 border-black/10 flex justify-between items-center shrink-0">
          <span>AI CLONE</span>
          <MessageSquare size={14} />
        </div>

        <div className="px-4 py-4 border-b-2 border-black/10 flex items-center gap-3 shrink-0">
          <AvatarImage avatarUrl={avatarUrl} username={username} size={32} />
          <div>
            <p className="font-mono text-xs font-bold truncate max-w-[140px]">{username}</p>
            <p className="font-mono text-[10px] text-blue-600">CLONE ACTIVE</p>
          </div>
        </div>

        <div className="flex-1 flex items-start p-4">
          {message && (
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[95%]">
              <p className="font-mono text-sm leading-relaxed text-gray-900">
                {message.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const GameMenu = ({ soundEnabled, setSoundEnabled, onResign, onRematch, onExit, isGameOver }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 hover:bg-black/5 rounded transition-colors"
        title="Game Menu"
      >
        <MoreVertical size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
          <button
            onClick={() => { onRematch(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm hover:bg-blue-50 transition-colors text-left"
          >
            <RotateCcw size={16} /> New Game
          </button>
          {!isGameOver && (
            <button
              onClick={() => { onResign(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm hover:bg-red-50 text-red-600 transition-colors text-left"
            >
              <Flag size={16} /> Resign
            </button>
          )}
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm hover:bg-blue-50 transition-colors text-left"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button
            onClick={() => { onExit(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm hover:bg-blue-50 transition-colors text-left border-t border-black/10"
          >
            <LogOut size={16} /> Back to Menu
          </button>
        </div>
      )}
    </div>
  );
};

const ChessGameInterface = ({ username, ghostBook, onExit, platform, avatarUrl }) => {
  const [gameState, setGameState] = useState({ turn: 'w', moves: [], isGameOver: false, result: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [boardKey, setBoardKey] = useState(0);
  const [chatMessage, setChatMessage] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const prevMoveCountRef = useRef(0);
  const gameOverCommentedRef = useRef(false);

  // Send intro message on mount
  useEffect(() => {
    setChatMessage({ type: 'system', text: generateIntroMessage() });
  }, []);

  const handleAIMove = React.useCallback((data) => {
    let text;
    if (data.moveNumber === 1) {
      text = generateFirstMoveMessage(data.move, ghostBook);
    } else if (data.source === 'ghost') {
      text = generateGhostMoveMessage(data.move, data.ghostData);
    } else {
      text = generateStockfishMessage(data.move);
    }
    setChatMessage(text ? { type: 'taunt', text } : null);
  }, [ghostBook]);

  const handlePlayerMove = React.useCallback((data) => {
    const text = generatePlayerMoveReaction(data);
    if (text) setChatMessage({ type: 'reaction', text });
  }, []);

  const handleRematch = () => {
    prevMoveCountRef.current = 0;
    prevMoveLenRef.current = 0;
    gameOverCommentedRef.current = false;
    setViewIndex(null);
    setChatMessage({ type: 'system', text: generateIntroMessage() });
    setBoardKey(k => k + 1);
  };

  const handleResign = () => {
    if (gameState.isGameOver) return;
    gameOverCommentedRef.current = true;
    setChatMessage({ type: 'system', text: generateResignMessage() });
    setGameState(prev => ({ ...prev, isGameOver: true, result: 'resignation', turn: 'b' }));
  };

  const handleGameUpdate = React.useCallback((state) => {
    setGameState(state);
  }, []);

  // Auto-return to live when a new move arrives while reviewing
  const prevMoveLenRef = useRef(0);
  useEffect(() => {
    if (gameState.moves.length !== prevMoveLenRef.current) {
      prevMoveLenRef.current = gameState.moves.length;
      if (viewIndex !== null) setViewIndex(null);
    }
  }, [gameState.moves.length, viewIndex]);

  // Reconstruct FEN at viewIndex by replaying moves
  const displayPosition = React.useMemo(() => {
    if (viewIndex === null) return null;
    const g = new Chess();
    const moves = gameState.moves;
    for (let i = 0; i < Math.min(viewIndex, moves.length); i++) {
      g.move(moves[i]);
    }
    return g.fen();
  }, [viewIndex, gameState.moves]);

  // Navigation handlers
  const totalMoves = gameState.moves.length;
  const goToStart = () => { if (totalMoves > 0) setViewIndex(0); };
  const goBack = () => {
    if (viewIndex === null) setViewIndex(Math.max(0, totalMoves - 1));
    else if (viewIndex > 0) setViewIndex(viewIndex - 1);
  };
  const goForward = () => {
    if (viewIndex === null) return;
    if (viewIndex >= totalMoves - 1) setViewIndex(null);
    else setViewIndex(viewIndex + 1);
  };
  const goToEnd = () => { setViewIndex(null); };

  useEffect(() => {
    const unlockAudio = () => {
      const ctx = initAudio();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!gameState.moves) return;
    const moveCount = gameState.moves.length;
    if (moveCount > prevMoveCountRef.current) {
      const lastMove = gameState.moves[moveCount - 1];
      if (soundEnabled) {
        if (lastMove.includes('#')) {
          if (gameState.turn === 'b') playSound('loss');
          else playSound('win');
        }
        else if (lastMove.includes('+')) playSound('check');
        else if (lastMove.includes('x')) playSound('capture');
        else playSound('move');
      }
    }
    prevMoveCountRef.current = moveCount;

    if (gameState.isGameOver && !gameOverCommentedRef.current) {
      gameOverCommentedRef.current = true;
      setChatMessage({ type: 'system', text: generateGameOverMessage(gameState.result, gameState.turn) });
    }
  }, [gameState.moves, soundEnabled, gameState.turn, gameState.isGameOver, gameState.result]);

  const isWhiteTurn = gameState.turn === 'w';
  const turnLabel = gameState.isGameOver
    ? 'GAME OVER'
    : isWhiteTurn ? 'WHITE TO MOVE' : 'YOUR TURN';
  const turnColor = gameState.isGameOver
    ? 'bg-gray-800'
    : isWhiteTurn ? 'bg-black' : 'bg-blue-600';

  return (
    <div className="w-full flex flex-col items-center justify-start py-2 md:py-8 px-2 md:px-6 animate-in fade-in duration-500 min-h-[85vh]">
      {/* Game header — compact on mobile */}
      <div className="flex justify-between w-full max-w-[1200px] mb-2 md:mb-6 items-center border-b-4 border-black pb-2 md:pb-4">
        <div>
           <h2 className="text-lg md:text-3xl font-black uppercase tracking-tighter">Simulation Active</h2>
           <p className="font-mono text-[10px] md:text-sm text-gray-600 hidden md:block">
             OPPONENT: <span className="text-blue-600 font-bold">AI CLONE (WHITE)</span> vs <span className="text-black font-bold">{username} (BLACK)</span>
           </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className={`${turnColor} text-white px-2 md:px-4 py-1 md:py-2 font-mono text-[10px] md:text-sm font-bold uppercase tracking-wider transition-colors`}>
            {turnLabel}
          </div>
          <GameMenu
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            onResign={handleResign}
            onRematch={handleRematch}
            onExit={onExit}
            isGameOver={gameState.isGameOver}
          />
        </div>
      </div>

      {/* Main Game Layout — 3 columns on desktop: Notation | Board | AI Chat */}
      <div className="flex flex-col lg:flex-row gap-2 md:gap-4 items-start justify-center w-full max-w-[1200px] flex-grow">

        {/* AI Clone Chat — above board on mobile, right column on desktop */}
        <div className="w-full lg:w-64 shrink-0 lg:h-[calc(550px+6rem+6px)] order-1 lg:order-3">
          <AICloneChat message={chatMessage} avatarUrl={avatarUrl} username={username} />
        </div>

        {/* Board Column — center */}
        <div className="flex-1 flex flex-col items-center w-full gap-2 md:gap-3 order-2 lg:order-2">
          <div className={`w-full max-w-[100vw] md:max-w-[550px] border-0 md:border-4 bg-[#FDFBF7] transition-all duration-500 ${
            gameState.isGameOver ? 'md:border-black' : isWhiteTurn ? 'md:border-black' : 'md:board-player-turn'
          }`}>
            <PlayableBoard key={boardKey} ghostBook={ghostBook} playerColor="black" onGameUpdate={handleGameUpdate} onAIMove={handleAIMove} onPlayerMove={handlePlayerMove} displayPosition={displayPosition} />
          </div>
          {isWhiteTurn && !gameState.isGameOver && (
            <div className="flex items-center gap-2 font-mono text-xs text-blue-600 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              AI COMPUTING...
            </div>
          )}
          {/* Move navigation bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToStart}
              disabled={totalMoves === 0 || viewIndex === 0}
              className="p-1.5 font-mono border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
              title="Go to start"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={goBack}
              disabled={totalMoves === 0 || viewIndex === 0}
              className="p-1.5 font-mono border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
              title="Previous move"
            >
              <ChevronLeft size={16} />
            </button>
            {viewIndex !== null && (
              <span className="font-mono text-xs text-gray-500 px-2">
                MOVE {viewIndex} / {totalMoves}
              </span>
            )}
            <button
              onClick={goForward}
              disabled={viewIndex === null}
              className="p-1.5 font-mono border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
              title="Next move"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={goToEnd}
              disabled={viewIndex === null}
              className="p-1.5 font-mono border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
              title="Go to latest"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

        {/* Move Notation — left on desktop, below board on mobile */}
        <div className="w-full lg:w-56 shrink-0 h-[200px] lg:h-[calc(550px+6rem+6px)] order-3 lg:order-1">
          <MoveList moves={gameState.moves} />
        </div>
      </div>

      <GameOverModal gameState={gameState} onRematch={handleRematch} onExit={onExit} />
    </div>
  );
};

// --- GAME OVER MODAL ---

const GameOverModal = ({ gameState, onRematch, onExit }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (gameState.isGameOver) {
      const delay = gameState.result === 'checkmate' ? 2000 : 1500;
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [gameState.isGameOver, gameState.result]);

  if (!visible) return null;

  // Player is always black. turn() returns who is checkmated / stalemated.
  const playerWins = gameState.result === 'checkmate' && gameState.turn === 'w';
  const playerLoses = (gameState.result === 'checkmate' && gameState.turn === 'b') || gameState.result === 'resignation';

  let title, message, accent;
  if (playerWins) {
    title = 'YOU WIN';
    message = 'You defeated the clone. Time to raise the bar.';
    accent = 'border-green-500';
  } else if (gameState.result === 'resignation') {
    title = 'YOU RESIGNED';
    message = 'You conceded the game.';
    accent = 'border-red-500';
  } else if (playerLoses) {
    title = 'YOU LOSE';
    message = 'The clone got the better of you this time.';
    accent = 'border-red-500';
  } else {
    title = 'DRAW';
    const reasons = {
      stalemate: 'Stalemate — no legal moves remain.',
      repetition: 'Draw by threefold repetition.',
      insufficient: 'Draw — insufficient material.',
      draw: 'Draw by the 50-move rule.',
    };
    message = reasons[gameState.result] || 'The game ended in a draw.';
    accent = 'border-yellow-500';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative bg-[#FDFBF7] border-4 ${accent} w-full max-w-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200`}>
        <div className="p-8 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{title}</h2>
          <p className="font-mono text-sm text-gray-600 mb-2">{gameState.moves.length} moves played</p>
          <p className="font-mono text-sm text-gray-500 leading-relaxed mb-8">{message}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRematch}
              className="bg-black text-white p-3 font-mono font-bold uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all duration-200"
            >
              Rematch
            </button>
            <button
              onClick={onExit}
              className="p-3 font-mono text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODAL ---

const GameModal = ({ isOpen, onClose, onStart }) => {
  const [activeTab, setActiveTab] = useState('username');
  const [inputValue, setInputValue] = useState('');
  const [platform, setPlatform] = useState('chesscom');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [pgnFile, setPgnFile] = useState(null);
  const [pgnContent, setPgnContent] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPgnFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => setPgnContent(evt.target.result);
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    initAudio();
    setError('');

    if (activeTab === 'username') {
      if (platform === 'default') {
        onStart({ mode: 'default', username: 'Default Clone', ghostBook: null });
        return;
      }

      if (!inputValue) {
        setError('Please enter a username.');
        return;
      }

      setIsLoading(true);
      try {
        const valRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/validate-user?username=${encodeURIComponent(inputValue)}&platform=${platform}`
        );
        if (!valRes.ok) {
          const platformLabel = platform === 'chesscom' ? 'Chess.com' : 'Lichess';
          setError(`Username not found on ${platformLabel}.`);
          setIsLoading(false);
          return;
        }
        const valData = await valRes.json();
        setValidated(true);

        const ghostRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ghost?username=${encodeURIComponent(inputValue)}&color=white&platform=${platform}`
        );
        const ghostBook = ghostRes.ok ? await ghostRes.json() : null;
        setIsLoading(false);
        onStart({ mode: 'online', username: inputValue, ghostBook, platform, avatarUrl: valData.avatar_url });
      } catch (err) {
        setError('Could not connect to server.');
        setIsLoading(false);
      }
    } else {
      if (!pgnContent) {
        setError('Please select a PGN file.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ghost/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pgn: pgnContent }),
        });
        const ghostBook = res.ok ? await res.json() : null;
        setIsLoading(false);
        onStart({ mode: 'pgn', username: 'PGN Upload', ghostBook });
      } catch (err) {
        setError('Could not connect to server.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FDFBF7] border-4 border-black w-full max-w-md shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-black hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-black uppercase mb-6 tracking-tight">Initialize Clone</h2>

          <div className="flex gap-4 mb-6 border-b-2 border-black/10 pb-1">
             <button
                onClick={() => { setActiveTab('username'); setError(''); setValidated(false); }}
                className={`pb-2 font-mono text-sm font-bold transition-colors ${activeTab === 'username' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-black'}`}
             >
                USERNAME
             </button>
             <button
                onClick={() => { setActiveTab('pgn'); setError(''); setValidated(false); }}
                className={`pb-2 font-mono text-sm font-bold transition-colors ${activeTab === 'pgn' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-black'}`}
             >
                UPLOAD PGN
             </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {activeTab === 'username' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-mono text-xs font-bold uppercase text-gray-500">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => { setPlatform(e.target.value); setValidated(false); setError(''); }}
                    className="w-full p-3 border-2 border-black font-mono focus:outline-none focus:ring-4 focus:ring-blue-200 bg-white"
                  >
                    <option value="chesscom">Chess.com</option>
                    <option value="lichess">Lichess</option>
                    <option value="default">Default Clone</option>
                  </select>
                </div>

                {platform === 'default' ? (
                  <div className="border-2 border-dashed border-black p-6 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu size={18} className="text-blue-600" />
                      <p className="font-mono text-sm font-bold">Stockfish Engine</p>
                    </div>
                    <p className="font-mono text-xs text-gray-500 leading-relaxed">
                      Play against Stockfish at moderate depth. No game history needed — pure engine opponent.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="font-mono text-xs font-bold uppercase text-gray-500">
                      {platform === 'chesscom' ? 'Chess.com' : 'Lichess'} Username
                    </label>
                    {validated || isLoading ? (
                      <div className="w-full p-4 border-2 border-green-500 bg-green-50 font-mono flex items-center justify-between">
                        <span className="font-bold text-green-800">{inputValue}</span>
                        <Check size={18} className="text-green-600" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. MagnusCarlsen"
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); setValidated(false); setError(''); }}
                        className="w-full p-4 border-2 border-black font-mono focus:outline-none focus:ring-4 focus:ring-blue-200 bg-white"
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="font-mono text-xs font-bold uppercase text-gray-500">PGN File</label>
                <input
                  type="file"
                  accept=".pgn"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className="border-2 border-dashed border-black p-8 text-center bg-white cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm text-gray-500">
                    {pgnFile ? (
                      <span className="text-blue-600 font-bold flex items-center justify-center gap-2">
                        <Check size={14} /> {pgnFile.name}
                      </span>
                    ) : (
                      "Click to select file"
                    )}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 p-3 flex items-center gap-2 text-red-700 font-mono text-xs">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {isLoading ? (
              <ThinkingLoader />
            ) : (
              <button
                type="submit"
                className="mt-4 bg-black text-white p-4 font-mono font-bold uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all duration-200 flex justify-center items-center gap-2"
              >
                Start Engine <ArrowRight size={18} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, number }) => (
  <div className="border-4 border-black p-8 bg-white hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 group">
    <div className="flex justify-between items-start mb-6">
      <div className="bg-blue-500 text-white p-3 font-mono text-xl border-2 border-black">
        {number}
      </div>
      <Icon size={32} className="text-black group-hover:rotate-12 transition-transform duration-300" />
    </div>
    <h3 className="text-2xl font-black uppercase mb-4 tracking-tight">{title}</h3>
    <p className="font-mono text-sm leading-relaxed text-gray-600">
      {desc}
    </p>
  </div>
);

const GlitchText = ({ children }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isIntervalJitter, setIsIntervalJitter] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsIntervalJitter(false);
    
    intervalRef.current = setInterval(() => {
      setIsIntervalJitter(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsIntervalJitter(false);
      }, 600);
    }, 5000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setIsIntervalJitter(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    startInterval();
  };

  return (
    <span 
      className={`inline-block cursor-default transition-colors duration-75 ${isHovering ? 'glitch-hover-active' : ''} ${isIntervalJitter ? 'glitch-interval-active' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
};

// --- APP ---

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [activeUsername, setActiveUsername] = useState('');
  const [ghostBook, setGhostBook] = useState(null);
  const [activePlatform, setActivePlatform] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Inline form state
  const [platform, setPlatform] = useState('chesscom');
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGameStart = ({ username, ghostBook: gb, platform: plat, avatarUrl: avatar }) => {
    setActiveUsername(username);
    setGhostBook(gb || null);
    setActivePlatform(plat || null);
    setAvatarUrl(avatar || null);
    setGameActive(true);
    setShowModal(false);
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    initAudio();
    setError('');

    if (platform === 'default') {
      handleGameStart({ mode: 'default', username: 'Default Clone', ghostBook: null, platform });
      return;
    }

    if (!usernameInput) {
      setError('Please enter a username.');
      return;
    }

    setIsLoading(true);
    try {
      const valRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/validate-user?username=${encodeURIComponent(usernameInput)}&platform=${platform}`
      );
      if (!valRes.ok) {
        const platformLabel = platform === 'chesscom' ? 'Chess.com' : 'Lichess';
        setError(`Username not found on ${platformLabel}.`);
        setIsLoading(false);
        return;
      }
      const valData = await valRes.json();

      const ghostRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ghost?username=${encodeURIComponent(usernameInput)}&color=white&platform=${platform}`
      );
      const ghostBook = ghostRes.ok ? await ghostRes.json() : null;
      setIsLoading(false);
      handleGameStart({ mode: 'online', username: usernameInput, ghostBook, platform, avatarUrl: valData.avatar_url });
    } catch (err) {
      setError('Could not connect to server.');
      setIsLoading(false);
    }
  };

  const handleExitGame = () => {
    setGameActive(false);
    setActiveUsername('');
    setGhostBook(null);
    setActivePlatform(null);
    setAvatarUrl(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans selection:bg-blue-500 selection:text-white relative">
      <style>{`
        @keyframes glitch-anim {
          0% { transform: translate(0,0); }
          10% { transform: translate(-3px, 2px); }
          20% { transform: translate(2px, -3px); }
          30% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          50% { transform: translate(-3px, 3px); }
          60% { transform: translate(2px, 2px); }
          70% { transform: translate(-2px, -3px); }
          80% { transform: translate(3px, -2px); }
          90% { transform: translate(-2px, 3px); }
          100% { transform: translate(0,0); }
        }
        .glitch-hover-active {
          animation: glitch-anim 0.6s linear infinite;
          color: #2563eb;
        }
        .glitch-interval-active {
          animation: glitch-anim 0.6s linear forwards;
          color: #2563eb;
        }
      `}</style>
      <PixelHeader />

      {/* Hero Section */}
      <main className="relative min-h-[80vh]">
        {!gameActive ? (
          <div className="container mx-auto px-6 pt-20 pb-12 md:pt-32 md:pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-20">
              <div className="max-w-4xl flex-1">
                <h1 className="text-[12vw] md:text-[8rem] leading-[0.85] font-black uppercase tracking-tighter text-[#2a2118] mb-8">
                  Stop<br />
                  Playing<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 stroke-black">Against</span><br />
                  <GlitchText>Losers.</GlitchText>
                </h1>
                
                <div className="max-w-xl mt-8 lg:mt-12">
                  <p className="text-xl md:text-2xl font-bold leading-tight mb-6">
                    Your friends are too easy. The engines are too robotic. 
                  </p>
                  <p className="font-mono text-sm md:text-base text-gray-600 mb-8 border-l-4 border-blue-500 pl-4">
                    Our neural engine analyzes your game history to build the ultimate opponent: <strong className="text-black">An AI clone of yourself.</strong>
                  </p>
                </div>
              </div>

              {/* Right Column: Form & Badge */}
              <div className="w-full max-w-lg shrink-0 relative lg:mt-8">

                {/* INLINE FORM CTA */}
                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10">
                  <div className="mb-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Create AI Clone</h3>
                    <p className="font-mono text-sm text-gray-600 leading-relaxed">
                      Enter your username to analyze your playstyle and generate an AI clone of yourself.
                    </p>
                  </div>

                  <form onSubmit={handleHeroSubmit} className="flex flex-col gap-5">
                    <div className="flex gap-6 border-b-2 border-black/5 pb-5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 border-2 border-black rounded-full flex items-center justify-center ${platform === 'chesscom' ? 'bg-blue-600' : 'bg-white'}`}>
                          {platform === 'chesscom' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <input type="radio" name="platform" value="chesscom" checked={platform === 'chesscom'} onChange={(e) => setPlatform(e.target.value)} className="hidden" />
                        <span className={`font-mono text-sm font-bold ${platform === 'chesscom' ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>Chess.com</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 border-2 border-black rounded-full flex items-center justify-center ${platform === 'lichess' ? 'bg-blue-600' : 'bg-white'}`}>
                          {platform === 'lichess' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <input type="radio" name="platform" value="lichess" checked={platform === 'lichess'} onChange={(e) => setPlatform(e.target.value)} className="hidden" />
                        <span className={`font-mono text-sm font-bold ${platform === 'lichess' ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>Lichess</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 border-2 border-black rounded-full flex items-center justify-center ${platform === 'default' ? 'bg-blue-600' : 'bg-white'}`}>
                          {platform === 'default' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <input type="radio" name="platform" value="default" checked={platform === 'default'} onChange={(e) => setPlatform(e.target.value)} className="hidden" />
                        <span className={`font-mono text-sm font-bold ${platform === 'default' ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>Default</span>
                      </label>
                    </div>

                    {platform === 'default' ? (
                      <div className="border-2 border-dashed border-black p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu size={16} className="text-blue-600" />
                          <p className="font-mono text-sm font-bold">Stockfish Engine</p>
                        </div>
                        <p className="font-mono text-xs text-gray-500 leading-relaxed">
                          Play against Stockfish. No username required.
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        {isLoading ? (
                          <div className="w-full p-4 border-2 border-green-500 bg-green-50 font-mono text-lg flex items-center justify-between">
                            <span className="font-bold text-green-800">{usernameInput}</span>
                            <Check size={18} className="text-green-600" />
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder={platform === 'chesscom' ? "Chess.com Username" : "Lichess Username"}
                            value={usernameInput}
                            onChange={(e) => { setUsernameInput(e.target.value); setError(''); }}
                            className="w-full p-4 border-2 border-black font-mono text-lg focus:outline-none focus:ring-4 focus:ring-blue-200 bg-gray-50 placeholder:text-gray-400"
                          />
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 p-3 flex items-center gap-2 text-red-700 font-mono text-xs animate-in slide-in-from-top-2">
                        <AlertCircle size={14} />
                        {error}
                      </div>
                    )}

                    {isLoading ? (
                      <ThinkingLoader />
                    ) : (
                      <button
                        type="submit"
                        className="bg-black text-white p-4 font-mono font-bold uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all duration-200 flex justify-center items-center gap-2"
                      >
                        Play Against Clone <ArrowRight size={18} />
                      </button>
                    )}
                  </form>
                </div>
                
                <div className="mt-4 flex justify-between items-center px-1">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="text-xs font-mono font-bold text-gray-500 hover:text-black underline decoration-2 underline-offset-2 transition-colors"
                  >
                    Upload PGN / Advanced Options
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE GAME VIEW */
          <ChessGameInterface username={activeUsername} ghostBook={ghostBook} onExit={handleExitGame} platform={activePlatform} avatarUrl={avatarUrl} />
        )}

        {/* Dynamic Grid Visual (Always show at bottom of hero unless game is covering) */}
        {!gameActive && <DynamicGrid />}

        {/* Value Proposition (Only show if game not active) */}
        {!gameActive && (
          <section className="py-24 px-6 md:px-12 bg-white">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b-4 border-black pb-8">
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter max-w-2xl">
                  The only way to win is to beat yourself.
                </h2>
                <div className="mt-4 md:mt-0 font-mono text-sm text-right">
                  Data Points: 1,002,491<br/>
                  Active Clones: 4,200
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                  number="01"
                  title="Style Extraction"
                  icon={Crown}
                  desc="We don't just calculate Elo. We map your aggression, your opening biases, and your mid-game blunders into a singular digital fingerprint."
                />
                <FeatureCard 
                  number="02"
                  title="Mirror Match"
                  icon={User}
                  desc="Play against a ghost of your past games. It knows exactly when you get greedy and exactly how to punish your favorite gambit."
                />
                <FeatureCard 
                  number="03"
                  title="Weakness Heatmap"
                  icon={Grid3X3}
                  desc="Visualize your blind spots on a dynamic 8x8 grid. See where your intuition fails you and patch the holes in your logic."
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <GameModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onStart={handleGameStart}
      />

      {/* Footer */}
      {!gameActive && (
        <footer className="bg-black text-white py-12 px-6 border-t-4 border-white">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Chess Yourself</h3>
              <p className="font-mono text-xs text-gray-400">© 2024 SELF_PLAY SYSTEMS INC.</p>
            </div>
            
            <div className="flex gap-8 font-mono text-sm uppercase tracking-wide">
              <a href="#" className="hover:text-blue-400 transition-colors">Manifesto</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Login</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};