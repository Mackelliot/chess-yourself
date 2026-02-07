const OPENINGS = {
  'e4': "King's Pawn Opening",
  'd4': "Queen's Pawn Opening",
  'c4': 'English Opening',
  'Nf3': 'Reti Opening',
  'f4': "Bird's Opening",
  'b3': 'Larsen-Nimzo Opening',
  'g3': 'Hungarian Opening',
  'b4': 'Sokolsky Opening',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateIntroMessage() {
  return pick([
    'Clone activated. I know all your tricks.',
    'Neural link established. I see every pattern.',
    'Ghost book loaded. Your move.',
    'I am you, but better. Prove me wrong.',
    'All your games have been analyzed. Good luck.',
  ]);
}

export function generateFirstMoveMessage(move, ghostBook) {
  if (!ghostBook) return `${move}. Let's begin.`;

  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
  const moves = ghostBook[startFen];
  if (!moves) return `${move}. ${OPENINGS[move] ? OPENINGS[move] + '.' : 'Interesting choice.'}`;

  const total = Object.values(moves).reduce((s, c) => s + c, 0);
  const moveCount = moves[move] || 0;
  const pct = total > 0 ? Math.round((moveCount / total) * 100) : 0;

  const opening = OPENINGS[move] || null;
  let msg = `${move}.`;
  if (pct > 0) msg += ` ${pct}% of your games start with this.`;
  if (opening) msg += ` The ${opening}.`;
  if (pct >= 60) msg += ' Predictable.';
  else if (pct === 0) msg += ' Branching off already? Bold.';
  return msg;
}

export function generateGhostMoveMessage(move, ghostData) {
  if (!ghostData) return `I played ${move}.`;

  const entry = ghostData.entries.find((e) => e.move === move);
  if (!entry) return `I played ${move}.`;

  const pct = entry.percentage;
  const total = ghostData.total;

  if (pct >= 70) {
    return pick([
      `${move}. You play this ${pct}% of the time. Muscle memory.`,
      `${move}. ${pct}% — your go-to move here. Predictable.`,
      `${move}. I know you'd play this. ${pct}% certainty.`,
    ]);
  }
  if (pct >= 40) {
    return pick([
      `${move}. You choose this ${pct}% of the time in this position.`,
      `${move}. A ${pct}% favorite of yours.`,
      `${move}. Seen it from you ${entry.count} out of ${total} times.`,
    ]);
  }
  return pick([
    `${move}. Only ${pct}% — one of your rarer choices here.`,
    `${move}. A lesser-known line from your repertoire.`,
    `${move}. ${entry.count} out of ${total}. The road less traveled.`,
  ]);
}

export function generateStockfishMessage(move) {
  return pick([
    `${move}. Off-script now. Ghost book empty for this position.`,
    `${move}. No historical data here. Pure engine instinct.`,
    `${move}. Uncharted territory. Stockfish takes the wheel.`,
    `${move}. We've left your playbook behind.`,
    `${move}. You've never been here before. Neither have I.`,
  ]);
}

export function generatePlayerMoveReaction(moveData) {
  // Throttle — only react ~40% of the time for normal moves
  if (!moveData.isCapture && !moveData.isCheck && Math.random() > 0.4) return null;

  if (moveData.isCheck) {
    return pick([
      'Check. Feeling the pressure?',
      'Check. Interesting aggression.',
      'Check. Bold move — but I expected it.',
      'Check. Is that all you\'ve got?',
    ]);
  }

  if (moveData.isCapture) {
    return pick([
      'Material exchange. Let\'s see if that was worth it.',
      'Taking pieces? You must be nervous.',
      'A trade. I have plans for the open lines.',
      'Captured. But at what cost?',
    ]);
  }

  return pick([
    'Interesting...',
    'Hmm. I see what you\'re doing.',
    'Classic you.',
    'Noted.',
  ]);
}

export function generateResignMessage() {
  return pick([
    'Resignation accepted. You knew it was over.',
    'You resigned. Smart — I had you cornered.',
    'Giving up? I expected more fight from myself.',
    'Resigned. The clone wins this round.',
    'You conceded. Sometimes discretion is the better part of valor.',
  ]);
}

export function generateGameOverMessage(result, turn) {
  // turn is the side that was checkmated/stalemated ('w' or 'b')
  // Player is always black, so turn === 'w' means player wins
  if (result === 'checkmate') {
    if (turn === 'w') {
      // Player checkmated the AI
      return pick([
        'Checkmate. Defeated by your own playstyle. Poetic.',
        'Checkmate. You beat yourself. Literally.',
        'Checkmate. The student surpasses the clone.',
        'Checkmate. I\'ll learn from this. Will you?',
      ]);
    }
    // AI checkmated the player
    return pick([
      'Checkmate. You just lost to yourself.',
      'Checkmate. Your own patterns were your downfall.',
      'Checkmate. I know you too well.',
      'Checkmate. Maybe study your own games more carefully.',
    ]);
  }

  return pick([
    'Draw. We think alike. Obviously.',
    'Draw. Equally matched — as expected.',
    'Draw. Neither of us could finish it.',
    'A draw. We\'re the same player, after all.',
  ]);
}
