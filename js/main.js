// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize theme
    initializeTheme();
    
    // Initialize mobile navigation
    initializeMobileNav();
    
    // Load user settings
    loadUserSettings();
}

// Theme management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle-btn');
    const settings = storage.getSettings();
    
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateThemeToggleIcon(settings.theme);
    
    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeToggleIcon(newTheme);
    
    // Save theme preference
    storage.updateSettings({ theme: newTheme });
}

function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle-btn');
    if (themeToggle) {
        themeToggle.textContent = CONFIG.themes[theme].icon;
        themeToggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
    }
}

// Mobile navigation
function initializeMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// Load user settings
function loadUserSettings() {
    const settings = storage.getSettings();
    
    // Apply any saved preferences
    if (settings.fontSize) {
        document.documentElement.style.fontSize = settings.fontSize;
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Export functions for use in other files
window.AppUtils = {
    formatDate,
    formatDuration,
    storage
};
