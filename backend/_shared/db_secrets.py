'''
Shared utility: Reads secrets from encrypted database storage
Usage: from _shared.db_secrets import get_secret
'''

import os
import base64
import psycopg2
from typing import Optional

_cache = {}

def get_db_connection():
    '''Creates database connection'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def decrypt_value(encrypted: str) -> str:
    '''Decrypts base64 encoded value'''
    return base64.b64decode(encrypted.encode()).decode()

def get_secret(key: str, fallback_env: bool = True) -> Optional[str]:
    '''
    Reads secret from database, with optional fallback to environment variable
    
    Args:
        key: Secret key name (e.g., 'OPENAI_API_KEY')
        fallback_env: If True, falls back to os.environ.get(key) if not found in DB
    
    Returns:
        Secret value or None
    '''
    # Check cache first
    if key in _cache:
        return _cache[key]
    
    # Try database
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT encrypted_value FROM secure_settings WHERE key = %s",
            (key,)
        )
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            value = decrypt_value(row[0])
            _cache[key] = value
            return value
    except Exception as e:
        print(f'Database secret read error for {key}: {str(e)}')
    
    # Fallback to environment variable
    if fallback_env:
        env_value = os.environ.get(key)
        if env_value:
            _cache[key] = env_value
            return env_value
    
    return None
