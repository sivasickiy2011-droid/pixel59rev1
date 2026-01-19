const http = require('http');
const URL = require('url');

const OLLAMA_HOST = '172.16.57.77';
const OLLAMA_PORT = 11434;
const PROXY_PORT = 3003;

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  const path = req.url.replace('/api/ollama', '');
  const url = URL.parse(`http://${OLLAMA_HOST}:${OLLAMA_PORT}${path}`);

  const options = {
    hostname: OLLAMA_HOST,
    port: OLLAMA_PORT,
    path: path,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Add CORS headers
    const headers = {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: err.message });
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`Ollama proxy running on port ${PROXY_PORT}`);
});
