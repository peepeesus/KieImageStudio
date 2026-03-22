// Edit View — Image-to-Image Editing
import { createTask, pollTask, uploadImage, getProxiedImageUrl, getApiKey, STYLES, enhancePrompt, saveToGallery } from '../api.js';
import { showToast, navigate } from '../main.js';

export function renderEdit(container) {
    // Check if there's a pre-loaded image from Generate view
    const preloadedUrl = localStorage.getItem('kie_edit_image_url');
    const preloadedProxied = localStorage.getItem('kie_edit_image_proxied');

    container.innerHTML = `
    <h1 class="view-title">Edit</h1>
    <p class="view-subtitle">Upload an image and describe the changes you want.</p>

    <div class="two-col-layout">
      <!-- Left: Upload & Preview -->
      <div>
        <div class="glass-panel">
          <label class="form-label">Source Image</label>
          <div id="edit-upload-zone" class="upload-zone">
            ${preloadedProxied ? `
              <div class="preview-container">
                <img src="${preloadedProxied}" class="preview-image" alt="Source image" />
                <div class="preview-overlay">
                  <button class="btn btn-secondary btn-icon" id="edit-remove-image" title="Remove image">✕</button>
                </div>
              </div>
            ` : `
              <svg class="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p class="upload-zone-text">Drop an image here or click to upload</p>
              <p class="upload-zone-hint">Supports JPG, PNG, WebP — Max 20MB</p>
            `}
          </div>
          <input type="file" id="edit-file-input" accept="image/*" style="display: none;" />
        </div>
      </div>

      <!-- Right: Edit Controls -->
      <div>
        <div class="glass-panel">
          <div class="form-group">
            <label class="form-label" for="edit-prompt">Edit Instructions</label>
            <textarea
              id="edit-prompt"
              class="form-textarea"
              placeholder="Change the background to a sunset beach..."
              rows="4"
            ></textarea>
          </div>

          <div class="controls-row">
            <div class="form-group">
              <label class="form-label" for="edit-style">Style</label>
              <select id="edit-style" class="form-select">
                ${Object.keys(STYLES).map(s => `<option value="${s}">${s}</option>`).join('')}
                <option value="Raw">Raw (No Enhancement)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-aspect">Aspect Ratio</label>
              <select id="edit-aspect" class="form-select">
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="4:3">4:3 Standard</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-resolution">Resolution</label>
              <select id="edit-resolution" class="form-select">
                <option value="1K">1K</option>
                <option value="2K" selected>2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
          </div>

          <div class="section-divider"></div>

          <button id="edit-submit" class="btn btn-primary btn-lg" style="width: 100%;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Apply Edit
          </button>
        </div>
      </div>
    </div>

    <div id="edit-result" class="result-section" style="display: none;"></div>
  `;

    let currentImageData = preloadedUrl || null;
    const uploadZone = container.querySelector('#edit-upload-zone');
    const fileInput = container.querySelector('#edit-file-input');

    // Clean up preloaded URL
    if (preloadedUrl) {
        localStorage.removeItem('kie_edit_image_url');
        localStorage.removeItem('kie_edit_image_proxied');

        // Bind remove button
        const removeBtn = container.querySelector('#edit-remove-image');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentImageData = null;
                resetUploadZone(uploadZone);
            });
        }
    }

    // Click to upload
    uploadZone.addEventListener('click', (e) => {
        if (e.target.id === 'edit-remove-image') return;
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) await handleFileUpload(file, uploadZone, (data) => { currentImageData = data; });
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await handleFileUpload(file, uploadZone, (data) => { currentImageData = data; });
        }
    });

    // Submit
    container.querySelector('#edit-submit').addEventListener('click', () => {
        handleEdit(container, currentImageData);
    });
}

async function handleFileUpload(file, uploadZone, onData) {
    try {
        showToast('Uploading image...', 'info');
        const result = await uploadImage(file);

        uploadZone.innerHTML = `
      <div class="preview-container">
        <img src="${result.url}" class="preview-image" alt="Uploaded image" />
        <div class="preview-overlay">
          <button class="btn btn-secondary btn-icon" id="edit-remove-image" title="Remove image">✕</button>
        </div>
      </div>
    `;

        onData(result.url);

        const removeBtn = uploadZone.querySelector('#edit-remove-image');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onData(null);
            resetUploadZone(uploadZone);
        });

        showToast('Image uploaded!', 'success');
    } catch (err) {
        showToast('Upload failed: ' + err.message, 'error');
    }
}

