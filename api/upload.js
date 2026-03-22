// Vercel Serverless Function: POST /api/upload
// Accepts raw body as base64 for image upload
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // On Vercel, we handle base64 uploads directly from the frontend
    const { data, name, mimeType } = req.body;
    if (!data) return res.status(400).json({ error: 'No image data provided' });

    const dataUrl = `data:${mimeType || 'image/png'};base64,${data}`;
    res.json({ url: dataUrl, name: name || 'upload.png', size: data.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
