// Website Configuration
const CONFIG = {
    siteName: "Auditory Therapy",
    version: "1.0.0",
    
    // Default word categories
    wordCategories: {
        animals: {
            name: "Animals",
            words: ["dog", "cat", "cow", "pig", "bird", "fish", "lion", "bear", "frog", "duck", "tiger", "sheep", "fox"]
        },
        colors: {
            name: "Colors", 
            words: ["red", "blue", "green", "yellow", "black", "white", "pink", "orange", "purple", "brown"]
        },
        vehicles: {
            name: "Vehicles",
            words: ["car", "bus", "truck", "bike", "plane", "boat", "train", "ship", "helicopter", "aeroplane"]
        },
        fruits: {
            name: "Fruits",
            words: ["apple", "banana", "orange", "grapes", "pear", "peach", "watermelon", "strawberry", "kiwi", "mango"]
        },
        vegetables: {
            name: "Vegetables", 
            words: ["carrot", "potato", "tomato", "onion", "capsicum", "lettuce", "cucumber", "beans", "peas", "corn", "ginger"]
        },
        household: {
            name: "Household Items",
            words: ["chair", "table", "lamp", "bed", "door", "window", "spoon", "fork", "plate", "cup", "pillow"]
        }
    },

    // Default sentence categories
    sentenceCategories: {
        daily: {
            name: "Daily Activities",
            sentences: [
                "I am brushing my teeth.",
                "She is cooking dinner.",
                "We are going to the store.",
                "He is reading a book.",
                "They are watching television.",
                "I need to wash the dishes.",
                "Can you help me with this?",
                "The weather is nice today.",
                "I am getting ready for work.",
                "Let's go for a walk."
            ]
        },
        questions: {
            name: "Questions",
            sentences: [
                "What time is it?",
                "How are you today?",
                "Where did you go?",
                "What is your name?",
                "Can you hear me?",
                "Do you like this?",
                "Are you ready?",
                "Which one do you want?",
                "How much does it cost?",
                "When will you be back?"
            ]
        },
        commands: {
            name: "Commands",
            sentences: [
                "Please sit down.",
                "Turn on the light.",
                "Close the door.",
                "Pick up the book.",
                "Look at me.",
                "Listen carefully.",
                "Repeat after me.",
                "Stand up straight.",
                "Come here please.",
                "Wait a moment."
            ]
        }
    },

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
});
