import bcrypt


def normalize_hash(hash_str: str) -> str:
    hash_str = hash_str.strip()
    if hash_str.startswith('$2a$'):
        return '$2b$' + hash_str[4:]
    return hash_str


def verify_password(password: str, stored_hash: str) -> bool:
    if not password or not stored_hash:
        return False

    password_bytes = password.encode('utf-8')
    normalized_hash = normalize_hash(stored_hash)
    hash_bytes = normalized_hash.encode('utf-8')
    try:
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except ValueError:
        return False


def hash_password(password: str, rounds: int = 12) -> str:
    salt = bcrypt.gensalt(rounds)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
