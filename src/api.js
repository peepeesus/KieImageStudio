// Kie.ai API Client
// All calls go through the Express backend proxy

const API_BASE = '/api';
const LOCAL_SERVER = '/api';

export function getApiKey() {
    return localStorage.getItem('kie_api_key') || '';
}

export function setApiKey(key) {
    localStorage.setItem('kie_api_key', key);
}

// Gallery Persistence (now uses Local Server)
export async function saveToGallery(item) {
    try {
        const response = await fetch(`${LOCAL_SERVER}/gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return await response.json();
    } catch (err) {
        console.error('Gallery sync error:', err);
        // Fallback or handle offline
    }
}

export async function getGallery() {
    try {
        const response = await fetch(`${LOCAL_SERVER}/gallery`);
        return await response.json();
    } catch (err) {
        console.error('Gallery load error:', err);
        return [];
    }
}

function headers() {
    return { 'Content-Type': 'application/json', 'X-Api-Key': getApiKey() };
}


// Model Constants
export const MODELS = {
    IMAGE_FAST: 'nano-banana-2',
    IMAGE_PRO: 'nano-banana-pro',
    VIDEO_VEO: 'veo-3-1',
    VIDEO_KLING: 'kling-3-0',
    VIDEO_SORA: 'sora-2-pro'
};

// Style Presets (RoboNuggets Enhanced)
export const STYLES = {
    'Photorealistic': {
        prefix: 'A photorealistic',
        suffix: 'Captured with professional camera equipment, natural lighting, sharp details, high dynamic range.'
    },
    'Cinematic': {
        prefix: 'A cinematic film still of',
        suffix: 'Dramatic lighting, shallow depth of field, anamorphic lens flare, color graded in teal and orange.'
    },
    'Ad — Organic': {
        prefix: 'A high-quality organic social media advertisement of',
        suffix: 'UGC style, authentic lighting, scroll-stopping composition, natural colors, native social media aesthetic.'
    },
    'Ad — Luxury': {
        prefix: 'A high-end luxury fashion editorial advertisement of',
        suffix: 'Vogue-quality styling, dramatic editorial lighting, minimal composition, haute couture aesthetic, premium finish.'
    },
    'Ad — Tech': {
        prefix: 'A futuristic tech product advertisement for',
        suffix: 'Clean minimalist background, blue rim lighting, sharp focus, commercial quality, Apple-inspired aesthetic.'
    },
    '3D Render': {
        prefix: 'A high-quality 3D render of',
        suffix: 'Studio lighting, PBR materials, octane render quality, smooth surfaces, ambient occlusion.'
    },
    'Illustration': {
        prefix: 'A beautiful illustration of',
        suffix: 'Digital art style, vibrant colors, clean lines, professional quality illustration.'
    },
    'Anime': {
        prefix: 'An anime-style illustration of',
        suffix: 'Studio Ghibli inspired, soft colors, detailed backgrounds, expressive characters.'
    },
    'Erwaldo — Editorial': {
        prefix: 'A high-end editorial fashion shot of',
        suffix: 'Premium minimalist aesthetic, Playfair Display typography vibes, deep navy and warm leather tones, authoritative lighting, Vogue-standard composition.'
    },
    'Erwaldo — Product': {
        prefix: 'A professional product shot of',
        suffix: 'Sharp focus, No-Line minimalist background, studio lighting, matte finish, premium packaging aesthetic, clean white and beige accents.'
    }
};

export function enhancePrompt(rawPrompt, styleName, aspectRatio) {
    if (styleName === 'Raw') return rawPrompt;
    const style = STYLES[styleName];
    if (!style) return rawPrompt;

    let enhanced = rawPrompt;
    // Rule 1: Smart Prefix Injection
    if (!/^(A|An|The)\b/i.test(enhanced)) {
        enhanced = `${style.prefix} ${enhanced.charAt(0).toLowerCase() + enhanced.slice(1)}`;
    }
    // Rule 2 & 6: Suffix and Technical Tags
    const qualityTags = "ultra-detailed, 8K resolution, masterpiece quality, sharp focus, intricate details.";
    enhanced = `${enhanced}. ${style.suffix} ${qualityTags}`;
    // Rule 3: Aspect Ratio Context
    enhanced += ` Image should be in ${aspectRatio} aspect ratio format.`;
    return enhanced;
}

/**
 * Create a generation or edit task (Image or Video)
 */
export async function createTask({ prompt, aspect_ratio = '1:1', resolution = '1K', output_format = 'png', google_search = false, image_input = null, model_id = null }) {
    const key = getApiKey();
    if (!key) throw new Error('API key not found');

    const model = model_id || localStorage.getItem('kie_model') || MODELS.IMAGE_FAST;
    const body = {
        model,
        input: {
            prompt,
            aspect_ratio,
            resolution,
            output_format: 'png',
        }
    };
    if (google_search) body.input.google_search = true;
    if (image_input) body.input.image_input = image_input;

    const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

/**
 * Poll task status until completed / failed
 * Following Polling Strategy: 5s interval, 180s max wait
 */
export async function pollTask(taskId, onProgress) {
    const interval = 5000;
    const maxWait = 180000;
    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < maxWait) {
        await sleep(interval);
        attempts++;

        try {
            const res = await fetch(`${API_BASE}/status?taskId=${taskId}`, { headers: headers() });
            if (!res.ok) continue;
            const result = await res.json();
            const data = result.data || {};
            const state = (data.state || '').toLowerCase();

            if (onProgress) onProgress({ attempt: attempts, state, data });

            const successStates = ['success', 'completed', 'done', 'finished'];
            const failedStates = ['failed', 'error', 'cancelled'];

            if (successStates.includes(state)) {
                const imageUrl = extractImageUrl(data);
                return { status: 'success', imageUrl, data };
            }

            if (failedStates.includes(state)) {
                return { status: 'failed', data };
            }
        } catch (err) {
            console.warn(`Poll ${attempts} error:`, err);
        }
    }

    return { status: 'timeout' };
}

/**
 * Extraction Chain (9 steps from instructions)
 */
function extractImageUrl(data) {
    if (!data) return null;

    let rj = {};
    const rawResultJson = data.resultJson;

    // 1-5. Extraction from resultJson
    if (rawResultJson) {
        if (typeof rawResultJson === 'string' && rawResultJson.startsWith('http')) return rawResultJson;
        
        try {
            rj = typeof rawResultJson === 'string' ? JSON.parse(rawResultJson) : rawResultJson;
            if (rj.resultUrls && rj.resultUrls[0]) return rj.resultUrls[0];
            if (rj.resultUrl) return rj.resultUrl;
            if (rj.images && rj.images[0]) return rj.images[0];
            if (rj.url) return rj.url;
            if (rj.image_url) return rj.image_url;
        } catch (e) {
            console.warn('Failed to parse resultJson:', e);
        }
    }

    // 6-8. Extraction from top level or output
    if (data.image_url || data.imageUrl) return data.image_url || data.imageUrl;
    if (data.url) return data.url;
    if (data.output) {
        if (data.output.image_url) return data.output.image_url;
        if (data.output.url) return data.output.url;
    }

    // 9. Deep search
    const findUrl = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        for (let key in obj) {
            const val = obj[key];
            if (typeof val === 'string' && /^https?:\/\//.test(val)) {
                if (/\.(png|jpg|jpeg|webp|gif)/i.test(val) || val.includes('tempfile') || val.includes('cdn')) {
                    return val;
                }
            } else if (typeof val === 'object') {
                const found = findUrl(val);
                if (found) return found;
            }
        }
        return null;
    };

    return findUrl(data);
}

/**
 * Upload an image file via the backend
 */
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload error: ${res.status}`);
    return res.json();
}

/**
 * Get a proxied image URL to avoid CORS
 */
export function getProxiedImageUrl(originalUrl) {
    if (!originalUrl) return '';
    if (originalUrl.startsWith('data:')) return originalUrl;
    return `${API_BASE}/proxy-image?url=${encodeURIComponent(originalUrl)}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
