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

            <!-- Filter Dropdown (Avatar Focused) -->
            <div class="toolbar-item filter-btn" id="filter-trigger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                <span>Filter</span>
                <div id="filter-dropdown" class="filter-dropdown">
                    <div class="filter-section">
                        <div class="filter-section-title">Customer Avatar</div>
                        <div class="filter-option" data-type="avatar" data-value="all">All Avatars</div>
                        <div class="filter-option" data-type="avatar" data-value="Nora">Nora</div>
                        <div class="filter-option" data-type="avatar" data-value="Elias">Elias</div>
                        <div class="filter-option" data-type="avatar" data-value="Jordan">Jordan</div>
                    </div>
                </div>
            </div>

            <!-- Group Dropdown (Platform Focused) -->
            <div class="toolbar-item filter-btn" id="group-trigger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg>
                <span>Group</span>
                <div id="group-dropdown" class="filter-dropdown">
                    <div class="filter-section">
                        <div class="filter-section-title">Group By</div>
                        <div class="filter-option" data-type="group" data-value="none">None</div>
                        <div class="filter-option" data-type="group" data-value="platform">Social Platform</div>
                        <div class="filter-option" data-type="group" data-value="avatar">Customer Avatar</div>
                    </div>
                </div>
            </div>

            <!-- Sort Dropdown (Performance Metrics) -->
            <div class="toolbar-item filter-btn" id="sort-trigger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10l5 5 5-5M7 14l5 5 5-5"/></svg>
                <span>Sort</span>
                <div id="sort-dropdown" class="filter-dropdown">
                    <div class="filter-section">
                        <div class="filter-section-title">Standard</div>
                        <div class="filter-option" data-type="sort" data-value="date">Created Date</div>
                        <div class="filter-divider"></div>
                        <div class="filter-section-title">Meta Ads Performance</div>
                        <div class="filter-option" data-type="sort" data-value="trending">Trending (High CTR)</div>
                        <div class="filter-option" data-type="sort" data-value="worst">Underperforming</div>
                        <div class="filter-option" data-type="sort" data-value="aov">Average Order Value (AOV)</div>
                        <div class="filter-option" data-type="sort" data-value="cpm">CPM (Efficiency)</div>
                    </div>
                </div>
            </div>

            <!-- New: Ad Metrics Columns Toggle -->
            <div class="toolbar-item" id="metrics-toggle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                <span style="font-weight: 600; color: #ed0670;">Ad Metrics</span>
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
                    <div class="grid-header cell-avatar">Actor/Avatar</div>
                    <div class="grid-header cell-platform">Social Platform</div>
                    
                    <!-- Performance Metrics Columns (Conditional) -->
                    <div class="grid-header cell-performance">Meta Sentiment</div>
                    <div class="grid-header cell-ctr">CTR %</div>
                    <div class="grid-header cell-aov">AOV $</div>
                    <div class="grid-header cell-cpm">CPM $</div>

                    <div class="grid-header cell-preview">Generated Image 1</div>
                    <div class="grid-header cell-preview">Generated Image 2</div>
                    <div class="grid-header cell-prompt">Video Prompt</div>
                    <div class="grid-header cell-model">Video Eng...</div>
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
    setupToolbar();
}

let galleryItems = [];
let activeFilters = {
    avatar: 'all',
    group: 'none',
    sort: 'date'
};

function setupToolbar() {
    ['filter', 'group', 'sort'].forEach(type => {
        const trigger = document.getElementById(`${type}-trigger`);
        const dropdown = document.getElementById(`${type}-dropdown`);
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            
            dropdown.querySelectorAll('.filter-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const { type: dType, value } = option.dataset;
                    if (dType === 'avatar') activeFilters.avatar = value;
                    if (dType === 'group') activeFilters.group = value;
                    if (dType === 'sort') activeFilters.sort = value;
                    
                    dropdown.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    applyFilters();
                    dropdown.classList.remove('show');
                });
            });
        }
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));
    });
}

function applyFilters() {
    let results = [...galleryItems];

    // 1. Filter
    if (activeFilters.avatar !== 'all') {
        results = results.filter(item => item.avatar === activeFilters.avatar);
    }

    // 2. Sort
    results.sort((a, b) => {
        const m_a = a.metrics || { ctr: 0, aov: 0, cpm: 99 };
        const m_b = b.metrics || { ctr: 0, aov: 0, cpm: 99 };

        switch (activeFilters.sort) {
            case 'trending': return m_b.ctr - m_a.ctr;
            case 'worst': return m_a.ctr - m_b.ctr;
            case 'aov': return m_b.aov - m_a.aov;
            case 'cpm': return m_a.cpm - m_b.cpm;
            case 'date': 
            default: return b.id - a.id;
        }
    });

    // 3. Render (Includes grouping logic)
    renderGridRows(results);
}

