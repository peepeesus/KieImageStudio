// Vercel Serverless Function: POST /api/generate
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'] || process.env.KIE_API_KEY || '';
    if (!apiKey) return res.status(400).json({ error: 'No API key provided' });

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

    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
}
