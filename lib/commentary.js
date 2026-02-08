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

// --- Clone (non-Napoleon) context messages ---

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

// =============================================
// Napoleon Quote Pools
// =============================================

const NAPOLEON_OPENING = [
  'You face the Little Corporal, but do not mistake my stature for my ambition. Europe bowed; so shall your King.',
  'Strategy is the art of making use of time and space. I have plenty of both; you have neither.',
  'I see you have arranged your troops. How quaint. Do they know they march to their doom?',
  'Let us see if you possess the genius of a Wellington or the incompetence of an Austrian archduke.',
  'The chessboard is a battlefield, and I am its master. Prepare yourself.',
];

const NAPOLEON_ATTACK_KNIGHT = [
  'The secret of war is to travel light, strike hard, and strike fast. Watch my cavalry ride!',
  'Boldness! Always boldness! My Knights do not ask permission to take ground.',
];

const NAPOLEON_ATTACK_BISHOP = [
  'You cannot stop a storm with an umbrella. My Bishops are the lightning!',
];

const NAPOLEON_ATTACK_GENERAL = [
  'I shall bring the heavy artillery to bear on your position. Feu!',
  'Observe the Sun of Austerlitz rising over your flank! It is a beautiful morning for a conquest.',
];

const NAPOLEON_CHECK = [
  'Your King looks nervous. Does he hear the drums of the Grande Arm\u00e9e approaching?',
  'Check. A warning shot across the bow of your sinking ship.',
  'There is nowhere to run. The English Channel cannot save you here.',
  'Kneel! It is only natural to kneel before an Emperor.',
  'Your defenses crumble like the walls of Jericho. Surrender is an option, you know.',
];

const NAPOLEON_SACRIFICE = [
  'You think you have won a piece? Non. You have merely swallowed the bait.',
  'To win, one must be willing to break a few eggs to make the omelet. Adieu, brave soldier.',
  "I give you a Bishop, but I take your dignity. A fair exchange, n'est-ce pas?",
  'The Guard dies but does not surrender! His death paves the road to my victory.',
  'Glory is fleeting, but obscurity is forever. My Knight chose glory.',
];

const NAPOLEON_BLUNDER = [
  'A mere scratch! The bullet that will kill me has not yet been cast.',
  'My Marshals... they have failed me again! Why must I do everything myself?',
  'This is not a retreat! It is merely a strategic retrograde movement toward a better position.',
  'The winter... it is the Russian winter that slows me, not your skill!',
  'I have made a mistake? Impossible. History will rewrite this as a brilliant feint.',
];

const NAPOLEON_VICTORY = [
  'Victory belongs to the most persevering. Today, that is me. Vive la France!',
  'Another crown for my collection. Perhaps I shall make your King the Viceroy of a very small pawn.',
  'History is a set of lies agreed upon. But this checkmate? This is an undeniable truth.',
  'You fought well, for a coalition of one. But against destiny, you stood no chance.',
  'Bring me Josephine! We must celebrate this triumph!',
];

const NAPOLEON_DEFEAT = [
  'Waterloo... It is Waterloo all over again.',
  'You have not defeated me; you have only delayed the inevitable. I shall return from Elba!',
  'Treachery! Someone has sold the plans of my defense! I demand a tribunal!',
  'Enjoy your victory, General. The weather was simply against me today.',
  'St. Helena awaits. But remember, my legend will outlive your little checkmate.',
];

const NAPOLEON_DRAW = [
  'A draw? You bore me. This is neither victory nor defeat; it is purgatory.',
  'We are like two scorpions in a bottle. Neither can sting without perishing.',
  'Very well. We shall sign the Treaty of Tilsit. Peace... for now.',
  'You have managed to not lose. Do not confuse that with winning.',
];

/**
 * Napoleon-specific move commentary for AI moves.
 * Returns a quote based on piece type, captures, and checks.
 * Returns null if it decides to stay silent.
 */
function napoleonMoveMessage(san) {
  const { piece, isCastle, isCapture, isCheck, isCheckmate } = parseSan(san);

  // Always speak on checkmate
  if (isCheckmate) {
    const text = pick(NAPOLEON_VICTORY);
    return { text, mood: text.includes('Josephine') ? 'flirty' : 'laugh' };
  }

  // Always speak on check
  if (isCheck) return { text: pick(NAPOLEON_CHECK), mood: 'angry' };

  // Castle — ~60% chance
  if (isCastle) {
    if (Math.random() > 0.6) return null;
    return { text: pick([
      'Even an Emperor must protect his throne. But do not mistake caution for weakness.',
      'The King retreats to his fortress. Now the campaign begins in earnest.',
    ]), mood: 'acknowledge' };
  }

  // Knight moves — ~60% chance, use knight-specific pool
  if (piece === 'n') {
    if (Math.random() > 0.6) return null;
    return { text: pick(NAPOLEON_ATTACK_KNIGHT), mood: 'mocking' };
  }

  // Bishop moves — ~60% chance, use bishop-specific pool
  if (piece === 'b') {
    if (Math.random() > 0.6) return null;
    return { text: pick(NAPOLEON_ATTACK_BISHOP), mood: 'mocking' };
  }

  // Queen moves — ~50% chance
  if (piece === 'q') {
    if (Math.random() > 0.5) return null;
    return { text: pick([
      ...NAPOLEON_ATTACK_GENERAL,
      'My Empress takes the field. Tremble.',
    ]), mood: 'flirty' };
  }

  // Rook moves — ~40% chance
  if (piece === 'r') {
    if (Math.random() > 0.4) return null;
    return { text: pick(NAPOLEON_ATTACK_GENERAL), mood: 'mocking' };
  }

  // Captures (non-check, non-piece-specific) — ~45% chance
  if (isCapture) {
    if (Math.random() > 0.45) return null;
    return { text: pick(NAPOLEON_ATTACK_GENERAL), mood: 'mocking' };
  }

  // Quiet pawn/general moves — ~25% chance
  if (Math.random() > 0.25) return null;
  return { text: pick(NAPOLEON_ATTACK_GENERAL), mood: 'standard' };
}

