// Vercel Serverless Function: GET /api/status?taskId=xxx
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'] || process.env.KIE_API_KEY || '';
    if (!apiKey) return res.status(400).json({ error: 'No API key provided' });

    const taskId = req.query.taskId;
    if (!taskId) return res.status(400).json({ error: 'No taskId provided' });

    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: err.message });
  }
}
