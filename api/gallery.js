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
        "metrics": {
          "ctr": 3.42,
          "cpm": 12.50,
          "aov": 145.00,
          "hook_rate": 42.1,
          "spend": 1240.00,
          "performance": "trending"
        },
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
        "metrics": {
          "ctr": 1.15,
          "cpm": 28.40,
          "aov": 89.00,
          "hook_rate": 18.5,
          "spend": 450.00,
          "performance": "underperforming"
        },
        "imageUrl": "https://images.unsplash.com/photo-1556742044-3c52d6e88c02?q=80&w=1000&auto=format&fit=crop&ar=16:9"
      },
      {
        "id": 1695221000000,
        "timestamp": "2026-03-21T12:00:00.000Z",
        "prompt": "Jordan practicing with Erwaldo cards in a high-tech gym, dramatic lighting, 16:9 aspect ratio.",
        "model": "nano-banana-2",
        "status": "generated",
        "type": "image",
        "avatar": "Jordan",
        "platform": "TikTok",
        "metrics": {
          "ctr": 5.80,
          "cpm": 8.20,
          "aov": 110.00,
          "hook_rate": 65.2,
          "spend": 3200.00,
          "performance": "trending"
        },
        "imageUrl": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop&ar=16:9"
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
