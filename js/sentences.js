// Sentences Therapy Logic
class SentencesSession {
    constructor() {
        this.currentScreen = 'setup';
        this.selectedCategories = new Set();
        this.selectedSentences = new Set();
        this.sentencePool = [];
        this.currentSentenceIndex = 0;
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
        this.loadCategories();
        this.updateSentenceCount();
    }

    initializeEventListeners() {
        // Setup screen events
        document.addEventListener('change', (e) => {
            if (e.target.name === 'category-mode') {
                this.handleCategoryModeChange(e.target.value);
            }
            if (e.target.name === 'sentence-mode') {
                this.handleSentenceModeChange(e.target.value);
            }
            if (e.target.type === 'checkbox' && e.target.closest('.category-grid')) {
                this.handleCategorySelection();
            }
            if (e.target.type === 'checkbox' && e.target.closest('.sentence-grid')) {
                this.handleSentenceSelection();
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
        
        document.getElementById('next-sentence-btn').addEventListener('click', () => {
            this.nextSentence();
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
                        this.nextSentence();
                        break;
                }
            }
        });
    }

    loadCategories() {
        const categoryGrid = document.getElementById('category-grid');
        const allCategories = { ...CONFIG.sentenceCategories, ...storage.getCustomCategories().sentences };
        
        categoryGrid.innerHTML = '';
        
        Object.entries(allCategories).forEach(([id, category]) => {
            const categoryItem = document.createElement('label');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <input type="checkbox" name="category" value="${id}">
                <span class="category-name">${category.name}</span>
                <span class="category-count">${category.sentences.length} sentences</span>
            `;
            categoryGrid.appendChild(categoryItem);
        });
    }

    handleCategoryModeChange(mode) {
        const categoryGrid = document.getElementById('category-grid');
        const sentenceSelection = document.getElementById('sentence-selection');
        
        if (mode === 'random') {
            categoryGrid.style.display = 'none';
            this.selectedCategories.clear();
            // Select all categories for random mode
            Object.keys(CONFIG.sentenceCategories).forEach(id => {
                this.selectedCategories.add(id);
            });
            this.loadSentencesForSelection();
        } else {
            categoryGrid.style.display = 'grid';
            this.selectedCategories.clear();
            this.handleCategorySelection();
        }
        
        this.updateSentenceCount();
    }

    handleSentenceModeChange(mode) {
        const sentenceGrid = document.getElementById('sentence-grid');
        
        if (mode === 'all') {
            sentenceGrid.style.display = 'none';
            this.selectedSentences.clear();
        } else {
            sentenceGrid.style.display = 'grid';
            this.loadSentencesForSelection();
        }
        
        this.updateSentenceCount();
    }

    handleCategorySelection() {
        const checkedCategories = document.querySelectorAll('input[name="category"]:checked');
        this.selectedCategories.clear();
        
        checkedCategories.forEach(checkbox => {
            this.selectedCategories.add(checkbox.value);
        });
        
        this.loadSentencesForSelection();
        this.updateSentenceCount();
    }

    handleSentenceSelection() {
        const checkedSentences = document.querySelectorAll('#sentence-grid input[type="checkbox"]:checked');
        this.selectedSentences.clear();
        
        checkedSentences.forEach(checkbox => {
            this.selectedSentences.add(checkbox.value);
        });
        
        this.updateSentenceCount();
    }

    loadSentencesForSelection() {
        const sentenceGrid = document.getElementById('sentence-grid');
        const sentenceMode = document.querySelector('input[name="sentence-mode"]:checked').value;
        
        if (sentenceMode !== 'select') return;
        
        sentenceGrid.innerHTML = '';
        
        const allCategories = { ...CONFIG.sentenceCategories, ...storage.getCustomCategories().sentences };
        
        this.selectedCategories.forEach(categoryId => {
            if (allCategories[categoryId]) {
                allCategories[categoryId].sentences.forEach(sentence => {
                    const sentenceItem = document.createElement('label');
                    sentenceItem.className = 'sentence-item';
                    sentenceItem.innerHTML = `
                        <input type="checkbox" value="${sentence}">
                        <span class="sentence-text">${sentence}</span>
                    `;
                    sentenceGrid.appendChild(sentenceItem);
                });
            }
        });
    }

    updateSentenceCount() {
        const categoryMode = document.querySelector('input[name="category-mode"]:checked').value;
        const sentenceMode = document.querySelector('input[name="sentence-mode"]:checked').value;
        const allCategories = { ...CONFIG.sentenceCategories, ...storage.getCustomCategories().sentences };
        
        let totalSentences = 0;
        
        if (categoryMode === 'random') {
            // Count all sentences from all categories
            Object.values(allCategories).forEach(category => {
                totalSentences += category.sentences.length;
            });
        } else {
            // Count sentences from selected categories
            this.selectedCategories.forEach(categoryId => {
                if (allCategories[categoryId]) {
                    totalSentences += allCategories[categoryId].sentences.length;
                }
            });
        }
        
        if (sentenceMode === 'select') {
            totalSentences = this.selectedSentences.size;
        }
        
        document.getElementById('sentence-count').textContent = totalSentences;
        
        // Enable/disable start button
        const startBtn = document.getElementById('start-session-btn');
        startBtn.disabled = totalSentences === 0;
    }

    startSession() {
        if (!this.buildSentencePool()) {
            alert('Please select at least one category or sentence to start the session.');
            return;
        }
        
        // Prepare session data
        this.sessionData = {
            startTime: new Date().toISOString(),
            endTime: null,
            type: 'sentences',
            responses: [],
            settings: {
                categoryMode: document.querySelector('input[name="category-mode"]:checked').value,
                sentenceMode: document.querySelector('input[name="sentence-mode"]:checked').value,
                poolSize: document.getElementById('pool-size').value,
                trackTime: document.getElementById('track-time').checked,
                categories: Array.from(this.selectedCategories),
                totalSentences: this.sentencePool.length
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
        this.displayCurrentSentence();
    }

    buildSentencePool() {
        const categoryMode = document.querySelector('input[name="category-mode"]:checked').value;
        const sentenceMode = document.querySelector('input[name="sentence-mode"]:checked').value;
        const poolSize = document.getElementById('pool-size').value;
        const allCategories = { ...CONFIG.sentenceCategories, ...storage.getCustomCategories().sentences };
        
        let availableSentences = [];
        
        // Collect sentences based on selection
        if (sentenceMode === 'select' && this.selectedSentences.size > 0) {
            availableSentences = Array.from(this.selectedSentences).map(sentence => {
                // Find which category this sentence belongs to
                let categoryId = '';
                for (const [id, category] of Object.entries(allCategories)) {
                    if (category.sentences.includes(sentence)) {
                        categoryId = id;
                        break;
                    }
                }
                return { sentence, category: categoryId };
            });
        } else {
            // Use all sentences from selected categories
            this.selectedCategories.forEach(categoryId => {
                if (allCategories[categoryId]) {
                    allCategories[categoryId].sentences.forEach(sentence => {
                        availableSentences.push({ sentence, category: categoryId });
                    });
                }
            });
        }
        
        if (availableSentences.length === 0) return false;
        
        // Shuffle the sentences
        availableSentences = this.shuffleArray(availableSentences);
        
        // Limit pool size if specified
        if (poolSize !== 'all') {
            const size = parseInt(poolSize);
            availableSentences = availableSentences.slice(0, size);
        }
        
        this.sentencePool = availableSentences;
        this.currentSentenceIndex = 0;
        
        return true;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    displayCurrentSentence() {
        if (this.sentencePool.length === 0) return;
        
        // Get random sentence from pool
        const randomIndex = Math.floor(Math.random() * this.sentencePool.length);
        const currentSentence = this.sentencePool[randomIndex];
        
        document.getElementById('current-sentence').textContent = currentSentence.sentence;
        
        const allCategories = { ...CONFIG.sentenceCategories, ...storage.getCustomCategories().sentences };
        const categoryName = allCategories[currentSentence.category]?.name || currentSentence.category;
        document.getElementById('sentence-category').textContent = categoryName;
        
        // Store current sentence for response recording
        this.currentSentence = currentSentence;
    }

    recordResponse(type) {
        if (!this.currentSentence) return;
        
        const response = {
            sentence: this.currentSentence.sentence,
            category: this.currentSentence.category,
            response: type,
            timestamp: new Date().toISOString()
        };
        
        this.sessionData.responses.push(response);
        this.stats[type]++;
        this.stats.total++;
        
        this.updateSessionStats();
        
        // Auto-advance to next sentence after a short delay
        setTimeout(() => {
            this.nextSentence();
        }, 500);
    }

    nextSentence() {
        this.displayCurrentSentence();
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
        document.getElementById('pause-sentence-count').textContent = this.stats.total;
        
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
        const accuracy = this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0;
        const duration = this.timer.pausedTime || 0;
        
        // Update results screen
        document.getElementById('final-duration').textContent = this.formatDuration(Math.floor(duration / 1000));
        document.getElementById('final-total').textContent = this.stats.total;
        document.getElementById('final-correct').textContent = this.stats.correct;
        document.getElementById('final-accuracy').textContent = accuracy + '%';
        
        // Show category breakdown
        this.displayCategoryBreakdown();
        
        // Save session to storage
        storage.saveSession(this.sessionData);
        
        this.showScreen('results');
    }

    displayCategoryBreakdown() {
        const breakdown = document.getElementById('category-breakdown');
        const categoryStats = {};
        const allCategories = { ...CONFIG.sentenceCategories, ...storage.getCustomCategories().sentences };
        
        // Calculate stats per category
        this.sessionData.responses.forEach(response => {
            if (!categoryStats[response.category]) {
                categoryStats[response.category] = { correct: 0, total: 0 };
            }
            categoryStats[response.category].total++;
            if (response.response === 'correct') {
                categoryStats[response.category].correct++;
            }
        });
        
        breakdown.innerHTML = '';
        
        Object.entries(categoryStats).forEach(([categoryId, stats]) => {
            const categoryName = allCategories[categoryId]?.name || categoryId;
            const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'category-result';
            resultDiv.innerHTML = `
                <span>${categoryName}</span>
                <span>${stats.correct}/${stats.total} (${accuracy}%)</span>
            `;
            breakdown.appendChild(resultDiv);
        });
    }

    resetToSetup() {
        // Reset all data
        this.selectedCategories.clear();
        this.selectedSentences.clear();
        this.sentencePool = [];
        this.stats = { correct: 0, wrong: 0, multiple: 0, total: 0 };
        this.timer = { startTime: null, pausedTime: 0, interval: null, isRunning: false };
        
        // Reset form
        document.querySelector('input[name="category-mode"][value="select"]').checked = true;
        document.querySelector('input[name="sentence-mode"][value="all"]').checked = true;
        document.getElementById('pool-size').value = '10';
        document.getElementById('track-time').checked = true;
        
        // Clear selections
        document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
        
        this.handleCategoryModeChange('select');
        this.handleSentenceModeChange('all');
        this.updateSentenceCount();
        
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

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new SentencesSession();
});