async function loadGalleryData() {
    try {
        galleryItems = await getGallery();
        renderGridRows(galleryItems);
    } catch (err) {
        console.error('Failed to load gallery:', err);
    }
}

function renderGridRows(items) {
    const content = document.getElementById('grid-content');
    if (!content) return;
    
    if (items.length === 0) {
        content.innerHTML = '<div style="padding: 40px; text-align: center; color: #6e6e6e; font-size: 12px;">No records found in content engine.</div>';
        return;
    }

    // Check for grouping
    if (activeFilters.group !== 'none') {
        const groups = {};
        items.forEach(item => {
            const key = item[activeFilters.group] || 'Other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        content.innerHTML = Object.entries(groups).map(([groupName, groupItems]) => {
            return `
                <div class="grid-group-header">
                    <div class="grid-cell" style="grid-column: 1 / -1; width: 2800px;">
                        ${activeFilters.group.toUpperCase()}: ${groupName} (${groupItems.length} records)
                    </div>
                </div>
                ${groupItems.map((item, idx) => renderRowHtml(item, idx, groupItems.length)).join('')}
            `;
        }).join('');
    } else {
        content.innerHTML = items.map((item, idx) => renderRowHtml(item, idx, items.length)).join('');
    }

    bindInteractions(content);
}

function renderRowHtml(item, index, total) {
    const isVideo = item.type === 'video' || (item.imageUrl && item.imageUrl.toLowerCase().includes('mp4'));
    const metrics = item.metrics || {};
    const perfClass = metrics.performance === 'trending' ? 'pill-trending' : 'pill-underperforming';
    const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Mar 21, 2026';

    return `
        <div class="grid-row" data-id="${item.id}">
            <div class="grid-cell cell-checkbox"><input type="checkbox"></div>
            <div class="grid-cell cell-id">${total - index}</div>
            <div class="grid-cell cell-status-label"><span class="status-pill pill-ready">Generated</span></div>
            <div class="grid-cell cell-avatar"><span class="avatar-pill pill-blue">${item.avatar || 'Nora'}</span></div>
            <div class="grid-cell cell-platform"><span class="platform-pill pill-dark">${item.platform || 'Meta'}</span></div>
            
            <!-- Performance Metrics Cells -->
            <div class="grid-cell cell-performance">
                <span class="status-pill ${perfClass}">${metrics.performance === 'trending' ? 'Trending' : 'Underperforming'}</span>
            </div>
            <div class="grid-cell cell-ctr"><span class="metric-value">${metrics.ctr}%</span></div>
            <div class="grid-cell cell-aov"><span class="metric-value">$${metrics.aov}</span></div>
            <div class="grid-cell cell-cpm"><span class="metric-value">$${metrics.cpm}</span></div>

            <div class="grid-cell cell-preview">
                <div class="large-preview preview-trigger" data-url="${item.imageUrl}" data-video="${isVideo}">
                    ${!isVideo ? `<img src="${getProxiedImageUrl(item.imageUrl)}" alt="Preview">` : ''}
                </div>
            </div>
            <div class="grid-cell cell-preview">
                <div class="large-preview"><img src="${getProxiedImageUrl(item.imageUrl)}" style="opacity: 0.5"></div>
            </div>
            <div class="grid-cell cell-prompt">
                <button class="prompt-expand-btn expand-trigger" data-prompt="${encodeURIComponent(item.prompt)}">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </button>
                <div class="prompt-text">${item.prompt}</div>
            </div>
            <div class="grid-cell cell-model"><span class="model-badge">${item.model || 'Nano Banana 2'}</span></div>
            <div class="grid-cell cell-date">${dateStr}</div>
        </div>
    `;
}

function bindInteractions(content) {
    const overlay = document.getElementById('prompt-overlay');
    content.querySelectorAll('.expand-trigger').forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            const prompt = decodeURIComponent(btn.dataset.prompt);
            overlay.innerHTML = prompt;
            overlay.style.display = 'block';
            const rect = btn.getBoundingClientRect();
            overlay.style.left = `${rect.left - 300}px`; 
            overlay.style.top = `${rect.top}px`;
        });
        btn.addEventListener('mouseleave', () => overlay.style.display = 'none');
    });

    content.querySelectorAll('.preview-trigger').forEach(box => {
        box.addEventListener('click', () => openLightbox(box.dataset.url, box.dataset.video === 'true'));
    });
}

function openLightbox(url, isVideo) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center; cursor:pointer;';
    lightbox.onclick = () => document.body.removeChild(lightbox);
    const content = isVideo ? 
        `<video src="${getProxiedImageUrl(url)}" controls autoplay style="max-width:90%; max-height:90%; border-radius:8px;"></video>` :
        `<img src="${getProxiedImageUrl(url)}" style="max-width:90%; max-height:90%; border-radius:8px;">`;
    lightbox.innerHTML = content;
    document.body.appendChild(lightbox);
}
