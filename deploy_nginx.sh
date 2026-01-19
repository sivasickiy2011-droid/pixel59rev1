#!/bin/bash
# Deploy nginx config with AI Chat proxy

cat > /tmp/new_nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name pixel59.ru www.pixel59.ru api.pixel59.ru cdn.pixel59.ru;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Main website (Frontend)
    server {
        listen 443 ssl http2;
        server_name pixel59.ru www.pixel59.ru;

        ssl_certificate /etc/letsencrypt/live/pixel59.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pixel59.ru/privkey.pem;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # AI Chat API Proxy (to backend)
        location /api/ai-chat/ {
            proxy_pass http://api:3001/api/ai-chat/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Ollama API Proxy
        location /api/ollama/ {
            proxy_pass http://172.16.57.77:11434/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            proxy_buffering off;
            proxy_read_timeout 300s;
        }

        # Python Gatevey API Proxy
        location /pyapi/ {
            proxy_pass http://127.0.0.1:3002/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    server {
        listen 443 ssl http2;
        server_name api.pixel59.ru;

        ssl_certificate /etc/letsencrypt/live/pixel59.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pixel59.ru/privkey.pem;

        location / {
            proxy_pass http://api:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Ollama API Proxy
    server {
        listen 443 ssl http2;
        server_name ollama.pixel59.ru;

        ssl_certificate /etc/letsencrypt/live/pixel59.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pixel59.ru/privkey.pem;

        location / {
            proxy_pass http://172.16.57.77:11434;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Ollama specific headers
            proxy_set_header Connection "";
            proxy_buffering off;
            proxy_read_timeout 300s;
        }
    }

    # CDN / MinIO
    server {
        listen 443 ssl http2;
        server_name cdn.pixel59.ru;

        ssl_certificate /etc/letsencrypt/live/pixel59.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pixel59.ru/privkey.pem;

        client_max_body_size 100M;

        location / {
            proxy_pass http://minio:9000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

cp /tmp/new_nginx.conf /etc/nginx/nginx.conf
nginx -t && nginx -s reload
echo "Nginx reloaded with AI Chat proxy"
