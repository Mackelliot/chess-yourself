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

function parseSan(san) {
  if (!san) return {};
  const isCastle = san.startsWith('O-');
  const isCapture = san.includes('x');
  const isCheck = san.includes('+');
  const isCheckmate = san.includes('#');
  let piece = 'p';
  if (isCastle) piece = 'k';
  else if ('NBRQK'.includes(san[0])) piece = san[0].toLowerCase();
  return { piece, isCastle, isCapture, isCheck, isCheckmate };
}

function contextMessage(san) {
  const { piece, isCastle, isCapture, isCheck, isCheckmate } = parseSan(san);

  if (isCheckmate) return pick([
    'And that\'s checkmate. Thanks for playing.',
    'Checkmate. I told you I was ready.',
  ]);
  if (isCheck) return pick([
    'Check. Might want to pay attention.',
    'Check. The walls are closing in.',
    'Check. How\'s that for pressure?',
    'Check. This is getting fun.',
  ]);
  if (isCastle) return pick([
    'Safe and sound. Now the real game begins.',
    'Tucked away the king. Time to attack.',
    'Castled. The fortress is built.',
  ]);
  if (piece === 'q') return pick([
    'Time to bring the queen into the conversation.',
    'Queen\'s getting involved. Things are about to escalate.',
    'The queen has entered the chat.',
    'Big piece, big plans.',
  ]);
  if (piece === 'n' && isCapture) return pick([
    'Knight takes. Love a good fork setup.',
    'The knight strikes. Didn\'t see that coming, did you?',
  ]);
  if (piece === 'n') return pick([
    'Knights are tricky pieces. Kind of like me.',
    'Love a good knight maneuver.',
    'The knight hops in. Unpredictable, just how I like it.',
  ]);
  if (piece === 'b') return pick([
    'Long diagonal. I can see everything from here.',
    'Bishop slides in. Vision across the whole board.',
  ]);
  if (piece === 'r') return pick([
    'Rook\'s getting active. Things are about to get serious.',
    'Opening up the rook. Here comes the pressure.',
  ]);
  if (isCapture) return pick([
    'Thanks, I\'ll take that.',
    'Gladly. That piece was in my way.',
    'Material advantage? Don\'t mind if I do.',
    'Took that piece and I\'m not giving it back.',
  ]);
  return null;
}

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
  const opening = OPENINGS[move] || null;

  if (!ghostBook) return pick([
    opening ? `The ${opening}. Classic. Let's do this.` : 'Classic opener. Let\'s do this.',
    'Off to the races.',
    'Standard stuff. The real fun comes later.',
  ]);

  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
  const moves = ghostBook[startFen];
  if (!moves) {
    return opening ? `The ${opening}. A personal favorite.` : 'Interesting start. Let\'s see where this goes.';
  }

  const total = Object.values(moves).reduce((s, c) => s + c, 0);
  const moveCount = moves[move] || 0;
  const pct = total > 0 ? Math.round((moveCount / total) * 100) : 0;

  if (pct >= 60) {
    return pick([
      `This is my first move in ${pct}% of my games, in case you're wondering.${opening ? ` The ${opening}.` : ''}`,
      `My signature opening. I play this ${pct}% of the time. It's basically instinct.${opening ? ` ${opening} forever.` : ''}`,
      `What else would I play? This is who I am.${opening ? ` The ${opening}, obviously.` : ''}`,
      `Playing right into my favorite opening. Thanks!${opening ? ` The ${opening}.` : ''}`,
    ]);
  }
  if (pct > 0) {
    return pick([
      `One of my go-to openers. I play this about ${pct}% of the time.${opening ? ` The ${opening}.` : ''}`,
      `${opening ? `The ${opening}. ` : ''}Felt right today. I play this in about ${pct}% of my games.`,
      `Not my most common, but it\'s in the rotation.${opening ? ` ${opening}.` : ''}`,
    ]);
  }
  return pick([
    `Something different today.${opening ? ` The ${opening}.` : ''} Keeping it fresh.`,
    'Switching things up. Can\'t be too predictable, even against myself.',
    `Not my usual opener, but I have my reasons.${opening ? ` ${opening}.` : ''}`,
  ]);
}

