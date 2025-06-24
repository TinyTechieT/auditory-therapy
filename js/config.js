// Website Configuration
const CONFIG = {
    siteName: "Auditory Therapy",
    version: "1.0.0",
    
    // Default word categories
    wordCategories: {},
    sentenceCategories: {},

    // Theme settings
    themes: {
        light: {
            name: "Light Mode",
            icon: "🌙"
        },
        dark: {
            name: "Dark Mode", 
            icon: "☀️"
        }
    }
};

// Load data from JSON files
async function loadConfigData() {
    try {
        // Load word categories
        const wordsResponse = await fetch('data/words.json');
        if (!wordsResponse.ok) {
            throw new Error(`Failed to load words.json: ${wordsResponse.status}`);
        }
        CONFIG.wordCategories = await wordsResponse.json();
        
        // Load sentence categories
        const sentencesResponse = await fetch('data/sentences.json');
        if (!sentencesResponse.ok) {
            throw new Error(`Failed to load sentences.json: ${sentencesResponse.status}`);
        }
        CONFIG.sentenceCategories = await sentencesResponse.json();
        
        console.log('Config data loaded successfully');

        // Dispatch event to notify that data is loaded
        document.dispatchEvent(new CustomEvent('configDataLoaded'));
        
    } catch (error) {
        console.error('Error loading config data:', error);
        // Fallback to empty objects
        CONFIG.wordCategories = {};
        CONFIG.sentenceCategories = {};
    }
}

// Initialize site name in DOM elements
document.addEventListener('DOMContentLoaded', function() {
    const elementsToUpdate = [
        { id: 'page-title', content: CONFIG.siteName },
        { id: 'brand-link', content: CONFIG.siteName },
        { id: 'main-heading', content: `Welcome to ${CONFIG.siteName}` },
        { id: 'footer-brand', content: CONFIG.siteName }
    ];

    elementsToUpdate.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            el.textContent = element.content;
        }
    });

    // Load config data
    loadConfigData();
});
