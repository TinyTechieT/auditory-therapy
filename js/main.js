// Main JavaScript functionality
let appInitialized = false;

function initializeApp() {
    if (appInitialized) return;
    appInitialized = true;

    // Initialize theme
    initializeTheme();
    
    // Initialize mobile navigation
    initializeMobileNav();

    // Initialize go to top button
    initializeGoToTop();
    
    // Load user settings
    loadUserSettings();
}

// document.addEventListener('DOMContentLoaded', function() {
//     initializeApp();
// });

document.addEventListener('componentsLoaded', function() {
    initializeApp();
});

// Fallback initialization if components don't load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!appInitialized) {
            initializeApp();
        }
    }, 1000);
});

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

// Go to Top Button functionality
function initializeGoToTop() {
    const goToTopBtn = document.getElementById('go-to-top');
    
    if (goToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 100) {
                goToTopBtn.classList.add('visible');
            } else {
                goToTopBtn.classList.remove('visible');
            }
        });
        
        // Smooth scroll to top
        goToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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

// Export functions for use in other files
window.AppUtils = {
    storage
};
