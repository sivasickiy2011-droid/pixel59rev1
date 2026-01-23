import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import redis

from backend._shared.security import ensure_admin_authorized

MAX_LIMIT = 100
CACHE_TTL_SECONDS = 30
SLOW_QUERY_THRESHOLD_MS = 250


def get_redis_client() -> redis.Redis:
    url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    return redis.from_url(url, decode_responses=True)


def cors_response(status: int, body: str) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        },
        'body': body,
        'isBase64Encoded': False
    }


def json_response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body),
        'isBase64Encoded': False
    }


def get_db_connection() -> psycopg2.extensions.connection:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise RuntimeError('Database not configured')
    return psycopg2.connect(database_url)


def parse_bool(value: str) -> Optional[bool]:
    if value is None:
        return None
    lowered = value.lower()
    if lowered in {'true', '1'}:
        return True
    if lowered in {'false', '0'}:
        return False
    return None


def build_filters(params: Dict[str, str]) -> Tuple[str, List[Any]]:
    clauses: List[str] = []
    args: List[Any] = []
    if start := params.get('start_date'):
        clauses.append('created_at >= %s')
        args.append(start)
    if end := params.get('end_date'):
        clauses.append('created_at <= %s')
        args.append(end)
    if ip := params.get('ip'):
        clauses.append('ip_address LIKE %s')
        args.append(f'%{ip}%')
    if status := params.get('success'):
        success_flag = parse_bool(status)
        if success_flag is not None:
            clauses.append('success = %s')
            args.append(success_flag)
    if user_agent := params.get('user_agent'):
        clauses.append('user_agent ILIKE %s')
        args.append(f'%{user_agent}%')
    if clauses:
        return ' WHERE ' + ' AND '.join(clauses), args
    return '', []


def mask_ip(ip_address: str) -> str:
    parts = ip_address.split('.')
    if len(parts) == 4:
        return '.'.join(parts[:2] + ['***', '***'])
    return ip_address


def cache_stats(client: redis.Redis, key: str, stats: Dict[str, Any]) -> None:
    client.setex(f"admin-logs:stats:{key}", CACHE_TTL_SECONDS, json.dumps(stats))


def get_cached_stats(client: redis.Redis, key: str) -> Optional[Dict[str, Any]]:
    raw = client.get(f"admin-logs:stats:{key}")
    if not raw:
        return None
    return json.loads(raw)


def fetch_logs(limit: int, offset: int, filters: str, args: List[Any], sort: str, direction: str) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    start = time.time()
    cursor.execute(f"SELECT COUNT(*) FROM admin_login_logs{filters}", tuple(args))
    total = cursor.fetchone()[0]
    sorting = f"ORDER BY {sort} {direction}"
    cursor.execute(
        f"SELECT id, ip_address, user_agent, success, created_at FROM admin_login_logs{filters} {sorting} LIMIT %s OFFSET %s",
        (*args, limit, offset)
    )
    rows = cursor.fetchall()
    duration_ms = (time.time() - start) * 1000
    if duration_ms > SLOW_QUERY_THRESHOLD_MS:
        print(f"[WARN] Slow admin_logs query: {duration_ms:.2f} ms")
    cursor.close()
    conn.close()
    masks = []
    for row in rows:
        masks.append({
            'id': row[0],
            'ip_address': mask_ip(row[1]),
            'user_agent': row[2],
            'success': row[3],
            'created_at': row[4].isoformat() if row[4] else None
        })
    return masks, {
        'total': total,
        'limit': limit,
        'offset': offset,
        'has_more': offset + limit < total
    }


def fetch_stats(filters: str, args: List[Any], cache_key: str) -> Dict[str, Any]:
    client = get_redis_client()
    cached = get_cached_stats(client, cache_key)
    if cached:
        return cached
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM admin_login_logs{filters}", tuple(args))
    total = cursor.fetchone()[0]
    success_filters = f"{filters} AND success = true" if filters else " WHERE success = true"
    cursor.execute(f"SELECT COUNT(*) FROM admin_login_logs{success_filters}", tuple(args))
    success_count = cursor.fetchone()[0]
    failed_filters = f"{filters} AND success = false" if filters else " WHERE success = false"
    cursor.execute(f"SELECT COUNT(*) FROM admin_login_logs{failed_filters}", tuple(args))
    failed_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    stats = {
        'total_attempts': total,
        'success_count': success_count,
        'failed_count': failed_count
    }
    cache_stats(client, cache_key, stats)
    return stats


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    params = event.get('queryStringParameters') or {}
    if method == 'OPTIONS':
        return cors_response(200, '')
    if method != 'GET':
        return json_response(405, {'error': 'Method not allowed'})
    if params.get('health'):
        start = time.time()
        try:
            conn = get_db_connection()
            conn.cursor().execute('SELECT 1')
            conn.close()
            latency_ms = (time.time() - start) * 1000
        except Exception as err:
            return json_response(503, {'status': 'error', 'detail': str(err)})
        if latency_ms > SLOW_QUERY_THRESHOLD_MS:
            print(f"[WARN] Health check slow: {latency_ms:.2f} ms")
        return json_response(200, {'status': 'ok', 'db_latency_ms': latency_ms})
    payload = ensure_admin_authorized(headers)
    if not payload:
        return json_response(401, {'error': 'Authorization required'})
    params = event.get('queryStringParameters') or {}
    limit = min(int(params.get('limit') or 50), MAX_LIMIT)
    offset = max(int(params.get('offset') or 0), 0)
    sort = params.get('sort_by', 'created_at')
    if sort not in {'created_at', 'ip_address', 'success'}:
        sort = 'created_at'
    direction = params.get('direction', 'DESC').upper()
    if direction not in {'ASC', 'DESC'}:
        direction = 'DESC'
    filters, args = build_filters(params)
    cache_key = f"{limit}:{offset}:{sort}:{direction}:{json.dumps(params)}"
    stats = fetch_stats(filters, args, cache_key)
    logs, pagination = fetch_logs(limit, offset, filters, args, sort, direction)
    if params.get('export') == 'csv':
        csv_body = "id,ip_address,user_agent,success,created_at\n"
        csv_body += '\n'.join(
            f"{log['id']},{log['ip_address']},{log['user_agent']},{log['success']},{log['created_at']}" for log in logs
        )
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/csv',
                'Access-Control-Allow-Origin': '*'
            },
            'body': csv_body,
            'isBase64Encoded': False
        }
    if params.get('export') == 'json':
        return json_response(200, {'logs': logs, 'stats': stats, 'pagination': pagination})
    cache_key = f"{limit}:{offset}:{sort}:{direction}"
    client = get_redis_client()
    client.setex(f"admin-logs:logs:{cache_key}", CACHE_TTL_SECONDS, json.dumps(logs))
    return json_response(200, {'logs': logs, 'stats': stats, 'pagination': pagination})
