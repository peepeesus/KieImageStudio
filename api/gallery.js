// Vercel Serverless Function: GET/POST /api/gallery
// On Vercel, gallery is in-memory demo only (no persistent filesystem)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return sample demo data from previous generation for Vercel
    res.json([
      {
        "id": 1695223000000,
        "timestamp": "2026-03-21T17:40:00.000Z",
        "prompt": "A high-end editorial fashion shot of a premium purple handbag sitting abandoned outside a dorm room door in the evening, a shimmering puddle reflecting a nearby streetlights warm glow, soft light rain falling. Moody and atmospheric, 16:9 aspect ratio.",
        "model": "nano-banana-2",
        "status": "generated",
        "type": "image",
        "avatar": "Nora",
        "platform": "Instagram",
        "imageUrl": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1000&auto=format&fit=crop&ar=16:9"
      },
      {
        "id": 1695222000000,
        "timestamp": "2026-03-21T15:05:00.000Z",
        "prompt": "Premium close-up of an Erwaldo NFC backup card on a minimalist dark desk, sharp focus, 16:9 aspect ratio.",
        "model": "nano-banana-2",
        "status": "generated",
        "type": "image",
        "avatar": "Elias",
        "platform": "Facebook",
        "imageUrl": "https://images.unsplash.com/photo-1556742044-3c52d6e88c02?q=80&w=1000&auto=format&fit=crop&ar=16:9"
      }
    ]);
    return;
  }

  if (req.method === 'POST') {
    // Accept the save but acknowledge it won't persist
    res.json({ success: true, count: 0, note: 'Gallery persistence requires local server or database' });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
