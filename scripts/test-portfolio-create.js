import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const AUTH_URL = `${API_BASE_URL}/api/auth/admin`;
const UPLOAD_URL = `${API_BASE_URL}/api/6f0735b1-7477-4660-b2b0-0b694b4f36ea`;
const PORTFOLIO_URL = `${API_BASE_URL}/api/99ddd15c-93b5-4d9e-8536-31e6f6630304`;

const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Xw1Utoce1';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const LOG_PATH = path.join(__dirname, 'test-portfolio-create.log');

const IMAGE_DIRS = [
  path.join(__dirname, '..', 'public', 'portfolio-samples'),
  path.join(__dirname, '..', 'public', 'img'),
  path.join(__dirname, '..', 'dist-preview', 'img'),
];

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

const log = async (message, data) => {
  const time = new Date().toISOString();
  const line = data ? `${time} ${message} ${JSON.stringify(data)}\n` : `${time} ${message}\n`;
  await fs.appendFile(LOG_PATH, line, 'utf8');
  process.stdout.write(line);
};

const readImagesFromDirs = async () => {
  const files = [];
  for (const dir of IMAGE_DIRS) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!ALLOWED_EXT.has(ext)) continue;
        files.push({
          dir,
          name: entry.name,
          fullPath: path.join(dir, entry.name),
        });
      }
    } catch (error) {
      await log('[WARN] Failed to read dir', { dir, error: error.message });
    }
  }
  return files;
};

const toBase64 = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return buffer.toString('base64');
};

const uploadImage = async (filePath) => {
  const filename = path.basename(filePath);
  const base64 = await toBase64(filePath);
  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      filename,
      storage_type: 'local',
      folder: 'portfolio',
    }),
  });

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    await log('[ERROR] Upload JSON parse failed', { filename, status: response.status, text });
  }

  if (!response.ok) {
    await log('[ERROR] Upload failed', { filename, status: response.status, data });
    throw new Error(`Upload failed: ${response.status}`);
  }

  if (!data?.url) {
    await log('[ERROR] Upload missing url', { filename, data });
    throw new Error('Upload response missing url');
  }

  return data.url;
};

const authAdmin = async () => {
  if (ADMIN_TOKEN) {
    await log('[INFO] Using ADMIN_TOKEN from env');
    return ADMIN_TOKEN;
  }
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    await log('[ERROR] Auth JSON parse failed', { status: response.status, text });
  }

  if (!response.ok) {
    await log('[ERROR] Auth failed', { status: response.status, data });
    throw new Error(`Auth failed: ${response.status}`);
  }

  if (!data?.token) {
    await log('[ERROR] Auth missing token', { data });
    throw new Error('Auth response missing token');
  }

  return data.token;
};

const createProject = async (token, project) => {
  const response = await fetch(PORTFOLIO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify(project),
  });

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    await log('[ERROR] Create JSON parse failed', { status: response.status, text });
  }

  if (!response.ok) {
    await log('[ERROR] Create failed', { status: response.status, data });
    throw new Error(`Create failed: ${response.status}`);
  }

  return data;
};

const buildProjectPayload = (urls) => {
  const title = 'ТестПроект';
  return {
    title,
    description: 'Тестовая карточка портфолио (авто-скрипт)',
    image_url: urls.image_url || '',
    carousel_image_url: urls.carousel_image_url || '',
    preview_image_url: urls.preview_image_url || '',
    gallery_images: urls.gallery_images || [],
    website_url: 'https://example.com',
    display_order: 0,
    is_active: true,
  };
};

const run = async () => {
  await fs.writeFile(LOG_PATH, '', 'utf8');
  await log('[START] test-portfolio-create');
  await log('[INFO] API_BASE_URL', { API_BASE_URL });
  await log('[INFO] Image dirs', { IMAGE_DIRS });

  const images = await readImagesFromDirs();
  if (images.length === 0) {
    await log('[ERROR] No images found in configured directories');
    process.exitCode = 1;
    return;
  }

  await log('[INFO] Found images', { count: images.length });

  const selected = images.slice(0, 5);
  await log('[INFO] Selected images', { selected: selected.map((f) => f.fullPath) });

  let token = '';
  try {
    token = await authAdmin();
    await log('[INFO] Auth success');
  } catch (error) {
    await log('[FATAL] Auth error', { message: error.message });
    process.exitCode = 1;
    return;
  }

  const urls = {
    image_url: '',
    carousel_image_url: '',
    preview_image_url: '',
    gallery_images: [],
  };

  try {
    urls.image_url = await uploadImage(selected[0].fullPath);
    urls.carousel_image_url = await uploadImage(selected[1]?.fullPath || selected[0].fullPath);
    urls.preview_image_url = await uploadImage(selected[2]?.fullPath || selected[0].fullPath);
    urls.gallery_images = [];
    const galleryCandidates = selected.slice(3, 5);
    for (const item of galleryCandidates) {
      const url = await uploadImage(item.fullPath);
      urls.gallery_images.push(url);
    }
    await log('[INFO] Uploads completed', urls);
  } catch (error) {
    await log('[FATAL] Upload error', { message: error.message });
    process.exitCode = 1;
    return;
  }

  const payload = buildProjectPayload(urls);
  await log('[INFO] Creating project', payload);

  try {
    const result = await createProject(token, payload);
    await log('[SUCCESS] Project created', { id: result?.id, result });
  } catch (error) {
    await log('[FATAL] Create error', { message: error.message });
    process.exitCode = 1;
  }

  await log('[END] test-portfolio-create');
};

run().catch(async (error) => {
  await log('[FATAL] Unhandled error', { message: error.message, stack: error.stack });
  process.exitCode = 1;
});
