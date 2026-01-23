const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { generateToken, decodeAdminToken } = require('../middleware/auth');

const backendUUIDs = new Set([
  'f4905f63-ce85-4850-9f3a-2677d35f7d16', // track-visit
  '70951bfa-3fca-4f90-b41f-449db03fd019', // get-analytics
  '0254ff37-a984-465b-873c-b4aabdc73b96', // seo-analyze
  'f81db335-2453-41e1-9b1e-aaf4c61ea06f', // seo-apply
  'c3e66558-8a5b-42d7-b34d-ca6815cb2f76', // bot-logger
  '9e365935-6746-496e-8c6f-c4dddd4c655c', // bot-stats
  '743e5e24-86d0-4a6a-90ac-c71d80a5b822', // password-manager
  '6f0735b1-7477-4660-b2b0-0b694b4f36ea', // upload-image
  '28e36fe2-2513-4ae6-bf76-26a49b33c1bf', // brief-handler
  'fa56bf24-1e0b-4d49-8511-6befcd962d6f', // secure-settings
  '003b9991-d7d8-4f5d-8257-dee42fad0f91', // contact-form
  '91a16400-6baa-4748-9387-c7cdad64ce9c', // services-admin
  '40804d39-8296-462b-abc2-78ee1f80f0dd', // yandex-metrika-stats
  'f7cef033-563d-43d4-bc11-18ea42d54a00', // yandex-webmaster-issues
  '99ddd15c-93b5-4d9e-8536-31e6f6630304', // portfolio
  'c7b03587-cdba-48a4-ac48-9aa2775ff9a0', // admin-partner-logos
  '3f1e2a11-15ea-463e-9cec-11697b90090c', // partners
  'a074b7ff-c52b-4b46-a194-d991148dfa59', // partner-auth
  '4dbcd084-f89e-4737-be41-9371059c6e4d', // submit-order
  '4ea0202f-2619-4cf6-bc32-78c81e7beab3', // admin-login-logs
  'fcfd14ca-b5b0-4e96-bd94-e4db4df256d5', // auth-admin
  '80536dd3-4799-47a9-893a-a756a259460e', // consent
  '265f74c3-c0a3-4d44-b005-9119dff641cf', // news-feed
  '7aa533b8-b464-4b36-bd36-9c34cb6d0b8e', // news-admin
  'c5a1b2d3-e4f5-6789-abcd-ef0123456789', // news-admin-crud
]);

async function proxyToGatevey(req, res) {
  const { uuid } = req.params;
  const targetUrl = `http://127.0.0.1:3002/api/${uuid}`;
  const method = req.method;
  const headers = { ...req.headers, host: 'localhost:3002' };
  // Удаляем заголовки, которые могут мешать
  delete headers['content-length'];
  delete headers['host'];
  delete headers['connection'];
  
  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? JSON.stringify(req.body) : undefined;
  
  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
}

async function handleAuthAdmin(req, res) {
  const { password } = req.body;
  const result = await pool.query('SELECT * FROM users LIMIT 1');
  if (result.rows.length === 0) return res.status(401).json({ error: 'No users' });
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (valid) {
    const token = generateToken({ id: user.id, username: user.username, role: 'admin' }, '7d');
    return res.json({ success: true, token, user: { id: user.id, username: user.username } });
  }
  return res.status(401).json({ error: 'Invalid password' });
}

async function handleAdminLogs(req, res) {
  const result = await pool.query('SELECT * FROM admin_login_logs ORDER BY created_at DESC LIMIT 100');
  return res.json(result.rows);
}

async function handleAdminLogsCreate(req, res) {
  const { ip_address, user_agent, success } = req.body;
  const result = await pool.query(
    'INSERT INTO admin_login_logs (ip_address, user_agent, success) VALUES ($1, $2, $3) RETURNING *',
    [ip_address || 'unknown', user_agent || 'unknown', success || false]
  );
  return res.json(result.rows[0]);
}

