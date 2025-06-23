// Component Loader System
class ComponentLoader {
    constructor() {
        this.componentsLoaded = 0;
        this.totalComponents = 0;
        this.loadQueue = [];
    }

    async loadComponent(elementId, componentPath) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentPath}: ${response.status}`);
            }
            
            const html = await response.text();
            const element = document.getElementById(elementId);
            
            if (element) {
                element.innerHTML = html;
                this.componentsLoaded++;
                
                // Trigger component loaded event
                this.onComponentLoaded(elementId);
                
                // Check if all components are loaded
                if (this.componentsLoaded === this.totalComponents) {
                    this.onAllComponentsLoaded();
                }
            } else {
                console.warn(`Element with id '${elementId}' not found`);
            }
        } catch (error) {
            console.error(`Error loading component ${componentPath}:`, error);
        }
    }

    loadComponents(components) {
        this.totalComponents = components.length;
        this.componentsLoaded = 0;
        
        components.forEach(({ elementId, componentPath }) => {
            this.loadComponent(elementId, componentPath);
        });
    }

    onComponentLoaded(elementId) {
        // Re-initialize functionality for loaded components
        if (elementId === 'navbar') {
            this.initializeNavbar();
        }
    }

    onAllComponentsLoaded() {
        // Initialize global functionality after all components are loaded
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
    }

    initializeNavbar() {
        // Re-initialize mobile navigation
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            // Remove existing listeners to prevent duplicates
            navToggle.replaceWith(navToggle.cloneNode(true));
            const newNavToggle = document.getElementById('nav-toggle');
            
            newNavToggle.addEventListener('click', function() {
                navMenu.classList.toggle('active');
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', function(event) {
                if (!newNavToggle.contains(event.target) && !navMenu.contains(event.target)) {
                    navMenu.classList.remove('active');
                }
            });
        }

        // Re-initialize theme toggle
        const themeToggle = document.getElementById('theme-toggle-btn');
        if (themeToggle) {
            // Remove existing listeners
            themeToggle.replaceWith(themeToggle.cloneNode(true));
            const newThemeToggle = document.getElementById('theme-toggle-btn');
            
            newThemeToggle.addEventListener('click', toggleTheme);
        }

        // Re-initialize dropdown functionality
        this.initializeDropdowns();
    }

    initializeDropdowns() {
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        
        dropdowns.forEach(dropdown => {
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            
            dropdown.addEventListener('mouseenter', () => {
                dropdownContent.style.display = 'block';
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdownContent.style.display = 'none';
            });
        });
    }
}

// Initialize component loader
const componentLoader = new ComponentLoader();

// Auto-load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const components = [
        { elementId: 'navbar', componentPath: 'components/navbar.html' },
        { elementId: 'footer', componentPath: 'components/footer.html' }
    ];
    
    componentLoader.loadComponents(components);
});
