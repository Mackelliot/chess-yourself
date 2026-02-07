from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chess_api import get_games_by_color as chesscom_get_games, validate_user as chesscom_validate
from lichess_api import get_games_by_color as lichess_get_games, validate_user as lichess_validate
from pgn_processor import build_move_frequency_map

app = FastAPI()

import os

allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://chess-yourself.vercel.app,https://www.chessyourself.com,https://chessyourself.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/validate-user")
def validate_user(username: str, platform: str):
    if platform not in ("chesscom", "lichess"):
        raise HTTPException(status_code=400, detail="Platform must be 'chesscom' or 'lichess'")

    if platform == "chesscom":
        result = chesscom_validate(username)
    else:
        result = lichess_validate(username)

    if not result.get("found"):
        raise HTTPException(status_code=404, detail=f"Username not found on {platform}")

    return {"status": "ok", "username": username, "platform": platform, "avatar_url": result.get("avatar_url")}

@app.get("/ghost")
def get_ghost_moves(username: str, color: str, platform: str = "chesscom"):
    if color.lower() not in ["white", "black"]:
        raise HTTPException(status_code=400, detail="Color must be 'white' or 'black'")

    if platform == "lichess":
        pgns = lichess_get_games(username, color)
    else:
        pgns = chesscom_get_games(username, color)

    result = build_move_frequency_map(pgns)
    return result

class PGNUpload(BaseModel):
    pgn: str

@app.post("/ghost/upload")
def upload_ghost(body: PGNUpload):
    result = build_move_frequency_map([body.pgn])
    return result
