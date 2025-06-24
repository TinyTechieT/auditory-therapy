// Word Pairs Therapy Logic
class WordPairsSession {
    constructor() {
        this.currentScreen = 'setup';
        this.selectedCategories = new Set();
        this.pairPool = [];
        this.currentPairIndex = 0;
        this.sessionData = {
            startTime: null,
            endTime: null,
            responses: [],
            settings: {}
        };
        this.timer = {
            startTime: null,
            pausedTime: 0,
            interval: null,
            isRunning: false
        };
        this.stats = {
            correct: 0,
            wrong: 0,
            multiple: 0,
            total: 0
        };
        
        this.initializeEventListeners();
        // this.loadCategories();
        // this.updatePairCount();
        TherapyUtils.initializeTherapyPage(this);
    }

    initializeEventListeners() {
        // Setup screen events
        document.addEventListener('change', (e) => {
            if (e.target.name === 'category-mode') {
                this.handleCategoryModeChange(e.target.value);
            }
            if (e.target.name === 'word-mode') {
                this.handleWordModeChange(e.target.value);
            }
            if (e.target.name === 'pair-type') {
                this.updatePairCount();
            }
            if (e.target.type === 'checkbox' && e.target.closest('.category-grid')) {
                this.handleCategorySelection();
            }
            if (e.target.type === 'checkbox' && e.target.closest('.word-grid')) {
                this.handleWordSelection();
            }
            if (e.target.id === 'pair-count') {
                this.updatePairCount();
            }
        });

        // Start session button
        document.getElementById('start-session-btn').addEventListener('click', () => {
            this.startSession();
        });

        // Session screen events
        document.getElementById('correct-btn').addEventListener('click', () => {
            this.recordResponse('correct');
        });
        
        document.getElementById('wrong-btn').addEventListener('click', () => {
            this.recordResponse('wrong');
        });
        
        document.getElementById('multiple-btn').addEventListener('click', () => {
            this.recordResponse('multiple');
        });
        
        document.getElementById('next-pair-btn').addEventListener('click', () => {
            this.nextPair();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseSession();
        });
        
        document.getElementById('end-session-btn').addEventListener('click', () => {
            this.endSession();
        });

        // Pause screen events
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeSession();
        });
        
        document.getElementById('end-from-pause-btn').addEventListener('click', () => {
            this.endSession();
        });

        // Results screen events
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.resetToSetup();
        });
        
        document.getElementById('view-history-btn').addEventListener('click', () => {
            window.location.href = 'history.html';
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentScreen === 'session') {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        this.recordResponse('correct');
                        break;
                    case 'KeyX':
                        e.preventDefault();
                        this.recordResponse('wrong');
                        break;
                    case 'KeyM':
                        e.preventDefault();
                        this.recordResponse('multiple');
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.nextPair();
                        break;
                }
            }
        });
    }

    loadCategories() {
        const categoryGrid = document.getElementById('category-grid');
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        categoryGrid.innerHTML = '';
        
        Object.entries(allCategories).forEach(([id, category]) => {
            const categoryItem = document.createElement('label');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <input type="checkbox" name="category" value="${id}">
                <span class="category-name">${category.name}</span>
                <span class="category-count">${category.words.length} words</span>
            `;
            categoryGrid.appendChild(categoryItem);
        });
    }

    handleCategoryModeChange(mode) {
        const categoryGrid = document.getElementById('category-grid');
        const wordSelection = document.getElementById('word-selection');
        
        if (mode === 'random') {
            categoryGrid.style.display = 'none';
            this.selectedCategories.clear();
            // Select all categories for random mode
            Object.keys(CONFIG.wordCategories).forEach(id => {
                this.selectedCategories.add(id);
            });
            this.loadWordsForSelection();
        } else {
            categoryGrid.style.display = 'grid';
            this.selectedCategories.clear();
            this.handleCategorySelection();
        }
        
        this.updatePairCount();
    }

    handleWordModeChange(mode) {
        const wordGrid = document.getElementById('word-grid');
        
        if (mode === 'all') {
            wordGrid.style.display = 'none';
            this.selectedWords.clear();
        } else {
            wordGrid.style.display = 'grid';
            this.loadWordsForSelection();
        }
        
        this.updatePairCount();
    }

    handleCategorySelection() {
        const checkedCategories = document.querySelectorAll('input[name="category"]:checked');
        this.selectedCategories.clear();
        
        checkedCategories.forEach(checkbox => {
            this.selectedCategories.add(checkbox.value);
        });
        
        this.loadWordsForSelection();
        this.updatePairCount();
    }

    handleWordSelection() {
        const checkedWords = document.querySelectorAll('#word-grid input[type="checkbox"]:checked');
        this.selectedWords.clear();
        
        checkedWords.forEach(checkbox => {
            this.selectedWords.add(checkbox.value);
        });
        
        this.updatePairCount();
    }

    loadWordsForSelection() {
        const wordGrid = document.getElementById('word-grid');
        const wordMode = document.querySelector('input[name="word-mode"]:checked');
        
        if (!wordMode || wordMode.value !== 'select') return;
        
        wordGrid.innerHTML = '';
        
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        this.selectedCategories.forEach(categoryId => {
            if (allCategories[categoryId]) {
                allCategories[categoryId].words.forEach(word => {
                    const wordItem = document.createElement('label');
                    wordItem.className = 'word-item';
                    wordItem.innerHTML = `
                        <input type="checkbox" value="${word}">
                        ${word}
                    `;
                    wordGrid.appendChild(wordItem);
                });
            }
        });
    }

    updatePairCount() {
        const pairCount = document.getElementById('pair-count').value;
        document.getElementById('pair-count-display').textContent = pairCount;
        
        // Enable/disable start button
        const startBtn = document.getElementById('start-session-btn');
        startBtn.disabled = this.selectedCategories.size === 0;
    }

    startSession() {
        // Check if categories are selected
        if (this.selectedCategories.size === 0) {
            alert('Please select at least one category before starting the session.');
            return;
        }

        if (!this.buildPairPool()) {
            alert('Please select at least one category to start the session.');
            return;
        }
        
        // Prepare session data
        this.sessionData = {
            startTime: new Date().toISOString(),
            endTime: null,
            type: 'word-pairs',
            responses: [],
            settings: {
                categoryMode: document.querySelector('input[name="category-mode"]:checked').value,
                pairType: document.querySelector('input[name="pair-type"]:checked').value,
                pairCount: document.getElementById('pair-count').value,
                trackTime: document.getElementById('track-time').checked,
                categories: Array.from(this.selectedCategories),
                totalPairs: this.pairPool.length
            }
        };
        
        // Reset stats
        this.stats = { correct: 0, wrong: 0, multiple: 0, total: 0 };
        
        // Start timer if enabled
        if (this.sessionData.settings.trackTime) {
            this.startTimer();
        }
        
        // Show session screen
        this.showScreen('session');
        this.displayCurrentPair();
    }

    buildPairPool() {
        const pairType = document.querySelector('input[name="pair-type"]:checked').value;
        const pairCount = parseInt(document.getElementById('pair-count').value);
        const wordMode = document.querySelector('input[name="word-mode"]:checked')?.value || 'all';
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        let availableWords = [];
        
        // Collect words from selected categories
        // this.selectedCategories.forEach(categoryId => {
        //     if (allCategories[categoryId]) {
        //         allCategories[categoryId].words.forEach(word => {
        //             availableWords.push({ word, category: categoryId });
        //         });
        //     }
        // });

        // Collect words based on selection
        if (wordMode === 'select' && this.selectedWords.size > 0) {
            availableWords = Array.from(this.selectedWords).map(word => {
                let categoryId = '';
                for (const [id, category] of Object.entries(allCategories)) {
                    if (category.words.includes(word)) {
                        categoryId = id;
                        break;
                    }
                }
                return { word, category: categoryId };
            });
        } else {
            // Use all words from selected categories
            this.selectedCategories.forEach(categoryId => {
                if (allCategories[categoryId]) {
                    allCategories[categoryId].words.forEach(word => {
                        availableWords.push({ word, category: categoryId });
                    });
                }
            });
        }
        
        if (availableWords.length < 2) return false;
        
        this.pairPool = [];
        
        for (let i = 0; i < pairCount; i++) {
            let pair;
            
            if (pairType === 'same-category') {
                pair = this.createSameCategoryPair(availableWords);
            } else if (pairType === 'different-category') {
                pair = this.createDifferentCategoryPair(availableWords);
            } else { // mixed
                pair = Math.random() < 0.5 ? 
                    this.createSameCategoryPair(availableWords) : 
                    this.createDifferentCategoryPair(availableWords);
            }
            
            if (pair) {
                this.pairPool.push(pair);
            }
        }
        
        return this.pairPool.length > 0;
    }

    createSameCategoryPair(availableWords) {
        // Group words by category
        const wordsByCategory = {};
        availableWords.forEach(item => {
            if (!wordsByCategory[item.category]) {
                wordsByCategory[item.category] = [];
            }
            wordsByCategory[item.category].push(item.word);
        });
        
        // Find categories with at least 2 words
        const validCategories = Object.entries(wordsByCategory)
            .filter(([category, words]) => words.length >= 2);
        
        if (validCategories.length === 0) return null;
        
        // Pick random category
        const [categoryId, words] = validCategories[Math.floor(Math.random() * validCategories.length)];
        
        // Pick two different words from that category
        const shuffledWords = TherapyUtils.shuffleArray([...words]);
        // const shuffledWords = this.shuffleArray([...words]);
        
        return {
            word1: shuffledWords[0],
            word2: shuffledWords[1],
            category1: categoryId,
            category2: categoryId,
            type: 'same-category'
        };
    }

    createDifferentCategoryPair(availableWords) {
        if (this.selectedCategories.size < 2) {
            // Fall back to same category if not enough categories
            return this.createSameCategoryPair(availableWords);
        }
        
        const categories = Array.from(this.selectedCategories);
        const shuffledCategories = TherapyUtils.shuffleArray([...categories]);
        // const shuffledCategories = this.shuffleArray([...categories]);
        
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        const word1Category = shuffledCategories[0];
        const word2Category = shuffledCategories[1];
        
        const word1Options = allCategories[word1Category].words;
        const word2Options = allCategories[word2Category].words;
        
        const word1 = word1Options[Math.floor(Math.random() * word1Options.length)];
        const word2 = word2Options[Math.floor(Math.random() * word2Options.length)];
        
        return {
            word1,
            word2,
            category1: word1Category,
            category2: word2Category,
            type: 'different-category'
        };
    }

    // shuffleArray(array) {
    //     const shuffled = [...array];
    //     for (let i = shuffled.length - 1; i > 0; i--) {
    //         const j = Math.floor(Math.random() * (i + 1));
    //         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    //     }
    //     return shuffled;
    // }

    displayCurrentPair() {
        if (this.pairPool.length === 0) return;
        
        // Get random pair from pool
        const randomIndex = Math.floor(Math.random() * this.pairPool.length);
        const currentPair = this.pairPool[randomIndex];
        
        document.getElementById('word-one').textContent = currentPair.word1;
        document.getElementById('word-two').textContent = currentPair.word2;
        
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        let categoryText;
        if (currentPair.type === 'same-category') {
            const categoryName = allCategories[currentPair.category1]?.name || currentPair.category1;
            categoryText = categoryName;
        } else {
            const category1Name = allCategories[currentPair.category1]?.name || currentPair.category1;
            const category2Name = allCategories[currentPair.category2]?.name || currentPair.category2;
            categoryText = `${category1Name} + ${category2Name}`;
        }
        
        document.getElementById('pair-categories').textContent = categoryText;
        
        // Store current pair for response recording
        this.currentPair = currentPair;
    }

    recordResponse(type) {
        if (!this.currentPair) return;
        
        const response = {
            word1: this.currentPair.word1,
            word2: this.currentPair.word2,
            category1: this.currentPair.category1,
            category2: this.currentPair.category2,
            pairType: this.currentPair.type,
            response: type,
            timestamp: new Date().toISOString()
        };
        
        this.sessionData.responses.push(response);
        this.stats[type]++;
        this.stats.total++;
        
        this.updateSessionStats();
        
        // Auto-advance to next pair after a short delay
        setTimeout(() => {
            this.nextPair();
        }, 200);
    }

    nextPair() {
        this.displayCurrentPair();
    }

    updateSessionStats() {
        document.getElementById('correct-count').textContent = this.stats.correct;
        document.getElementById('wrong-count').textContent = this.stats.wrong;
        document.getElementById('multiple-count').textContent = this.stats.multiple;
    }

    startTimer() {
        this.timer.startTime = Date.now() - this.timer.pausedTime;
        this.timer.isRunning = true;
        
        this.timer.interval = setInterval(() => {
            const elapsed = Date.now() - this.timer.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            
            const timeString = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            document.getElementById('session-timer').textContent = timeString;
        }, 1000);
    }

    pauseTimer() {
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.pausedTime = Date.now() - this.timer.startTime;
            this.timer.isRunning = false;
        }
    }

    pauseSession() {
        this.pauseTimer();
        
        // Update pause screen stats
        const elapsed = this.timer.pausedTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        
        document.getElementById('pause-timer').textContent = timeString;
        document.getElementById('pause-pair-count').textContent = this.stats.total;
        
        this.showScreen('pause');
    }

    resumeSession() {
        this.startTimer();
        this.showScreen('session');
    }

    endSession() {
        this.pauseTimer();
        this.sessionData.endTime = new Date().toISOString();
        
        // Calculate final stats

        const finalStats = TherapyUtils.calculateFinalStats(this.sessionData.responses);
        const duration = this.timer.pausedTime || 0;

        // const accuracy = this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0;
        // const duration = this.timer.pausedTime || 0;
        
        // Update results screen
        document.getElementById('final-duration').textContent = TherapyUtils.formatDisplayTime(Math.floor(duration / 1000));
        document.getElementById('final-total').textContent = finalStats.total;
        document.getElementById('final-correct').textContent = finalStats.totalCorrect; // Show total correct including multiple
        document.getElementById('final-accuracy').textContent = finalStats.accuracy + '%';

        // document.getElementById('final-duration').textContent = this.formatDuration(Math.floor(duration / 1000));
        // document.getElementById('final-total').textContent = this.stats.total;
        // document.getElementById('final-correct').textContent = this.stats.correct;
        // document.getElementById('final-accuracy').textContent = accuracy + '%';
        
        // Show detailed responses
        this.displayDetailedResults();

        // Show category breakdown
        this.displayCategoryBreakdown();
        
        // Save session to storage
        storage.saveSession(this.sessionData);
        
        this.showScreen('results');
    }

    displayDetailedResults() {
        const detailsContainer = document.getElementById('response-details');
        if (!detailsContainer) return;
        
        const responseDetails = TherapyUtils.generateResponseDetails(this.sessionData.responses);
        
        detailsContainer.innerHTML = `
            <h4>Response Details (${responseDetails.length} items):</h4>
            <div class="response-list">
                ${responseDetails.map(detail => `
                    <div class="response-item">
                        <span class="response-text">${detail.text}</span>
                        <span class="response-result ${detail.response}">${detail.response}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayCategoryBreakdown() {
        const breakdown = document.getElementById('category-breakdown');
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        const categoryBreakdown = TherapyUtils.generateCategoryBreakdown(this.sessionData.responses, allCategories);
        
        breakdown.innerHTML = '';
        
        categoryBreakdown.forEach(category => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'category-result';
            resultDiv.innerHTML = `
                <span>${category.categoryName}</span>
                <span>${category.totalCorrect}/${category.total} (${category.accuracy}%)</span>
            `;
            breakdown.appendChild(resultDiv);
        });
    }

    resetToSetup() {
        // Reset all data
        this.selectedCategories.clear();
        this.selectedWords.clear();
        this.pairPool = [];
        this.stats = { correct: 0, wrong: 0, multiple: 0, total: 0 };
        this.timer = { startTime: null, pausedTime: 0, interval: null, isRunning: false };
        
        // Reset form
        document.querySelector('input[name="category-mode"][value="select"]').checked = true;
        document.querySelector('input[name="pair-type"][value="same-category"]').checked = true;
        document.getElementById('pair-count').value = '10';
        document.getElementById('track-time').checked = true;
        
        // Clear selections
        document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
        
        this.handleCategoryModeChange('select');
        if (document.querySelector('input[name="word-mode"]')) {
            this.handleWordModeChange('all');
        }
        this.updatePairCount();
        
        this.showScreen('setup');
    }

    showScreen(screenName) {
        // Hide all screens
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('session-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        
        // Show target screen
        document.getElementById(`${screenName}-screen`).classList.remove('hidden');
        this.currentScreen = screenName;
    }

    // formatDuration(seconds) {
    //     const hours = Math.floor(seconds / 3600);
    //     const minutes = Math.floor((seconds % 3600) / 60);
    //     const secs = seconds % 60;
        
    //     if (hours > 0) {
    //         return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    //     } else {
    //         return `${minutes}:${secs.toString().padStart(2, '0')}`;
    //     }
    // }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new WordPairsSession();
});
