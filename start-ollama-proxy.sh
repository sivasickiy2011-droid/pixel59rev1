#!/bin/bash
echo "Starting ollama proxy..."

# Убить существующий процесс если есть
pkill -f "ollama-proxy.js" 2>/dev/null

# Запустить прокси
cd /home/deploy/vite_react_shadcn_ts
nohup node server/ollama-proxy.js > /tmp/ollama-proxy.log 2>&1 &
PROXY_PID=$!

echo "Started with PID: $PROXY_PID"
sleep 2

# Проверить
if curl -s http://localhost:3003/api/ollama/tags > /dev/null; then
    echo "SUCCESS: Ollama proxy is working!"
    curl -s http://localhost:3003/api/ollama/tags | head -c 300
else
    echo "FAILED: Checking logs..."
    cat /tmp/ollama-proxy.log
fi
