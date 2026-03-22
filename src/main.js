// Kie Image Studio — Main Application
import { renderGenerate } from './views/generate.js';
import { renderVideo } from './views/video.js';
import { renderEdit } from './views/edit.js';
import { renderGallery } from './views/gallery.js';
import { renderSettings } from './views/settings.js';

const views = {
    generate: renderGenerate,
    video: renderVideo,
    edit: renderEdit,
    gallery: renderGallery,
    settings: renderSettings
};

let currentView = 'generate';

function navigateTo(viewName) {
    if (!views[viewName]) return;
    currentView = viewName;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Render view
    const container = document.getElementById('view-container');
    
    // Clear previous view classes from body and add new one
    document.body.className = document.body.className.replace(/\bview-\w+\b/g, '').trim();
    document.body.classList.add(`view-${viewName}`);
    
    container.className = `view-container view-${viewName}`;
    container.style.animation = 'none';
    container.offsetHeight; // trigger reflow
    container.style.animation = 'fadeIn var(--transition-base)';
    container.innerHTML = '';
    
    views[viewName](container);
}


// Toast notification system
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Gallery storage helpers
export function saveToGallery(item) {
    const gallery = getGallery();
    gallery.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...item
    });
    // Keep max 100 items
    if (gallery.length > 100) gallery.pop();
    localStorage.setItem('kie_gallery', JSON.stringify(gallery));
}

export function getGallery() {
    try {
        return JSON.parse(localStorage.getItem('kie_gallery') || '[]');
    } catch { return []; }
}

export function clearGallery() {
    localStorage.setItem('kie_gallery', '[]');
}

// Navigate from external modules
export function navigate(viewName) {
    navigateTo(viewName);
}

// Theme management
function initTheme() {
    const theme = localStorage.getItem('kie_theme') || 'dark';
    document.documentElement.classList.toggle('theme-ether', theme === 'light');
    updateThemeIcons(theme);
}

function updateThemeIcons(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (sunIcon && moonIcon) {
        sunIcon.style.display = theme === 'light' ? 'none' : 'block';
        moonIcon.style.display = theme === 'light' ? 'block' : 'none';
    }
}

function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('theme-ether');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('kie_theme', newTheme);
    updateThemeIcons(newTheme);
    showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`, 'info');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Bind nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (!btn.classList.contains('theme-toggle')) {
            btn.addEventListener('click', () => navigateTo(btn.dataset.view));
        }
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Start on generate view
    navigateTo('generate');
});
