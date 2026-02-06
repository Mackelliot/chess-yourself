import requests

def validate_user(username: str) -> bool:
    headers = {
        'User-Agent': 'ChessYourself/1.0'
    }
    try:
        response = requests.get(f"https://api.chess.com/pub/player/{username}", headers=headers)
        return response.status_code == 200
    except requests.RequestException:
        return False

def get_games_by_color(username: str, color: str) -> list[str]:
    """
    Fetches the last 500 games for a specific chess.com username
    where the user played as the specified color.

    Args:
        username: The chess.com username.
        color: The color to filter by ('white' or 'black').

    Returns:
        A list of up to 500 game PGN strings.
    """
    headers = {
        'User-Agent': 'ChessYourself/1.0'  # Chess.com API requires a User-Agent
    }
    
    # 1. Fetch the list of monthly archives
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    try:
        response = requests.get(archives_url, headers=headers)
        response.raise_for_status()
        archives = response.json().get('archives', [])
    except requests.RequestException as e:
        print(f"Error fetching archives: {e}")
        return []

    # 2. Iterate archives newest-first, collect up to 100 games matching the color
    filtered_pgns = []
    target_username = username.lower()

    for archive_url in reversed(archives):
        try:
            response = requests.get(archive_url, headers=headers)
            response.raise_for_status()
            games = response.json().get('games', [])

            # Games within an archive are chronological, reverse to get newest first
            for game in reversed(games):
                white_username = game.get('white', {}).get('username', '').lower()
                black_username = game.get('black', {}).get('username', '').lower()

                if color.lower() == 'white' and white_username == target_username:
                    if game.get('pgn'):
                        filtered_pgns.append(game.get('pgn'))
                elif color.lower() == 'black' and black_username == target_username:
                    if game.get('pgn'):
                        filtered_pgns.append(game.get('pgn'))

                if len(filtered_pgns) >= 500:
                    return filtered_pgns

        except requests.RequestException as e:
            print(f"Error fetching games from archive {archive_url}: {e}")

    return filtered_pgns