import json
import os
from datetime import datetime

LOG_PATH = os.environ.get('BACKEND_LOG_PATH', '/tmp/backend_requests.log')

def log_event(event_name: str, payload: dict) -> None:
    try:
        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event': event_name,
            'payload': payload
        }
        with open(LOG_PATH, 'a', encoding='utf-8') as log_file:
            log_file.write(json.dumps(entry, ensure_ascii=False) + '\n')
    except Exception:
        # best effort logging
        pass
