#!/usr/bin/env python3
"""
One-time script to generate the Napoleon Clone ghost book.

Fetches up to 2000 games from Chess.com user "Fozziwig" (white only)
and builds a static ghost book JSON file for the Napoleon Clone.
"""

import json
import os
import sys

# Add project root to path so we can import existing modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from pgn_processor import build_move_frequency_map


def get_games_extended(username: str, color: str, max_games: int = 2000) -> list[str]:
    """Fetch up to max_games PGNs for a user+color from Chess.com."""
    headers = {'User-Agent': 'ChessYourself/1.0'}

    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    response = requests.get(archives_url, headers=headers)
    response.raise_for_status()
    archives = response.json().get('archives', [])

    filtered_pgns = []
    target_username = username.lower()

    for archive_url in reversed(archives):
        try:
            resp = requests.get(archive_url, headers=headers)
            resp.raise_for_status()
            games = resp.json().get('games', [])

            for game in reversed(games):
                white_username = game.get('white', {}).get('username', '').lower()
                black_username = game.get('black', {}).get('username', '').lower()

                if color.lower() == 'white' and white_username == target_username:
                    if game.get('pgn'):
                        filtered_pgns.append(game.get('pgn'))
                elif color.lower() == 'black' and black_username == target_username:
                    if game.get('pgn'):
                        filtered_pgns.append(game.get('pgn'))

                if len(filtered_pgns) >= max_games:
                    return filtered_pgns

        except requests.RequestException as e:
            print(f"  Warning: error fetching {archive_url}: {e}")

    return filtered_pgns


def main():
    username = "Fozziwig"
    color = "white"
    max_games = 2000

    print(f"Fetching up to {max_games} {color} games for {username}...")
    pgns = get_games_extended(username, color, max_games)
    print(f"  Fetched {len(pgns)} games.")

    if not pgns:
        print("No games found. Exiting.")
        sys.exit(1)

    print("Building ghost book...")
    ghost_book = build_move_frequency_map(pgns)
    print(f"  {len(ghost_book)} unique positions.")

    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public",
        "napoleon_ghost_book.json",
    )
    with open(output_path, "w") as f:
        json.dump(ghost_book, f)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Saved to {output_path} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