async function handleAdminStats(req, res) {
  const total = await pool.query('SELECT COUNT(*) as total FROM admin_login_logs');
  const success = await pool.query('SELECT COUNT(*) as success FROM admin_login_logs WHERE success = true');
  const failed = await pool.query('SELECT COUNT(*) as failed FROM admin_login_logs WHERE success = false');
  return res.json({
    total_attempts: parseInt(total.rows[0].total),
    successful_logins: parseInt(success.rows[0].success),
    failed_attempts: parseInt(failed.rows[0].failed)
  });
}

async function handlePartners(req, res) {
  const result = await pool.query('SELECT * FROM partners WHERE is_active = true ORDER BY sort_order');
  return res.json(result.rows);
}

async function handlePartnerLogos(req, res) {
  const result = await pool.query('SELECT * FROM partners ORDER BY sort_order');
  return res.json(result.rows.map(p => ({ 
    id: p.id, 
    name: p.name, 
    logo_url: p.logo_url,
    website: p.website 
  })));
}

async function handlePartnerLogoCreate(req, res) {
  const { name, logo_url, website } = req.body;
  const result = await pool.query(
    'INSERT INTO partners (name, logo_url, website, sort_order, is_active) VALUES ($1, $2, $3, 0, true) RETURNING *',
    [name, logo_url, website]
  );
  return res.json({ success: true, id: result.rows[0].id });
}

async function handlePartnerLogoDelete(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM partners WHERE id = $1', [id]);
  return res.json({ success: true });
}

async function handleContact(req, res) {
  console.log('Contact form:', req.body);
  return res.json({ success: true, message: 'Sent' });
}

async function handleBrief(req, res) {
  console.log('Brief:', req.body);
  return res.json({ success: true, message: 'Brief received' });
}

async function handleAnalytics(req, res) { return res.json({ visitors: 100, pageViews: 500 }); }
async function handleMetrika(req, res) { return res.json({ visits: 100, views: 500 }); }
async function handleWebmaster(req, res) { return res.json([]); }
async function handleSeoAnalyze(req, res) { return res.json({ score: 80, suggestions: [] }); }
async function handleSeoApply(req, res) { return res.json({ success: true }); }
async function handleNews(req, res) { return res.json([]); }
async function handleNewsCreate(req, res) {
  const { title, content } = req.body;
  await pool.query('INSERT INTO news (title, content) VALUES ($1, $2)', [title, content]);
  return res.json({ success: true });
}
async function handleNewsDelete(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM news WHERE id = $1', [id]);
  return res.json({ success: true });
}
async function handleServices(req, res) { return res.json({ services: [] }); }
async function handleConsent(req, res) {
  return res.json({ consents: [] });
}
async function handleLegal(req, res, type) { return res.json({ content: 'Content' }); }
async function handleUpload(req, res) { return res.json({ success: true, url: '/img/uploaded.png' }); }
async function handleTrackVisit(req, res) { return res.json({ success: true }); }
async function handleSecureSettings(req, res) { return res.json([]); }
async function handlePasswords(req, res) { return res.json([]); }
async function handleBotStats(req, res) { return res.json({ bots: 10 }); }
async function handleBotLog(req, res) { return res.json({ success: true }); }
async function handlePartnerAuth(req, res) { return res.json({ success: true, token: 'partner-token' }); }

const adminProtectedUUIDs = new Set([
  '80536dd3-4799-47a9-893a-a756a259460e', // consent
  '91a16400-6baa-4748-9387-c7cdad64ce9c', // services-admin
]);

const requireAdminToken = (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: admin token required' });
    return false;
  }

  try {
    decodeAdminToken(token);
    return true;
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: invalid token' });
    return false;
  }
};

