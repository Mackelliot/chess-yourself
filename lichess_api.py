import requests

def validate_user(username: str) -> bool:
    try:
        response = requests.get(f"https://lichess.org/api/user/{username}")
        return response.status_code == 200
    except requests.RequestException:
        return False

def get_games_by_color(username: str, color: str) -> list[str]:
    headers = {
        'Accept': 'application/x-ndjson'
    }
    try:
        response = requests.get(
            f"https://lichess.org/api/games/user/{username}",
            params={'max': 1000, 'pgnInBody': 'true'},
            headers=headers
        )
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching Lichess games: {e}")
        return []

    filtered_pgns = []
    for line in response.text.strip().split('\n'):
        if not line.strip():
            continue
        try:
            import json
            game = json.loads(line)
        except Exception:
            continue

        players = game.get('players', {})
        white_user = players.get('white', {}).get('user', {}).get('id', '').lower()
        black_user = players.get('black', {}).get('user', {}).get('id', '').lower()
        target = username.lower()

        if color.lower() == 'white' and white_user == target:
            if game.get('pgn'):
                filtered_pgns.append(game['pgn'])
        elif color.lower() == 'black' and black_user == target:
            if game.get('pgn'):
                filtered_pgns.append(game['pgn'])

    return filtered_pgns
