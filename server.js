import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const KIE_BASE = 'https://api.kie.ai/api/v1/jobs';

function getApiKey(req) {
  const fromHeader = req.headers['x-api-key'];
  return fromHeader || process.env.KIE_API_KEY || '';
}

// Create generation/edit task
app.post('/api/generate', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ error: 'No API key provided' });

    // Ensure we handle both nested (from api.js) and flat structures
    const body = req.body;
    const model = body.model || 'nano-banana-2';
    const input = body.input || {};

    const payload = {
      model,
      input: {
        prompt: input.prompt || body.prompt || '',
        aspect_ratio: input.aspect_ratio || body.aspect_ratio || 'auto',
        resolution: input.resolution || body.resolution || '1K',
        output_format: input.output_format || body.output_format || 'jpg'
      }
    };

    if (input.google_search || body.google_search) payload.input.google_search = true;
    if (input.image_input || body.image_input) payload.input.image_input = input.image_input || body.image_input;

    const response = await fetch(`${KIE_BASE}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Kie.ai Response:', data); // Log for debugging
    res.json(data);
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Poll task status (supports both /api/status/:taskId and /api/status?taskId=xxx)
app.get('/api/status/:taskId?', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) return res.status(400).json({ error: 'No API key provided' });

    const taskId = req.params.taskId || req.query.taskId;
    if (!taskId) return res.status(400).json({ error: 'No taskId provided' });

    const response = await fetch(`${KIE_BASE}/recordInfo?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload image → base64 data URL
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64}`;
    res.json({ url: dataUrl, name: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Proxy image download (avoids CORS on result images)
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).json({ error: 'No url param' });
    const response = await fetch(imageUrl);
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType || 'image/jpeg');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Persistence — Gallery Store
const GALLERY_PATH = path.join(__dirname, 'gallery.json');

function readGallery() {
  if (!existsSync(GALLERY_PATH)) return [];
  try {
    return JSON.parse(readFileSync(GALLERY_PATH, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveGallery(data) {
  writeFileSync(GALLERY_PATH, JSON.stringify(data, null, 2));
}

// Get gallery
app.get('/api/gallery', (req, res) => {
  res.json(readGallery());
});

// Update gallery (overwrite or append)
app.post('/api/gallery', (req, res) => {
  try {
    const item = req.body;
    const gallery = readGallery();
    gallery.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item
    });
    // Keep max 200 items for the sheet view
    if (gallery.length > 200) gallery.pop();
    saveGallery(gallery);
    res.json({ success: true, count: gallery.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3011;
app.listen(PORT, () => {
  console.log(`🚀 Kie Image Studio API running on http://localhost:${PORT}`);
});