function getUUIDConfig(uuid) {
  const map = {
    '743e5e24-86d0-4a6a-90ac-c71d80a5b822': { method: 'POST', path: '/auth/admin' },
    'fcfd14ca-b5b0-4e96-bd94-e4db4df256d5': { method: 'BOTH', path: '/auth/admin/logs' },
    '4ea0202f-2619-4cf6-bc32-78c81e7beab3': { method: 'BOTH', path: '/partners/logos' },
    '3f1e2a11-15ea-463e-9cec-11697b90090c': { method: 'GET', path: '/consent' },
    '80536dd3-4799-47a9-893a-a756a259460e': { method: 'GET', path: '/consent' },
    '99ddd15c-93b5-4d9e-8536-31e6f6630304': { method: 'POST', path: '/auth/partner' },
    '265f74c3-c0a3-4d44-b005-9119dff641cf': { method: 'GET', path: '/partners' },
    '003b9991-d7d8-4f5d-8257-dee42fad0f91': { method: 'POST', path: '/contact' },
    'f4905f63-ce85-4850-9f3a-2677d35f7d16': { method: 'POST', path: '/contact' },
    '40804d39-8296-462b-abc2-78ee1f80f0dd': { method: 'POST', path: '/brief' },
    '28e36fe2-2513-4ae6-bf76-26a49b33c1bf': { method: 'GET', path: '/analytics' },
    '1103293c-17a5-453c-b290-c1c376ead996': { method: 'GET', path: '/analytics/metrika' },
    '70951bfa-3fca-4f90-b41f-449db03fd019': { method: 'GET', path: '/analytics/webmaster' },
    '23efbca4-f3c3-48b8-afb7-a2e528bf68f9': { method: 'POST', path: '/seo/analyze' },
    'f7cef033-563d-43d4-bc11-18ea42d54a00': { method: 'POST', path: '/seo/analyze' },
    'f75a6b04-8c4d-40ca-b0a1-adc0b31d79dd': { method: 'POST', path: '/seo/apply' },
    '91a16400-6baa-4748-9387-c7cdad64ce9c': { method: 'BOTH', path: '/news' },
    'c5a1b2d3-e4f5-6789-abcd-ef0123456789': { method: 'BOTH', path: '/news-admin-crud' },
    '4dbcd084-f89e-4737-be41-9371059c6e4d': { method: 'GET', path: '/services' },
    '5e53ea79-1c81-4c3f-847b-e8a82a5743c2': { method: 'GET', path: '/legal/terms' },
    '961bcfd3-a4a3-4d7e-b238-7d19be6f98e1': { method: 'GET', path: '/legal/privacy' },
    'c7b03587-cdba-48a4-ac48-9aa2775ff9a0': { method: 'POST', path: '/upload/image' },
    '6f0735b1-7477-4660-b2b0-0b694b4f36ea': { method: 'POST', path: '/upload/logo' },
    '9a3097d8-c2ab-4acb-917e-a6fb88252298': { method: 'POST', path: '/track-visit' },
    'c61d607d-a45d-40ee-88b9-34da6d3ca3e7': { method: 'GET', path: '/secure-settings' },
    'a074b7ff-c52b-4b46-a194-d991148dfa59': { method: 'GET', path: '/password-manager' },
    'f8daa3d3-22ba-4629-ac39-29eda98d18de': { method: 'POST', path: '/secure-settings' },
    '7127ce9f-37a5-4bde-97f7-12edc35f6ab5': { method: 'GET', path: '/bot/stats' },
    'fa56bf24-1e0b-4d49-8511-6befcd962d6f': { method: 'POST', path: '/bot/log' },
  };
  return map[uuid];
}