function resetUploadZone(uploadZone) {
    uploadZone.innerHTML = `
    <svg class="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
    <p class="upload-zone-text">Drop an image here or click to upload</p>
    <p class="upload-zone-hint">Supports JPG, PNG, WebP — Max 20MB</p>
  `;
}

async function handleEdit(container, imageData) {
    const rawPrompt = container.querySelector('#edit-prompt').value.trim();
    if (!rawPrompt) { showToast('Please describe the edit you want', 'error'); return; }
    if (!imageData) { showToast('Please upload an image first', 'error'); return; }
    if (!getApiKey()) { showToast('Please set your API key in Settings first', 'error'); navigate('settings'); return; }

    const styleName = container.querySelector('#edit-style').value;
    const aspect_ratio = container.querySelector('#edit-aspect').value;
    const resolution = container.querySelector('#edit-resolution').value;

    const prompt = enhancePrompt(rawPrompt, styleName, aspect_ratio);

    const submitBtn = container.querySelector('#edit-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="skeleton-spinner" style="width:20px;height:20px;border-width:2px;"></div> Applying...';

    const resultDiv = container.querySelector('#edit-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-spinner"></div>
      <div class="skeleton-text">Enhancing and Applying Edits...</div>
      <div class="skeleton-text" id="edit-poll-status" style="margin-top: 4px; font-size: 12px; opacity: 0.7;">Initializing...</div>
    </div>
  `;

    try {
        const taskResult = await createTask({
            prompt,
            aspect_ratio,
            resolution,
            image_input: [imageData]
        });
        const taskId = taskResult?.data?.taskId;
        if (!taskId) throw new Error(taskResult?.message || 'No task ID returned');

        const statusEl = container.querySelector('#edit-poll-status');
        if (statusEl) statusEl.textContent = `Task: ${taskId.slice(0, 8)}... Processing...`;

        const result = await pollTask(taskId, ({ attempt, state }) => {
            if (statusEl) statusEl.textContent = `Step ${attempt}: ${state || 'waiting'}...`;
        });

        if (result.status === 'success' && result.imageUrl) {
            const proxiedUrl = getProxiedImageUrl(result.imageUrl);
            resultDiv.innerHTML = `
        <div class="result-image-wrapper">
          <img class="result-image" src="${proxiedUrl}" alt="Edited image" />
        </div>
        <div class="result-details" style="margin-top: 20px; padding: 0 20px;">
           <p style="font-size: 13px; color: var(--text-tertiary); line-height: 1.5;">
             <strong style="color: var(--text-secondary);">Enhanced Edit Prompt:</strong><br/>
             ${prompt}
           </p>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="edit-download">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
          <button class="btn btn-secondary" id="edit-again-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Edit Again
          </button>
        </div>
      `;

            resultDiv.querySelector('#edit-download').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = proxiedUrl;
                a.download = `kie-edited-${Date.now()}.png`;
                a.click();
            });

            resultDiv.querySelector('#edit-again-btn')?.addEventListener('click', () => {
                localStorage.setItem('kie_edit_image_url', result.imageUrl);
                localStorage.setItem('kie_edit_image_proxied', proxiedUrl);
                navigate('edit');
            });

            saveToGallery({ prompt: rawPrompt, enhancedPrompt: prompt, imageUrl: result.imageUrl, aspect_ratio, resolution, type: 'edit', status: 'ready' });
            showToast('Edit applied successfully!', 'success');
        } else if (result.status === 'failed') {
            throw new Error(result.data?.errorMessage || 'Edit failed on server');
        } else {
            throw new Error('Edit timed out after 3 minutes');
        }
    } catch (err) {
        resultDiv.innerHTML = `
      <div class="glass-panel" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--error); font-size: var(--font-size-lg); margin-bottom: var(--space-sm);">Edit Failed</p>
        <p style="color: var(--text-tertiary);">${err.message}</p>
        <button class="btn btn-secondary" style="margin-top: var(--space-md);" onclick="this.closest('.result-section').style.display='none'">Dismiss</button>
      </div>
    `;
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Apply Edit
    `;
    }
}
