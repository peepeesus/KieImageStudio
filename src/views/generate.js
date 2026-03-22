// Generate View — Text-to-Image Generation
import { createTask, pollTask, getProxiedImageUrl, getApiKey, STYLES, enhancePrompt, saveToGallery } from '../api.js';
import { showToast, navigate } from '../main.js';

export function renderGenerate(container) {
    container.innerHTML = `
    <h1 class="view-title">Generate</h1>
    <p class="view-subtitle">Describe your vision, and watch it come to life.</p>

    <div class="glass-panel">
      <div class="form-group">
        <label class="form-label" for="gen-prompt">Prompt</label>
        <textarea
          id="gen-prompt"
          class="form-textarea"
          placeholder="A futuristic Tokyo cityscape at golden hour..."
          rows="4"
        ></textarea>
      </div>

      <div class="controls-row">
        <div class="form-group">
          <label class="form-label" for="gen-style">Style</label>
          <select id="gen-style" class="form-select">
            ${Object.keys(STYLES).map(s => `<option value="${s}">${s}</option>`).join('')}
            <option value="Raw">Raw (No Enhancement)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="gen-aspect">Aspect Ratio</label>
          <select id="gen-aspect" class="form-select">
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Portrait</option>
            <option value="4:3">4:3 Standard</option>
            <option value="3:4">3:4 Tall</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="gen-resolution">Resolution</label>
          <select id="gen-resolution" class="form-select">
            <option value="1K">1K</option>
            <option value="2K" selected>2K</option>
            <option value="4K">4K</option>
            <option value="512px">512px</option>
          </select>
        </div>
      </div>

      <div class="toggle-wrapper">
        <div>
          <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">Google Search</span>
          <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block;">Enhance prompts with web knowledge</span>
        </div>
        <button id="gen-google-toggle" class="toggle" type="button"></button>
      </div>

      <div class="section-divider"></div>

      <button id="gen-submit" class="btn btn-primary btn-lg" style="width: 100%;">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Generate Image
      </button>
    </div>

    <div id="gen-result" class="result-section" style="display: none;"></div>
  `;

    // Toggle logic
    const toggle = container.querySelector('#gen-google-toggle');
    toggle.addEventListener('click', () => toggle.classList.toggle('active'));

    // Submit
    const submitBtn = container.querySelector('#gen-submit');
    submitBtn.addEventListener('click', () => handleGenerate(container));
}

async function handleGenerate(container) {
    const rawPrompt = container.querySelector('#gen-prompt').value.trim();
    if (!rawPrompt) { showToast('Please enter a prompt', 'error'); return; }
    if (!getApiKey()) { showToast('Please set your API key in Settings first', 'error'); navigate('settings'); return; }

    const styleName = container.querySelector('#gen-style').value;
    const aspect_ratio = container.querySelector('#gen-aspect').value;
    const resolution = container.querySelector('#gen-resolution').value;
    const google_search = container.querySelector('#gen-google-toggle').classList.contains('active');

    const prompt = enhancePrompt(rawPrompt, styleName, aspect_ratio);

    const submitBtn = container.querySelector('#gen-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="skeleton-spinner" style="width:20px;height:20px;border-width:2px;"></div> Generating...';

    const resultDiv = container.querySelector('#gen-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-spinner"></div>
      <div class="skeleton-text">Enhancing and Generating...</div>
      <div class="skeleton-text" id="gen-poll-status" style="margin-top: 4px; font-size: 12px; opacity: 0.7;">Initializing...</div>
    </div>
  `;

    try {
        const taskResult = await createTask({ prompt, aspect_ratio, resolution, google_search });
        const taskId = taskResult?.data?.taskId;
        if (!taskId) throw new Error(taskResult?.message || 'No task ID returned');

        const statusEl = container.querySelector('#gen-poll-status');
        if (statusEl) statusEl.textContent = `Task ID: ${taskId.slice(0, 8)}... Polling...`;

        const result = await pollTask(taskId, ({ attempt, state }) => {
            if (statusEl) statusEl.textContent = `Step ${attempt}: ${state || 'waiting'}...`;
        });

        if (result.status === 'success' && result.imageUrl) {
            const proxiedUrl = getProxiedImageUrl(result.imageUrl);
            showResultImage(container, resultDiv, proxiedUrl, rawPrompt, result.imageUrl, prompt);
            saveToGallery({ prompt: rawPrompt, enhancedPrompt: prompt, imageUrl: result.imageUrl, aspect_ratio, resolution, type: 'generate', status: 'ready' });
            showToast('Image generated successfully!', 'success');
        } else if (result.status === 'failed') {
            throw new Error(result.data?.errorMessage || 'Generation failed on server');
        } else {
            throw new Error('Generation timed out after 3 minutes');
        }
    } catch (err) {
        console.error(err);
        resultDiv.innerHTML = `
      <div class="glass-panel" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--error); font-size: var(--font-size-lg); margin-bottom: var(--space-sm);">Generation Failed</p>
        <p style="color: var(--text-tertiary);">${err.message}</p>
        <button class="btn btn-secondary" style="margin-top: var(--space-md);" onclick="this.closest('.result-section').style.display='none'">Dismiss</button>
      </div>
    `;
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      Generate Image
    `;
    }
}

function showResultImage(container, resultDiv, proxiedUrl, prompt, originalUrl, enhancedPrompt) {
    resultDiv.innerHTML = `
    <div class="result-image-wrapper">
      <img class="result-image" src="${proxiedUrl}" alt="${prompt}" id="result-img" />
    </div>
    <div class="result-details" style="margin-top: 20px; padding: 0 20px;">
       <p style="font-size: 13px; color: var(--text-tertiary); line-height: 1.5;">
         <strong style="color: var(--text-secondary);">Enhanced Prompt:</strong><br/>
         ${enhancedPrompt}
       </p>
    </div>
    <div class="result-actions">
      <button class="btn btn-primary" id="result-download">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download
      </button>
      <button class="btn btn-secondary" id="result-edit">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit This
      </button>
      <button class="btn btn-secondary" id="result-regenerate">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
        Regenerate
      </button>
    </div>
  `;

    // Lightbox on image click
    const img = resultDiv.querySelector('#result-img');
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(proxiedUrl));

    // Download
    resultDiv.querySelector('#result-download').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = proxiedUrl;
        a.download = `kie-studio-${Date.now()}.png`;
        a.click();
        showToast('Download started', 'success');
    });

    // Edit this image
    resultDiv.querySelector('#result-edit').addEventListener('click', () => {
        localStorage.setItem('kie_edit_image_url', originalUrl);
        localStorage.setItem('kie_edit_image_proxied', proxiedUrl);
        navigate('edit');
    });

    // Regenerate
    resultDiv.querySelector('#result-regenerate').addEventListener('click', () => {
        handleGenerate(container);
    });
}

function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
    <button class="lightbox-close">✕</button>
    <img src="${src}" />
  `;
    lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.classList.contains('lightbox-close')) lb.remove();
    });
    document.body.appendChild(lb);
}