router.post('/:uuid', async (req, res) => {
  const { uuid } = req.params;
  if (backendUUIDs.has(uuid)) {
    return proxyToGatevey(req, res);
  }
  const config = getUUIDConfig(uuid);
  if (!config) return res.status(404).json({ error: 'UUID not found' });
  
  try {
    switch (config.path) {
      case '/auth/admin': return handleAuthAdmin(req, res);
      case '/auth/admin/logs': return handleAdminLogsCreate(req, res);
      case '/partners/logos': return handlePartnerLogoCreate(req, res);
      case '/contact': return handleContact(req, res);
      case '/brief': return handleBrief(req, res);
      case '/seo/analyze': return handleSeoAnalyze(req, res);
      case '/seo/apply': return handleSeoApply(req, res);
      case '/upload/image': case '/upload/logo': return handleUpload(req, res);
      case '/track-visit': return handleTrackVisit(req, res);
      case '/secure-settings': return handleSecureSettings(req, res);
      case '/bot/log': return handleBotLog(req, res);
      case '/auth/partner': return handlePartnerAuth(req, res);
      case '/news': return handleNewsCreate(req, res);
      case '/news-admin-crud': return handleNewsCreate(req, res);
      default: return res.json({ success: true });
    }
  } catch (error) {
    console.error('UUID POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:uuid', async (req, res) => {
  const { uuid } = req.params;
  if (backendUUIDs.has(uuid)) {
    return proxyToGatevey(req, res);
  }
  const config = getUUIDConfig(uuid);
  if (!config) return res.status(404).json({ error: 'UUID not found' });
  
  try {
    switch (config.path) {
      case '/news-admin-crud': return proxyToGatevey(req, res);
      default: return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('UUID PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:uuid', async (req, res) => {
  const { uuid } = req.params;
  if (backendUUIDs.has(uuid)) {
    return proxyToGatevey(req, res);
  }
  const config = getUUIDConfig(uuid);
  if (!config) return res.status(404).json({ error: 'UUID not found' });
  
  try {
    switch (config.path) {
      case '/news-admin-crud': return proxyToGatevey(req, res);
      default: return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('UUID PATCH error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:uuid', async (req, res) => {
  const { uuid } = req.params;
  if (backendUUIDs.has(uuid)) {
    return proxyToGatevey(req, res);
  }
  if (adminProtectedUUIDs.has(uuid) && !requireAdminToken(req, res)) {
    return;
  }
  const config = getUUIDConfig(uuid);
  if (!config) return res.status(404).json({ error: 'Not found' });
  if (config.method === 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    switch (config.path) {
      case '/auth/admin/logs': return handleAdminLogs(req, res);
      case '/partners': return handlePartners(req, res);
      case '/partners/logos': return handlePartnerLogos(req, res);
      case '/analytics': return handleAnalytics(req, res);
      case '/analytics/metrika': return handleMetrika(req, res);
      case '/analytics/webmaster': return handleWebmaster(req, res);
      case '/news': return handleNews(req, res);
      case '/news-admin-crud': return handleNews(req, res);
      case '/services': return handleServices(req, res);
      case '/consent': return handleConsent(req, res);
      case '/legal/terms': return handleLegal(req, res, 'terms');
      case '/legal/privacy': return handleLegal(req, res, 'privacy');
      case '/secure-settings': return handleSecureSettings(req, res);
      case '/password-manager': return handlePasswords(req, res);
      case '/bot/stats': return handleBotStats(req, res);
      default: return res.json({ success: true });
    }
  } catch (error) {
    console.error('UUID GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:uuid', async (req, res) => {
  const { uuid } = req.params;
  if (backendUUIDs.has(uuid)) {
    return proxyToGatevey(req, res);
  }
  const config = getUUIDConfig(uuid);
  if (!config) return res.status(404).json({ error: 'UUID not found' });
  
  try {
    switch (config.path) {
      case '/news-admin-crud': return proxyToGatevey(req, res);
      default: return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('UUID DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:uuid/:id', async (req, res) => {
  const { uuid, id } = req.params;
  if (backendUUIDs.has(uuid)) {
    return proxyToGatevey(req, res);
  }
  const config = getUUIDConfig(uuid);
  if (!config) return res.status(404).json({ error: 'Not found' });
  
  try {
    switch (config.path) {
      case '/partners/logos': return handlePartnerLogoDelete(req, res);
      case '/news': return handleNewsDelete(req, res);
      case '/news-admin-crud': return proxyToGatevey(req, res);
      default: return res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