export function generateGhostMoveMessage(move, ghostData) {
  if (!ghostData) return null;

  const entry = ghostData.entries.find((e) => e.move === move);
  if (!entry) return null;

  const pct = entry.percentage;
  const total = ghostData.total;

  // ~35% chance of a context-specific message instead
  if (Math.random() < 0.35) {
    const ctx = contextMessage(move);
    if (ctx) return ctx;
  }

  // High confidence (>=70%) — always speak
  if (pct >= 70) {
    return pick([
      `I play this in ${pct}% of my games from this position. It's basically instinct at this point.`,
      `This is my most played move here by a mile. ${pct}% of the time, to be exact.`,
      `Out of ${total} games in this position, I play this almost every time. Muscle memory.`,
      'Playing right into my favorite line. This is exactly where I want to be.',
      'Automatic. I could play this move in my sleep.',
      `I've seen this position ${total} times. I know exactly what to do here.`,
      `This one? ${pct}% of my games. It's basically a reflex.`,
      'Hope you have a plan, because I certainly do.',
      'This is exactly where I want the game to go. Everything is falling into place.',
    ]);
  }

  // Medium confidence (>=40%) — speak ~50%
  if (pct >= 40) {
    if (Math.random() > 0.5) return null;
    return pick([
      `I've been in this position ${total} times. I know what works here.`,
      'One of my favorite options here. Solid and reliable.',
      `I play this about ${pct}% of the time from here. Today it felt right.`,
      'Everything is going according to plan.',
      'Setting things up nicely. Just wait.',
      'This is where it gets interesting.',
      `Seen this exact position ${total} times. Experience pays off.`,
      'I\'ve got a few options here but this one felt right today.',
    ]);
  }

  // Low confidence (<40%) — speak ~30%
  if (Math.random() > 0.3) return null;
  return pick([
    'Bet you didn\'t expect that one.',
    'Switching things up. Can\'t be too predictable.',
    'A rare pick from my collection. Feeling spicy today.',
    'Sometimes the best move is the one nobody sees coming.',
    'Going off-script. This should be fun.',
    'Not my usual choice here, but I\'ve got a feeling about it.',
  ]);
}

export function generateStockfishMessage(move) {
  // ~30% chance of a context message
  if (Math.random() < 0.3) {
    const ctx = contextMessage(move);
    if (ctx) return ctx;
  }
  // Only comment ~25% of the time otherwise
  if (Math.random() > 0.25) return null;
  return pick([
    'Off the map now. Improvising.',
    'New territory. I like it here.',
    'No playbook for this one. Pure instinct.',
    'Haven\'t been here before. Exciting.',
    'We\'re in uncharted territory. That\'s where I thrive.',
    'Off-book. Time to get creative.',
  ]);
}

export function generatePlayerMoveReaction(moveData) {
  const { piece, isCastle, isCapture, isCheck } = parseSan(moveData.move);

  if (isCheck) {
    if (Math.random() > 0.7) return null;
    return pick([
      'Check? That\'s cute.',
      'Nice check. I\'ll survive.',
      'Check. Saw that coming.',
      'A check. I\'ve dealt with worse.',
      'Check. Doesn\'t change the outcome.',
    ]);
  }

  if (isCapture) {
    if (Math.random() > 0.4) return null;
    return pick([
      'Go ahead, take it. I left that there on purpose.',
      'A trade. Fine by me.',
      'That piece was bait anyway.',
      'Take it. I\'ve got bigger plans.',
      'Material exchange? All part of the strategy.',
    ]);
  }

  if (piece === 'q') {
    if (Math.random() > 0.4) return null;
    return pick([
      'Interesting queen maneuver. Let\'s see where that goes.',
      'Moving the queen around? Careful with that.',
      'The queen\'s on the move. I\'m watching.',
      'Repositioning the queen? I see what\'s happening.',
    ]);
  }

  if (isCastle) {
    if (Math.random() > 0.5) return null;
    return pick([
      'Castling. Smart. But I\'ve already accounted for that.',
      'Tuck the king away. It won\'t help.',
    ]);
  }

  if (piece === 'n') {
    if (Math.random() > 0.2) return null;
    return pick([
      'Interesting knight move.',
      'The knight hops around. I see the idea.',
    ]);
  }

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