// =============================================
// Exported Commentary Functions
// =============================================

export function generateIntroMessage(napoleonMode = false) {
  if (napoleonMode) {
    return { text: pick(NAPOLEON_OPENING), mood: 'standard' };
  }
  return pick([
    'Clone activated. I know every trick in the book.',
    'Neural link established. Time to play.',
    'Ghost book loaded. I\'m ready.',
    'I am the superior version. Simple as that.',
    'Every game analyzed. Every pattern memorized. Let\'s go.',
    'Booted up and dangerous.',
  ]);
}

export function generateFirstMoveMessage(move, ghostBook, napoleonMode = false, source = null) {
  const opening = OPENINGS[move] || null;

  if (napoleonMode) {
    if (source === 'remusat') {
      return { text: pick([
        'The Dunst Opening. The same opening I played at Malmaison, 1804.',
        'Nc3. A move I played against Madame de R\u00e9musat. It ended... poorly for her.',
        'This opening won me a famous game once. History shall repeat itself.',
      ]), mood: 'acknowledge' };
    }
    return { text: pick(NAPOLEON_OPENING), mood: 'standard' };
  }

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

export function generateGhostMoveMessage(move, ghostData, napoleonMode = false) {
  // Napoleon mode: never show statistics, use themed attack quotes
  if (napoleonMode) {
    return napoleonMoveMessage(move);
  }

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

export function generateStockfishMessage(move, napoleonMode = false) {
  // Napoleon mode: use the same attack quote system (no stats either)
  if (napoleonMode) {
    return napoleonMoveMessage(move);
  }
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

export function generatePlayerMoveReaction(moveData, napoleonMode = false) {
  const { piece, isCastle, isCapture, isCheck } = parseSan(moveData.move);

  if (napoleonMode) {
    // Player puts Napoleon in check — blunder/defensive quotes, ~80% chance
    if (isCheck) {
      if (Math.random() > 0.8) return null;
      return { text: pick(NAPOLEON_BLUNDER), mood: 'angry' };
    }

    // Player captures — sacrifice quotes, ~60% chance
    if (isCapture) {
      if (Math.random() > 0.6) return null;
      return { text: pick(NAPOLEON_SACRIFICE), mood: 'laugh' };
    }

    // Player castles — ~40% chance
    if (isCastle) {
      if (Math.random() > 0.4) return null;
      return { text: pick([
        'You hide your King? A coward\'s gambit. It will not save you.',
        'Castling. Even Wellington needed his fortifications. It will not matter.',
      ]), mood: 'mocking' };
    }

    // Player queen move — ~30% chance
    if (piece === 'q') {
      if (Math.random() > 0.3) return null;
      return { text: pick([
        'Your Queen parades about the board. How very... ambitious.',
        'Ah, deploying the Queen. Bold, but predictable.',
      ]), mood: 'mocking' };
    }

    // Other moves — ~15% chance
    if (Math.random() > 0.15) return null;
    return { text: pick([
      'Is that your move? I expected more from a worthy adversary.',
      'Interesting. My generals would have done better, but carry on.',
      'You move with the confidence of a man who does not yet know he is defeated.',
    ]), mood: 'mocking' };
  }

  // --- Clone (non-Napoleon) reactions ---
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

export function generateResignMessage(napoleonMode = false) {
  if (napoleonMode) {
    const text = pick(NAPOLEON_VICTORY);
    return { text, mood: text.includes('Josephine') ? 'flirty' : 'laugh' };
  }
  return pick([
    'Resignation accepted. I knew it was over.',
    'And just like that, I win. Too easy.',
    'Already? I expected more fight.',
    'Resigned. The clone takes the W.',
    'Smart call. That was going nowhere.',
    'I accept the surrender. Gracious in victory.',
  ]);
}

export function generateGameOverMessage(result, turn, napoleonMode = false) {
  if (napoleonMode) {
    if (result === 'checkmate') {
      if (turn === 'w') return { text: pick(NAPOLEON_DEFEAT), mood: 'disappointed' };
      const text = pick(NAPOLEON_VICTORY);
      return { text, mood: text.includes('Josephine') ? 'flirty' : 'laugh' };
    }
    return { text: pick(NAPOLEON_DRAW), mood: 'disappointed' };
  }

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
