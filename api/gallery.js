// Vercel Serverless Function: GET/POST /api/gallery
// On Vercel, gallery is in-memory demo only (no persistent filesystem)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return empty array — no persistent storage on Vercel
    // Users should use the local dev server for full gallery persistence
    res.json([]);
    return;
  }

  if (req.method === 'POST') {
    // Accept the save but acknowledge it won't persist
    res.json({ success: true, count: 0, note: 'Gallery persistence requires local server or database' });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
