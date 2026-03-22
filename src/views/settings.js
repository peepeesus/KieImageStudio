// Settings View — API key, model selection, defaults
import { getApiKey, setApiKey } from '../api.js';
import { showToast } from '../main.js';

export function renderSettings(container) {
    const currentKey = getApiKey();
    const currentModel = localStorage.getItem('kie_model') || 'nano-banana-2';
    const defaultResolution = localStorage.getItem('kie_default_resolution') || '1K';
    const defaultFormat = localStorage.getItem('kie_default_format') || 'jpg';
    const defaultAspect = localStorage.getItem('kie_default_aspect') || 'auto';

    container.innerHTML = `
    <h1 class="view-title">Settings</h1>
    <p class="view-subtitle">Configure your API connection and preferences.</p>

    <!-- API Key Section -->
    <div class="settings-section">
      <div class="glass-panel">
        <h3 class="settings-section-title">API Connection</h3>
        <div class="form-group">
          <label class="form-label" for="settings-api-key">Kie.ai API Key</label>
          <div class="api-key-input-wrapper">
            <input
              id="settings-api-key"
              type="password"
              class="form-input"
              placeholder="Enter your API key..."
              value="${currentKey}"
            />
            <button class="btn btn-secondary" id="settings-toggle-key" type="button" title="Show/Hide key">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn btn-primary" id="settings-save-key" type="button">Save</button>
          </div>
          <div id="settings-key-status" class="api-key-status ${currentKey ? 'connected' : 'disconnected'}">
            <span class="status-dot ${currentKey ? 'connected' : 'disconnected'}"></span>
            ${currentKey ? 'API key configured' : 'No API key set'}
          </div>
        </div>
      </div>
    </div>

    <!-- Model Selection -->
    <div class="settings-section">
      <div class="glass-panel">
        <h3 class="settings-section-title">AI Models</h3>
        <div class="form-group">
          <label class="form-label" for="settings-model">Default Image Model</label>
          <select id="settings-model" class="form-select">
            <option value="nano-banana-2" ${currentModel === 'nano-banana-2' ? 'selected' : ''}>Nano Banana 2 (Flash Speed, Pro Quality)</option>
            <option value="nano-banana-pro" ${currentModel === 'nano-banana-pro' ? 'selected' : ''}>Nano Banana Pro (High Fidelity, 4K)</option>
            <option value="nano-banana" ${currentModel === 'nano-banana' ? 'selected' : ''}>Nano Banana (Fast, Low Cost)</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-top: var(--space-md);">
          <label class="form-label">Advanced Multi-Model Video</label>
          <p style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: 8px;">
            These models are available in the Video Studio tab.
          </p>
          <ul style="font-size: var(--font-size-xs); color: var(--text-tertiary); line-height: 1.6; padding-left: 16px;">
            <li><strong>Veo 3.1</strong> — Google's cinematic generation.</li>
            <li><strong>Kling 3.0</strong> — Realistic physics and motion.</li>
            <li><strong>Sora 2 Pro</strong> — Production-grade video (16-20s).</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Default Preferences -->
    <div class="settings-section">
      <div class="glass-panel">
        <h3 class="settings-section-title">Defaults</h3>
        <div class="controls-row">
          <div class="form-group">
            <label class="form-label" for="settings-resolution">Default Resolution</label>
            <select id="settings-resolution" class="form-select">
              <option value="1K" ${defaultResolution === '1K' ? 'selected' : ''}>1K</option>
              <option value="2K" ${defaultResolution === '2K' ? 'selected' : ''}>2K</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-format">Default Format</label>
            <select id="settings-format" class="form-select">
              <option value="jpg" ${defaultFormat === 'jpg' ? 'selected' : ''}>JPG</option>
              <option value="png" ${defaultFormat === 'png' ? 'selected' : ''}>PNG</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-aspect">Default Aspect Ratio</label>
            <select id="settings-aspect" class="form-select">
              <option value="auto" ${defaultAspect === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="1:1" ${defaultAspect === '1:1' ? 'selected' : ''}>1:1</option>
              <option value="16:9" ${defaultAspect === '16:9' ? 'selected' : ''}>16:9</option>
              <option value="9:16" ${defaultAspect === '9:16' ? 'selected' : ''}>9:16</option>
            </select>
          </div>
        </div>
        <button class="btn btn-secondary" id="settings-save-defaults" style="margin-top: var(--space-md);">
          Save Defaults
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="settings-section">
      <div class="glass-panel" style="text-align: center; padding: var(--space-xl);">
        <p style="font-size: var(--font-size-sm); color: var(--text-tertiary);">
          Kie Image Studio v1.0 — Powered by
          <a href="https://kie.ai" target="_blank" style="color: var(--accent-primary); text-decoration: none;">Kie.ai</a>
          Nano Banana API
        </p>
      </div>
    </div>
  `;

    // Toggle key visibility
    const keyInput = container.querySelector('#settings-api-key');
    container.querySelector('#settings-toggle-key').addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    });

    // Save key
    container.querySelector('#settings-save-key').addEventListener('click', () => {
        const key = keyInput.value.trim();
        setApiKey(key);
        const status = container.querySelector('#settings-key-status');
        if (key) {
            status.className = 'api-key-status connected';
            status.innerHTML = '<span class="status-dot connected"></span> API key configured';
            showToast('API key saved!', 'success');
        } else {
            status.className = 'api-key-status disconnected';
            status.innerHTML = '<span class="status-dot disconnected"></span> No API key set';
            showToast('API key removed', 'info');
        }
    });

    // Model change
    container.querySelector('#settings-model').addEventListener('change', (e) => {
        localStorage.setItem('kie_model', e.target.value);
        showToast(`Model set to ${e.target.value}`, 'success');
    });

    // Save defaults
    container.querySelector('#settings-save-defaults').addEventListener('click', () => {
        localStorage.setItem('kie_default_resolution', container.querySelector('#settings-resolution').value);
        localStorage.setItem('kie_default_format', container.querySelector('#settings-format').value);
        localStorage.setItem('kie_default_aspect', container.querySelector('#settings-aspect').value);
        showToast('Defaults saved!', 'success');
    });
}
