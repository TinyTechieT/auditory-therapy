// Single Words Therapy Logic
class SingleWordsSession {
    constructor() {
        this.currentScreen = 'setup';
        this.selectedCategories = new Set();
        this.selectedWords = new Set();
        this.wordPool = [];
        this.currentWordIndex = 0;
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
        // this.updateWordCount();
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
            if (e.target.type === 'checkbox' && e.target.closest('.category-grid')) {
                this.handleCategorySelection();
            }
            if (e.target.type === 'checkbox' && e.target.closest('.word-grid')) {
                this.handleWordSelection();
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
        
        document.getElementById('next-word-btn').addEventListener('click', () => {
            this.nextWord();
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
                        this.nextWord();
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
        
        this.updateWordCount();
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
        
        this.updateWordCount();
    }

    handleCategorySelection() {
        const checkedCategories = document.querySelectorAll('input[name="category"]:checked');
        this.selectedCategories.clear();
        
        checkedCategories.forEach(checkbox => {
            this.selectedCategories.add(checkbox.value);
        });
        
        this.loadWordsForSelection();
        this.updateWordCount();
    }

    handleWordSelection() {
        const checkedWords = document.querySelectorAll('#word-grid input[type="checkbox"]:checked');
        this.selectedWords.clear();
        
        checkedWords.forEach(checkbox => {
            this.selectedWords.add(checkbox.value);
        });
        
        this.updateWordCount();
    }

    loadWordsForSelection() {
        const wordGrid = document.getElementById('word-grid');
        const wordMode = document.querySelector('input[name="word-mode"]:checked').value;
        
        if (wordMode !== 'select') return;
        
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

    updateWordCount() {
        const categoryMode = document.querySelector('input[name="category-mode"]:checked').value;
        const wordMode = document.querySelector('input[name="word-mode"]:checked').value;
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        let totalWords = 0;
        
        if (categoryMode === 'random') {
            // Count all words from all categories
            Object.values(allCategories).forEach(category => {
                totalWords += category.words.length;
            });
        } else {
            // Count words from selected categories
            this.selectedCategories.forEach(categoryId => {
                if (allCategories[categoryId]) {
                    totalWords += allCategories[categoryId].words.length;
                }
            });
        }
        
        if (wordMode === 'select') {
            totalWords = this.selectedWords.size;
        }
        
        document.getElementById('word-count').textContent = totalWords;
        
        // Enable/disable start button
        const startBtn = document.getElementById('start-session-btn');
        startBtn.disabled = totalWords === 0;
    }

    startSession() {
        if (this.selectedCategories.size === 0) {
            alert('Please select at least one category before starting the session.');
            return;
        }

        if (!this.buildWordPool()) {
            alert('Please select at least one category or word to start the session.');
            return;
        }

        // if (!this.buildWordPool()) {
        //     alert('Please select at least one category or word to start the session.');
        //     return;
        // }
        
        // Prepare session data
        this.sessionData = {
            startTime: new Date().toISOString(),
            endTime: null,
            type: 'single-words',
            responses: [],
            settings: {
                categoryMode: document.querySelector('input[name="category-mode"]:checked').value,
                wordMode: document.querySelector('input[name="word-mode"]:checked').value,
                poolSize: document.getElementById('pool-size').value,
                trackTime: document.getElementById('track-time').checked,
                categories: Array.from(this.selectedCategories),
                totalWords: this.wordPool.length
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
        this.displayCurrentWord();
    }

    buildWordPool() {
        const categoryMode = document.querySelector('input[name="category-mode"]:checked').value;
        const wordMode = document.querySelector('input[name="word-mode"]:checked').value;
        const poolSize = document.getElementById('pool-size').value;
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        
        let availableWords = [];
        
        // Collect words based on selection
        if (wordMode === 'select' && this.selectedWords.size > 0) {
            availableWords = Array.from(this.selectedWords).map(word => {
                // Find which category this word belongs to
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
        
        if (availableWords.length === 0) return false;
        
        // Shuffle the words
        // availableWords = this.shuffleArray(availableWords);
        availableWords = TherapyUtils.shuffleArray(availableWords);
        
        // Limit pool size if specified
        if (poolSize !== 'all') {
            const size = parseInt(poolSize);
            availableWords = availableWords.slice(0, size);
        }
        
        this.wordPool = availableWords;
        this.currentWordIndex = 0;
        
        return true;
    }

    // shuffleArray(array) {
    //     const shuffled = [...array];
    //     for (let i = shuffled.length - 1; i > 0; i--) {
    //         const j = Math.floor(Math.random() * (i + 1));
    //         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    //     }
    //     return shuffled;
    // }

    displayCurrentWord() {
        if (this.wordPool.length === 0) return;
        
        // Get random word from pool
        const randomIndex = Math.floor(Math.random() * this.wordPool.length);
        const currentWord = this.wordPool[randomIndex];
        
        document.getElementById('current-word').textContent = currentWord.word;
        
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };
        const categoryName = allCategories[currentWord.category]?.name || currentWord.category;
        document.getElementById('word-category').textContent = categoryName;
        
        // Store current word for response recording
        this.currentWord = currentWord;
    }

    recordResponse(type) {
        if (!this.currentWord) return;
        
        const response = {
            word: this.currentWord.word,
            category: this.currentWord.category,
            response: type,
            timestamp: new Date().toISOString()
        };
        
        this.sessionData.responses.push(response);
        this.stats[type]++;
        this.stats.total++;
        
        this.updateSessionStats();
        
        // Auto-advance to next word after a short delay
        setTimeout(() => {
            this.nextWord();
        }, 200);
    }

    nextWord() {
        this.displayCurrentWord();
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
        document.getElementById('pause-word-count').textContent = this.stats.total;
        
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

        // const accuracy = this.calculateAccuracy()
        // const accuracy = this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0;
        // const accuracy = this.calculateAccuracy(this.sessionData);
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
        const categoryStats = {};
        const allCategories = { ...CONFIG.wordCategories, ...storage.getCustomCategories().words };

        const categoryBreakdown = TherapyUtils.generateCategoryBreakdown(this.sessionData.responses, allCategories);
        
        // // Calculate stats per category
        // this.sessionData.responses.forEach(response => {
        //     if (!categoryStats[response.category]) {
        //         categoryStats[response.category] = { correct: 0, total: 0 };
        //     }
        //     categoryStats[response.category].total++;
        //     if (response.response === 'correct') {
        //         categoryStats[response.category].correct++;
        //     }
        // });
        
        breakdown.innerHTML = '';
        
        // Object.entries(categoryStats).forEach(([categoryId, stats]) => {
        //     const categoryName = allCategories[categoryId]?.name || categoryId;
        //     // const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        //     // Calculate accuracy with 0.5 factor for multiple attempts
        //     let totalScore = 0;
        //     this.sessionData.responses.forEach(response => {
        //         if (response.category === categoryId) {
        //             if (response.response === 'correct') {
        //                 totalScore += 1;
        //             } else if (response.response === 'multiple') {
        //                 totalScore += 0.5;
        //             }
        //         }
        //     });
        //     const accuracy = stats.total > 0 ? Math.round((totalScore / stats.total) * 100) : 0;
            
        //     const resultDiv = document.createElement('div');
        //     resultDiv.className = 'category-result';
        //     resultDiv.innerHTML = `
        //         <span>${categoryName}</span>
        //         <span>${stats.correct}/${stats.total} (${accuracy}%)</span>
        //     `;
        //     breakdown.appendChild(resultDiv);
        // });

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
        this.wordPool = [];
        this.stats = { correct: 0, wrong: 0, multiple: 0, total: 0 };
        this.timer = { startTime: null, pausedTime: 0, interval: null, isRunning: false };
        
        // Reset form
        document.querySelector('input[name="category-mode"][value="select"]').checked = true;
        document.querySelector('input[name="word-mode"][value="all"]').checked = true;
        document.getElementById('pool-size').value = '10';
        document.getElementById('track-time').checked = true;
        
        // Clear selections
        document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
        
        this.handleCategoryModeChange('select');
        this.handleWordModeChange('all');
        this.updateWordCount();
        
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

    // calculateAccuracy(session) {
    //     if (session.responses.length === 0) return 0;
        
    //     let totalScore = 0;
    //     session.responses.forEach(response => {
    //         if (response.response === 'correct') {
    //             totalScore += 1;
    //         } else if (response.response === 'multiple') {
    //             totalScore += 0.5;
    //         }
    //         // 'wrong' responses add 0
    //     });
        
    //     return Math.round((totalScore / session.responses.length) * 100);
    // }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new SingleWordsSession();
});
