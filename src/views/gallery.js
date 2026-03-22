import { getGallery, saveToGallery, getProxiedImageUrl } from '../api.js';
import { showToast } from '../main.js';

export function renderGallery(container) {
    container.innerHTML = `
        <div class="archives-app-header">
            <div class="archives-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="4" fill="#ed0670"/>
                    <path d="M6 18V6H18V18H6Z" stroke="white" stroke-width="2"/>
                </svg>
                <span>Creative Content Engine</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>
            <div class="archives-nav">
                <span class="active">Data</span>
                <span>Automations</span>
                <span>Interfaces</span>
                <span>Forms</span>
            </div>
            <div style="flex: 1;"></div>
            <div class="archives-nav">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <div style="background: #ed0670; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">Share</div>
            </div>
        </div>

        <div class="grid-toolbar">
            <div class="toolbar-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                <span style="font-weight: 600;">Grid view</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="toolbar-divider"></div>
            <div class="toolbar-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Hide fields</span>
            </div>
            <div class="toolbar-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                <span>Filtered by filter</span>
            </div>
            <div class="toolbar-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg>
                <span>Group</span>
            </div>
            <div class="toolbar-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10l5 5 5-5M7 14l5 5 5-5"/></svg>
                <span>Sort</span>
            </div>
            <div style="flex: 1;"></div>
            <div class="toolbar-item" style="border-left: 1px solid #26272b; padding-left: 15px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6e6e6e" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
        </div>

        <div class="archives-viewport">
            <div class="airtable-grid" id="gallery-grid">
                <div class="grid-header-row">
                    <div class="grid-header cell-checkbox"><input type="checkbox"></div>
                    <div class="grid-header cell-id"># I...</div>
                    <div class="grid-header cell-status-label">Image Status</div>
                    <div class="grid-header cell-preview">Generated Image 1</div>
                    <div class="grid-header cell-preview">Generated Image 2</div>
                    <div class="grid-header cell-prompt">Video Prompt</div>
                    <div class="grid-header cell-model">Video Eng...</div>
                    <div class="grid-header cell-status">Video Status</div>
                    <div class="grid-header cell-preview">Generated Video 1</div>
                    <div class="grid-header cell-date">Created Date</div>
                </div>
                <div id="grid-content">
                    <div style="padding: 40px; text-align: center; color: #6e6e6e; font-size: 12px;">Initializing Content Engine...</div>
                </div>
            </div>
        </div>
        
        <div id="prompt-overlay" class="prompt-overlay"></div>
    `;

    loadGalleryData();
}

let galleryItems = [];

async function loadGalleryData() {
    try {
        galleryItems = await getGallery();
        renderGridRows(galleryItems);
    } catch (err) {
        console.error('Failed to load gallery:', err);
        const content = document.getElementById('grid-content');
        if (content) content.innerHTML = '<div style="padding: 20px; color: #ef4444; text-align: center; font-size: 12px;">Failed to load Content Engine.</div>';
    }
}

function renderGridRows(items) {
    const content = document.getElementById('grid-content');
    if (!content) return;
    
    if (items.length === 0) {
        content.innerHTML = '<div style="padding: 40px; text-align: center; color: #6e6e6e; font-size: 12px;">No records found in content engine.</div>';
        return;
    }

    content.innerHTML = items.map((item, index) => {
        const isVideo = item.type === 'video' || (item.imageUrl && item.imageUrl.toLowerCase().includes('mp4'));
        const modelLabel = item.model || 'Nano Banana 2';
        const status = item.status || 'generated'; 
        const id = items.length - index;
        const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Mar 21, 2026';

        return `
            <div class="grid-row" data-id="${item.id}">
                <div class="grid-cell cell-checkbox"><input type="checkbox"></div>
                <div class="grid-cell cell-id">${id}</div>
                <div class="grid-cell cell-status-label">
                    <span class="status-pill pill-ready">Generated</span>
                </div>
                <!-- Image 1 -->
                <div class="grid-cell cell-preview">
                    <div class="large-preview preview-trigger" data-url="${item.imageUrl}" data-video="${isVideo}">
                        ${!isVideo ? `<img src="${getProxiedImageUrl(item.imageUrl)}" alt="Preview">` : ''}
                    </div>
                </div>
                <!-- Image 2 -->
                <div class="grid-cell cell-preview">
                    <div class="large-preview">
                        ${!isVideo ? `<img src="${getProxiedImageUrl(item.imageUrl)}" style="opacity: 0.5;" alt="Preview">` : ''}
                    </div>
                </div>
                <!-- Prompt Section -->
                <div class="grid-cell cell-prompt">
                    <button class="prompt-expand-btn expand-trigger" data-prompt="${encodeURIComponent(item.prompt)}">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    </button>
                    <div class="prompt-text">${item.prompt}</div>
                </div>
                <!-- Video Eng -->
                <div class="grid-cell cell-model">
                    <span class="model-badge pill-purple">${modelLabel}</span>
                </div>
                <!-- Video Status -->
                <div class="grid-cell cell-status">
                    <span class="status-pill pill-${isVideo ? 'ready' : 'waiting'}">${isVideo ? 'Generated' : 'Pending'}</span>
                </div>
                <!-- Generated Video 1 -->
                <div class="grid-cell cell-preview">
                    <div class="large-preview preview-trigger" data-url="${item.imageUrl}" data-video="${isVideo}">
                        ${isVideo ? 
                            `<video src="${getProxiedImageUrl(item.imageUrl)}" muted></video><div class="play-overlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>` :
                            `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; opacity:0.1;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 9l5 3-5 3v-6z"/></svg></div>`
                        }
                    </div>
                </div>
                <!-- Created Date -->
                <div class="grid-cell cell-date">${dateStr}</div>
            </div>
        `;
    }).join('');

    // Bind Interactions
    const overlay = document.getElementById('prompt-overlay');

    content.querySelectorAll('.expand-trigger').forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            const prompt = decodeURIComponent(btn.dataset.prompt);
            overlay.innerHTML = prompt;
            overlay.style.display = 'block';
            
            const rect = btn.getBoundingClientRect();
            // Position carefully relative to the cell
            overlay.style.left = `${rect.left - 300}px`; 
            overlay.style.top = `${rect.top}px`;
        });
        
        btn.addEventListener('mouseleave', () => {
            overlay.style.display = 'none';
        });
    });

    content.querySelectorAll('.preview-trigger').forEach(box => {
        box.addEventListener('click', () => {
             openLightbox(box.dataset.url, box.dataset.video === 'true');
        });
    });
}

function openLightbox(url, isVideo) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center; cursor:pointer;';
    lightbox.onclick = () => document.body.removeChild(lightbox);
    
    const content = isVideo ? 
        `<video src="${getProxiedImageUrl(url)}" controls autoplay style="max-width:90%; max-height:90%; border-radius:8px; box-shadow:0 20px 50px rgba(0,0,0,0.5);"></video>` :
        `<img src="${getProxiedImageUrl(url)}" style="max-width:90%; max-height:90%; border-radius:8px; box-shadow:0 20px 50px rgba(0,0,0,0.5);">`;
    
    lightbox.innerHTML = content;
    document.body.appendChild(lightbox);
}
