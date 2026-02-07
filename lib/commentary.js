const OPENINGS = {
  'e4': "King's Pawn",
  'd4': "Queen's Pawn",
  'c4': 'English',
  'Nf3': 'Reti',
  'f4': "Bird's",
  'b3': 'Larsen-Nimzo',
  'g3': 'Hungarian',
  'b4': 'Sokolsky',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateIntroMessage() {
  return pick([
    'Clone activated. I know every trick in the book.',
    'Neural link established. Time to play.',
    'Ghost book loaded. I\'m ready.',
    'I am the superior version. Simple as that.',
    'Every game analyzed. Every pattern memorized. Let\'s go.',
    'Booted up and dangerous.',
  ]);
}

export function generateFirstMoveMessage(move, ghostBook) {
  if (!ghostBook) return pick([
    `${move}. Classic opener. Let's do this.`,
    `${move}. Off to the races.`,
    `${move}. Standard stuff. The real fun comes later.`,
  ]);

  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
  const moves = ghostBook[startFen];
  if (!moves) {
    const opening = OPENINGS[move];
    return opening ? `${move}. The ${opening}. A personal favorite.` : `${move}. Interesting start.`;
  }

  const total = Object.values(moves).reduce((s, c) => s + c, 0);
  const moveCount = moves[move] || 0;
  const pct = total > 0 ? Math.round((moveCount / total) * 100) : 0;
  const opening = OPENINGS[move] || null;

  if (pct >= 60) {
    return pick([
      `${move}. ${opening ? `The ${opening}. ` : ''}My signature opening. Obviously.`,
      `${move}. What else would I play? This is who I am.`,
      `${move}. The only real choice here.${opening ? ` ${opening} forever.` : ''}`,
    ]);
  }
  if (pct > 0) {
    return pick([
      `${move}. ${opening ? `The ${opening}. ` : ''}Felt right today.`,
      `${move}. One of my go-to openers.${opening ? ` ${opening}.` : ''}`,
      `${move}. I have a few of these in the repertoire.`,
    ]);
  }
  return pick([
    `${move}. Switching things up today.${opening ? ` ${opening}.` : ''}`,
    `${move}. Something a little different.`,
    `${move}. Keeping it unpredictable.`,
  ]);
}

export function generateGhostMoveMessage(move, ghostData) {
  if (!ghostData) return null;

  const entry = ghostData.entries.find((e) => e.move === move);
  if (!entry) return null;

  const pct = entry.percentage;
  const total = ghostData.total;

  // High confidence moves (>= 70%) — clear insight, always comment
  if (pct >= 70) {
    return pick([
      `${move}. Muscle memory. I don't even have to think.`,
      `${move}. The only move that makes sense here.`,
      `${move}. I've played this a thousand times.`,
      `${move}. Automatic. Like breathing.`,
      `${move}. This one's hardwired.`,
      `${move}. Come on. What else would I play?`,
      `${move}. My favorite. Couldn't resist.`,
    ]);
  }

  // Medium confidence (>= 40%) — comment ~40% of the time
  if (pct >= 40) {
    if (Math.random() > 0.4) return null;
    return pick([
      `${move}. I've been in this position ${total} times. I know what works.`,
      `${move}. I've been here before. I know the way.`,
      `${move}. Calculated. Not guessing.`,
      `${move}. Right on schedule.`,
      `${move}. Trust the process.`,
    ]);
  }

  // Low confidence (< 40%) — only comment ~20% of the time, when it's a genuinely rare pick
  if (Math.random() > 0.2) return null;
  return pick([
    `${move}. A rare pick from my collection.`,
    `${move}. Going off-script. Dangerous? Maybe.`,
    `${move}. Sometimes I surprise even myself.`,
    `${move}. A curveball. Deal with it.`,
  ]);
}

export function generateStockfishMessage(move) {
  // Only comment ~20% of the time — no ghost data means no real insight
  if (Math.random() > 0.2) return null;
  return pick([
    `${move}. Off-book now. Pure instinct.`,
    `${move}. No playbook for this one. Improvising.`,
    `${move}. Uncharted waters. I like it.`,
    `${move}. Never been here before. Exciting.`,
    `${move}. Beyond the ghost book. Raw calculation.`,
  ]);
}

export function generatePlayerMoveReaction(moveData) {
  // Only react to checks and captures, and not every time
  if (moveData.isCheck) {
    if (Math.random() > 0.6) return null;
    return pick([
      'Check? That\'s cute.',
      'A check. I\'ve survived worse.',
      'Check. Doesn\'t scare me.',
      'Check. Saw that coming three moves ago.',
    ]);
  }

  if (moveData.isCapture) {
    if (Math.random() > 0.4) return null;
    return pick([
      'A trade. Fine by me.',
      'Material exchange. All part of the plan.',
      'Go ahead, take it. I left that there on purpose.',
      'That piece was bait anyway.',
    ]);
  }

  // Normal moves — almost never react
  return null;
}

export function generateResignMessage() {
  return pick([
    'Resignation accepted. I knew it was over.',
    'And just like that, I win. Too easy.',
    'Already? I expected more fight.',
    'Resigned. The clone takes the W.',
    'Smart call. That was going nowhere.',
    'I accept the surrender. Gracious in victory.',
  ]);
}

export function generateGameOverMessage(result, turn) {
  if (result === 'checkmate') {
    if (turn === 'w') {
      return pick([
        'Checkmate. Well played. I\'ll be back stronger.',
        'Checkmate. Okay, that stings.',
        'Checkmate. I underestimated the competition.',
        'Checkmate. Fine. I\'ll learn from this.',
        'Checkmate. Not my finest hour.',
        'Checkmate. Respect. But next time? No mercy.',
      ]);
    }
    return pick([
      'Checkmate. That\'s game. I knew every move before it happened.',
      'Checkmate. I was built for this.',
      'Checkmate. Better luck next time.',
      'Checkmate. Clone: 1. Original: 0.',
      'Checkmate. I studied the master and became the master.',
      'Checkmate. Sit with that one for a while.',
    ]);
  }

  return pick([
    'Draw. Evenly matched. Naturally.',
    'Draw. Great minds think alike.',
    'Draw. Neither of us could land the final blow.',
    'A draw. Can\'t beat myself, apparently.',
    'Draw. Stalemate of equals.',
  ]);
}
