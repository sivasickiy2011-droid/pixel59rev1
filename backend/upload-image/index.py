import json
import os
import boto3
from botocore.config import Config
import base64
import uuid
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Загрузка изображений в S3 или Data URI
    Business: Универсальная функция загрузки изображений для логотипов, портфолио и других файлов
    Args: event - dict с httpMethod='POST', body содержит base64 изображение, filename и опциональный storage_type
          context - объект с request_id и другими атрибутами
    Returns: HTTP response с публичным URL или Data URI загруженного изображения
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        filename = body.get('filename', 'image.png')
        storage_type = body.get('storage_type', 's3')  # 's3' или 'data_uri'
        folder = body.get('folder', 'images')  # папка в S3 (portfolio, logos, etc)
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Image data is required'}),
                'isBase64Encoded': False
            }
        
        # Определяем тип файла
        file_ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'png'
        content_type_map = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        }
        content_type = content_type_map.get(file_ext, 'image/png')
        
        # Data URI режим (для логотипов и встроенных изображений)
        if storage_type == 'data_uri':
            data_uri = f'data:{content_type};base64,{image_base64}'
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'url': data_uri,
                    'type': 'data_uri'
                }),
                'isBase64Encoded': False
            }
        
        # S3 режим (для портфолио и больших файлов)
        image_data = base64.b64decode(image_base64)
        
        s3_endpoint = os.environ.get('S3_ENDPOINT_URL')
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        
        if not all([s3_endpoint, bucket_name, access_key, secret_key]):
            missing = []
            if not s3_endpoint: missing.append('S3_ENDPOINT_URL')
            if not bucket_name: missing.append('S3_BUCKET_NAME')
            if not access_key: missing.append('AWS_ACCESS_KEY_ID')
            if not secret_key: missing.append('AWS_SECRET_ACCESS_KEY')
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'S3 credentials not configured',
                    'missing': missing
                }),
                'isBase64Encoded': False
            }
        
        s3_client = boto3.client(
            's3',
            endpoint_url=s3_endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='ru-1',
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'}
            )
        )
        
        unique_filename = f"{folder}/{uuid.uuid4()}.{file_ext}"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=unique_filename,
            Body=image_data,
            ContentType=content_type,
            ACL='public-read'
        )
        
        image_url = f"{s3_endpoint}/{bucket_name}/{unique_filename}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'url': image_url,
                'filename': unique_filename,
                'type': 's3'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
