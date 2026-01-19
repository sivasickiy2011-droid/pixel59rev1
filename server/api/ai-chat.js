const express = require('express');
const router = express.Router();

const OLLAMA_HOST = '172.16.57.77';
const OLLAMA_PORT = 11434;

// Proxy all requests to Ollama
router.all('/*', async (req, res) => {
  const path = req.path;
  
  try {
    // Modify request body if needed
    let requestBody = req.body;
    if (requestBody && requestBody.model) {
      // Replace llama3 with deepseek-coder:6.7b
      if (requestBody.model === 'llama3') {
        requestBody.model = 'deepseek-coder:6.7b';
      }
    }
    
    const response = await fetch(`http://${OLLAMA_HOST}:${OLLAMA_PORT}/api${path}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    // Ollama returns streaming JSON - read as lines
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
            }
            if (data.done) {
              res.json({ response: fullResponse });
              return;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    // Fallback if no done signal
    if (fullResponse) {
      res.json({ response: fullResponse });
    } else {
      // Try to parse as regular JSON
      try {
        const data = JSON.parse(buffer);
        res.json(data);
      } catch (e) {
        res.json({ response: buffer });
      }
    }
  } catch (error) {
    console.error('Ollama proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
