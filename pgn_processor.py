import io
from collections import defaultdict
import chess
import chess.pgn

def normalize_fen(fen: str) -> str:
    """Strip halfmove clock and fullmove number for position-based matching."""
    parts = fen.split(' ')
    return ' '.join(parts[:4])

def build_move_frequency_map(pgn_list: list[str]) -> dict[str, dict[str, int]]:
    """
    Parses a list of PGN strings and builds a frequency map of moves for each position.

    Args:
        pgn_list: A list of strings, where each string contains PGN data.

    Returns:
        A dictionary where keys are FEN strings (without halfmove clock / fullmove number)
        and values are dictionaries mapping move SANs to their frequency counts.
    """
    # Structure: { fen_string: { move_san: count } }
    fen_stats = defaultdict(lambda: defaultdict(int))

    for pgn_string in pgn_list:
        pgn_io = io.StringIO(pgn_string)

        while True:
            game = chess.pgn.read_game(pgn_io)
            if game is None:
                break

            board = game.board()
            for move in game.mainline_moves():
                fen = normalize_fen(board.fen())
                move_san = board.san(move)
                fen_stats[fen][move_san] += 1
                board.push(move)

    return {k: dict(v) for k, v in fen_stats.items()}