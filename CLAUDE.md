# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js)
```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run lint         # Run Next.js linter
```

### Backend (FastAPI)
```bash
pip install -r requirements.txt                  # Install Python dependencies
uvicorn main:app --reload --host 0.0.0.0 --port 8000  # Start API server
```

Both servers must run simultaneously. The frontend calls the backend at `http://localhost:8000`.

## Architecture

This is a two-server app: a Next.js frontend and a Python FastAPI backend. The app lets users play chess against an AI clone that mimics a real player's style.

### How the "Ghost Book" Works
The core concept is the ghost book — a `{fen: {move_san: count}}` frequency map built from a player's game history. When it's the AI's turn:
1. Look up the current board FEN in the ghost book
2. If found, pick a move probabilistically weighted by historical frequency (`makeGhostMove` in `PlayableBoard.js`)
3. If not found, fall back to Stockfish WASM engine at depth 10

### Backend (Python, port 8000)
- `main.py` — FastAPI app with CORS for localhost:3000. Three endpoints:
  - `GET /validate-user` — checks username exists on Chess.com or Lichess
  - `GET /ghost` — fetches up to 500 games for a user+color, returns ghost book
  - `POST /ghost/upload` — accepts raw PGN text, returns ghost book
- `chess_api.py` — Chess.com API client (fetches monthly archives, filters by color)
- `lichess_api.py` — Lichess ndjson API client
- `pgn_processor.py` — Parses PGN strings into the FEN→move frequency map using `python-chess`

### Frontend (Next.js, port 3000)
- `app/page.js` — Single-page app with all UI: landing page, game modal (`GameModal`), game interface (`ChessGameInterface`), move list. Contains the Web Audio API sound system (synthesized move/capture/check/win/loss sounds).
- `components/PlayableBoard.js` — Chess board component using `chess.js` for logic and `react-chessboard` for rendering. Manages Stockfish Web Worker and ghost book move selection.
- `public/stockfish/` — Stockfish WASM engine loaded as a Web Worker

### Game Flow
1. User clicks "Initialize Clone" → `GameModal` opens
2. User picks platform (Chess.com / Lichess / Default Clone / PGN Upload)
3. For online platforms: validates username via `/validate-user`, then fetches ghost book via `/ghost`
4. For PGN upload: sends file content to `/ghost/upload`
5. For Default Clone: skips backend, uses Stockfish only (null ghost book)
6. `Home` passes `ghostBook` → `ChessGameInterface` → `PlayableBoard`

### Key Constraints
- AI clone always plays WHITE; user always plays BLACK; board oriented black-at-bottom
- Stockfish communicates via `postMessage`/`onmessage` Web Worker protocol
- `PlayableBoard` uses a `gameRef` to avoid stale closures in the Stockfish callback
- Chess.com API requires `User-Agent: ChessYourself/1.0` header
