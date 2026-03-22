// Video View — AI Video Generation (Veo, Kling, Sora)
import { createTask, pollTask, getProxiedImageUrl, getApiKey, STYLES, enhancePrompt, MODELS, saveToGallery } from '../api.js';
import { showToast } from '../main.js';

export function renderVideo(container) {
    container.innerHTML = `
    <h1 class="view-title">Video Studio</h1>
    <p class="view-subtitle">Generate cinematic AI videos with Veo 3.1, Kling 3.0, and Sora 2 Pro.</p>

    <div class="glass-panel main-input-panel">
      <div class="form-group">
        <label class="form-label" for="video-prompt">Scene Description</label>
        <textarea
          id="video-prompt"
          class="form-textarea"
          placeholder="A futuristic car racing through a neon-lit city at night, heavy rain, reflection on asphalt..."
          rows="4"
        ></textarea>
      </div>

      <div class="controls-grid">
        <div class="form-group">
          <label class="form-label" for="video-model">Video Model</label>
          <select id="video-model" class="form-select">
            <option value="${MODELS.VIDEO_VEO}">Google Veo 3.1 (Cinematic)</option>
            <option value="${MODELS.VIDEO_KLING}">Kling 3.0 (Realistic Motion)</option>
            <option value="${MODELS.VIDEO_SORA}">Sora 2 Pro (Production Quality)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="video-style">Style Preset</label>
          <select id="video-style" class="form-select">
            ${Object.keys(STYLES).map(s => `<option value="${s}">${s}</option>`).join('')}
            <option value="Raw">Raw (No Enhancement)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="video-aspect">Aspect Ratio</label>
          <select id="video-aspect" class="form-select">
            <option value="16:9">16:9 Widescreen</option>
            <option value="9:16">9:16 Portrait (Story)</option>
            <option value="1:1">1:1 Square</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="video-duration">Duration</label>
          <select id="video-duration" class="form-select">
            <option value="5s">5 Seconds</option>
            <option value="10s" selected>10 Seconds</option>
            <option value="15s">15 Seconds</option>
          </select>
        </div>
      </div>

      <div class="section-divider"></div>

      <div class="flex-center">
        <button id="video-generate-btn" class="btn btn-primary btn-lg">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Generate Video
        </button>
      </div>
    </div>

    <div id="video-result" class="result-section" style="display: none;"></div>
  `;

    container.querySelector('#video-generate-btn').addEventListener('click', () => {
        handleVideoGenerate(container);
    });
}

async function handleVideoGenerate(container) {
    const rawPrompt = container.querySelector('#video-prompt').value.trim();
    if (!rawPrompt) { showToast('Please enter a description', 'error'); return; }
    if (!getApiKey()) { showToast('Please set your API key in Settings', 'error'); return; }

    const model_id = container.querySelector('#video-model').value;
    const styleName = container.querySelector('#video-style').value;
    const aspect_ratio = container.querySelector('#video-aspect').value;
    const duration = container.querySelector('#video-duration').value;

    // Enhance prompt
    const prompt = enhancePrompt(rawPrompt, styleName, aspect_ratio);

    const generateBtn = container.querySelector('#video-generate-btn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="skeleton-spinner" style="width:20px;height:20px;border-width:2px;"></div> Initializing...';

    const resultDiv = container.querySelector('#video-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-spinner"></div>
      <div class="skeleton-text">Engines warming up... Generating Video (${duration})</div>
      <div class="skeleton-text" id="video-poll-status" style="margin-top: 4px; font-size: 12px; opacity: 0.7;">Queueing...</div>
    </div>
  `;

    try {
        const taskResult = await createTask({
            prompt,
            aspect_ratio,
            model_id
        });
        const taskId = taskResult?.data?.taskId;
        if (!taskId) throw new Error(taskResult?.message || 'No task ID returned');

        const statusEl = container.querySelector('#video-poll-status');
        if (statusEl) statusEl.textContent = `Task: ${taskId.slice(0, 8)}... This may take up to 2-3 mins.`;

        const result = await pollTask(taskId, ({ attempt, state }) => {
            if (statusEl) statusEl.textContent = `Step ${attempt}: ${state || 'waiting'}...`;
        });

        if (result.status === 'success' && result.imageUrl) {
            const proxiedUrl = getProxiedImageUrl(result.imageUrl);
            
            // For video, we try to use a <video> element
            resultDiv.innerHTML = `
        <div class="result-video-wrapper">
          <video class="result-video" controls autoplay loop>
            <source src="${proxiedUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div class="result-details" style="margin-top: 20px; padding: 0 20px;">
           <p style="font-size: 13px; color: var(--text-tertiary); line-height: 1.5;">
             <strong style="color: var(--text-secondary);">Enhanced Video Prompt:</strong><br/>
             ${prompt}
           </p>
        </div>
        <div class="result-actions">
          <a class="btn btn-primary" href="${proxiedUrl}" download="kie-video-${Date.now()}.mp4">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Video
          </a>
        </div>
      `;

            saveToGallery({ 
                prompt: rawPrompt, 
                enhancedPrompt: prompt, 
                imageUrl: result.imageUrl, 
                aspect_ratio, 
                model: model_id,
                type: 'video',
                status: 'ready'
            });
            showToast('Video generated successfully!', 'success');
        } else if (result.status === 'failed') {
            throw new Error(result.data?.errorMessage || 'Video generation failed');
        } else {
            throw new Error('Task timed out after 3 minutes');
        }

    } catch (err) {
        resultDiv.innerHTML = `
      <div class="glass-panel" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--error); font-size: var(--font-size-lg);">Generation Failed</p>
        <p style="color: var(--text-tertiary);">${err.message}</p>
        <button class="btn btn-secondary" style="margin-top: var(--space-md);" onclick="this.closest('.result-section').style.display='none'">Dismiss</button>
      </div>
    `;
        showToast(err.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      Generate Video
    `;
    }
}
