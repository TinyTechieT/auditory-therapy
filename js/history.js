// History Page Logic
class HistoryManager {
    constructor() {
        this.sessions = [];
        this.filteredSessions = [];
        this.currentView = 'list';
        this.filters = {
            type: 'all',
            date: 'all',
            sort: 'date-desc'
        };
        
        this.initializeEventListeners();
        this.loadSessions();
        this.updateSummaryStats();
        this.displaySessions();
    }

    initializeEventListeners() {
        // Filter controls
        document.getElementById('apply-filters-btn').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });
        
        document.getElementById('clear-filters-alt-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Data management
        document.getElementById('export-json-btn').addEventListener('click', () => {
            this.exportJSON();
        });
        
        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportCSV();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            this.clearHistory();
        });

        // View toggle
        document.getElementById('list-view-btn').addEventListener('click', () => {
            this.setView('list');
        });
        
        document.getElementById('card-view-btn').addEventListener('click', () => {
            this.setView('card');
        });

        // Modal controls
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal on backdrop click
        document.getElementById('session-modal').addEventListener('click', (e) => {
            if (e.target.id === 'session-modal') {
                this.closeModal();
            }
        });
    }

    loadSessions() {
        this.sessions = storage.getSessions();
        this.filteredSessions = [...this.sessions];
    }

    updateSummaryStats() {
        const totalSessions = this.sessions.length;
        let totalDuration = 0;
        let totalCorrect = 0;
        let totalItems = 0;

        this.sessions.forEach(session => {
            // Calculate duration
            if (session.startTime && session.endTime) {
                const start = new Date(session.startTime);
                const end = new Date(session.endTime);
                totalDuration += (end - start) / 1000; // in seconds
            }

            // Calculate accuracy stats
            session.responses.forEach(response => {
                totalItems++;
                if (response.response === 'correct') {
                    totalCorrect++;
                }
            });
        });

        const avgAccuracy = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;

        // Update display
        document.getElementById('total-sessions').textContent = totalSessions;
        document.getElementById('total-time').textContent = this.formatDuration(totalDuration);
        document.getElementById('avg-accuracy').textContent = avgAccuracy + '%';
        document.getElementById('total-items').textContent = totalItems;
    }

    applyFilters() {
        // Get filter values
        this.filters.type = document.getElementById('filter-type').value;
        this.filters.date = document.getElementById('filter-date').value;
        this.filters.sort = document.getElementById('sort-by').value;

        // Apply filters
        this.filteredSessions = this.sessions.filter(session => {
            // Type filter
            if (this.filters.type !== 'all' && session.type !== this.filters.type) {
                return false;
            }

            // Date filter
            if (this.filters.date !== 'all') {
                const sessionDate = new Date(session.startTime);
                const now = new Date();
                
                switch (this.filters.date) {
                    case 'today':
                        if (!this.isSameDay(sessionDate, now)) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (sessionDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (sessionDate < monthAgo) return false;
                        break;
                }
            }

            return true;
        });

        // Apply sorting
        this.filteredSessions.sort((a, b) => {
            switch (this.filters.sort) {
                case 'date-desc':
                    return new Date(b.startTime) - new Date(a.startTime);
                case 'date-asc':
                    return new Date(a.startTime) - new Date(b.startTime);
                case 'accuracy-desc':
                    return this.calculateAccuracy(b) - this.calculateAccuracy(a);
                case 'accuracy-asc':
                    return this.calculateAccuracy(a) - this.calculateAccuracy(b);
                case 'duration-desc':
                    return this.calculateDuration(b) - this.calculateDuration(a);
                case 'duration-asc':
                    return this.calculateDuration(a) - this.calculateDuration(b);
                default:
                    return 0;
            }
        });

        this.displaySessions();
    }

    clearFilters() {
        // Reset filter controls
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-date').value = 'all';
        document.getElementById('sort-by').value = 'date-desc';

        // Reset filters object
        this.filters = {
            type: 'all',
            date: 'all',
            sort: 'date-desc'
        };

        // Reset filtered sessions
        this.filteredSessions = [...this.sessions];
        this.displaySessions();
    }

    displaySessions() {
        const container = document.getElementById('sessions-container');
        const noSessions = document.getElementById('no-sessions');
        const sessionCount = document.getElementById('session-count');

        sessionCount.textContent = this.filteredSessions.length;

        if (this.filteredSessions.length === 0) {
            container.innerHTML = '';
            noSessions.classList.remove('hidden');
            return;
        }

        noSessions.classList.add('hidden');

        if (this.currentView === 'list') {
            this.displayListView(container);
        } else {
            this.displayCardView(container);
        }
    }

    displayListView(container) {
        container.className = 'sessions-container';
        
        const listHTML = `
            <div class="sessions-list">
                ${this.filteredSessions.map(session => this.createSessionListItem(session)).join('')}
            </div>
        `;
        
        container.innerHTML = listHTML;

        // Add click listeners
        container.querySelectorAll('.session-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showSessionDetails(this.filteredSessions[index]);
            });
        });
    }

    displayCardView(container) {
        container.className = 'sessions-container';
        
        const gridHTML = `
            <div class="sessions-grid">
                ${this.filteredSessions.map(session => this.createSessionCard(session)).join('')}
            </div>
        `;
        
        container.innerHTML = gridHTML;

        // Add click listeners
        container.querySelectorAll('.session-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showSessionDetails(this.filteredSessions[index]);
            });
        });
    }

    createSessionListItem(session) {
        const accuracy = this.calculateAccuracy(session);
        const duration = this.calculateDuration(session);
        const date = new Date(session.startTime);
        const totalItems = session.responses.length;

        return `
            <div class="session-item">
                <div class="session-main">
                    <div class="session-title">
                        <span class="session-type ${session.type}">${this.formatSessionType(session.type)}</span>
                        ${this.formatDate(date)}
                    </div>
                    <div class="session-meta">
                        <span>${totalItems} items</span>
                        <span>${this.formatDuration(duration)}</span>
                        <span>Categories: ${session.settings.categories ? session.settings.categories.length : 'N/A'}</span>
                    </div>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="stat-value ${this.getAccuracyClass(accuracy)}">${accuracy}%</div>
                        <div class="stat-name">Accuracy</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-value">${session.responses.filter(r => r.response === 'correct').length}</div>
                        <div class="stat-name">Correct</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-value">${session.responses.filter(r => r.response === 'wrong').length}</div>
                        <div class="stat-name">Wrong</div>
                    </div>
                </div>
            </div>
        `;
    }

    createSessionCard(session) {
        const accuracy = this.calculateAccuracy(session);
        const duration = this.calculateDuration(session);
        const date = new Date(session.startTime);
        const totalItems = session.responses.length;

        return `
            <div class="session-card">
                <div class="session-title">
                    <span class="session-type ${session.type}">${this.formatSessionType(session.type)}</span>
                </div>
                <div class="session-meta">
                    <span><strong>Date:</strong> ${this.formatDate(date)}</span>
                    <span><strong>Duration:</strong> ${this.formatDuration(duration)}</span>
                    <span><strong>Items:</strong> ${totalItems}</span>
                    <span><strong>Categories:</strong> ${session.settings.categories ? session.settings.categories.length : 'N/A'}</span>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="stat-value ${this.getAccuracyClass(accuracy)}">${accuracy}%</div>
                        <div class="stat-name">Accuracy</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-value">${session.responses.filter(r => r.response === 'correct').length}</div>
                        <div class="stat-name">Correct</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-value">${session.responses.filter(r => r.response === 'wrong').length}</div>
                        <div class="stat-name">Wrong</div>
                    </div>
                </div>
            </div>
        `;
    }

    showSessionDetails(session) {
        const modal = document.getElementById('session-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        const accuracy = this.calculateAccuracy(session);
        const duration = this.calculateDuration(session);
        const date = new Date(session.startTime);

        modalTitle.textContent = `${this.formatSessionType(session.type)} Session - ${this.formatDate(date)}`;

        const correctResponses = session.responses.filter(r => r.response === 'correct').length;
        const wrongResponses = session.responses.filter(r => r.response === 'wrong').length;
        const multipleResponses = session.responses.filter(r => r.response === 'multiple').length;

        modalBody.innerHTML = `
            <div class="modal-session-info">
                <div class="modal-info-item">
                    <div class="modal-info-value">${this.formatDuration(duration)}</div>
                    <div class="modal-info-label">Duration</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-value ${this.getAccuracyClass(accuracy)}">${accuracy}%</div>
                    <div class="modal-info-label">Accuracy</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-value">${session.responses.length}</div>
                    <div class="modal-info-label">Total Items</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-value">${correctResponses}</div>
                    <div class="modal-info-label">Correct</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-value">${wrongResponses}</div>
                    <div class="modal-info-label">Wrong</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-value">${multipleResponses}</div>
                    <div class="modal-info-label">Multiple</div>
                </div>
            </div>

            ${session.settings.categories ? `
                <div class="modal-section">
                    <h4>Categories Practiced:</h4>
                    <p>${session.settings.categories.join(', ')}</p>
                </div>
            ` : ''}

            <div class="modal-responses">
                <h4>Response Details (${session.responses.length} items):</h4>
                <div class="response-list">
                    ${session.responses.map(response => `
                        <div class="response-item">
                            <span class="response-text">${this.getResponseText(response)}</span>
                            <span class="response-result ${response.response}">${response.response}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('session-modal').classList.add('hidden');
    }

    setView(view) {
        this.currentView = view;
        
        // Update button states
        document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
        document.getElementById('card-view-btn').classList.toggle('active', view === 'card');
        
        this.displaySessions();
    }

    exportJSON() {
        const data = storage.exportData();
        if (data) {
            this.downloadFile(data, 'auditory-therapy-data.json', 'application/json');
        }
    }

    exportCSV() {
        const sessions = storage.getSessions();
        
        const csvHeader = [
            'Date',
            'Type',
            'Duration (seconds)',
            'Total Items',
            'Correct',
            'Wrong',
            'Multiple Attempts',
            'Accuracy (%)',
            'Categories'
        ].join(',');

        const csvRows = sessions.map(session => {
            const accuracy = this.calculateAccuracy(session);
            const duration = this.calculateDuration(session);
            const correct = session.responses.filter(r => r.response === 'correct').length;
            const wrong = session.responses.filter(r => r.response === 'wrong').length;
            const multiple = session.responses.filter(r => r.response === 'multiple').length;
            const categories = session.settings.categories ? session.settings.categories.join(';') : '';

            return [
                session.startTime,
                session.type,
                duration,
                session.responses.length,
                correct,
                wrong,
                multiple,
                accuracy,
                categories
            ].join(',');
        });

        const csvContent = [csvHeader, ...csvRows].join('\n');
        this.downloadFile(csvContent, 'auditory-therapy-sessions.csv', 'text/csv');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = storage.importData(e.target.result);
                if (success) {
                    alert('Data imported successfully!');
                    this.loadSessions();
                    this.updateSummaryStats();
                    this.applyFilters();
                    // this.displaySessions();

                    // Reset the file input
                    document.getElementById('import-file').value = '';
                } else {
                    alert('Failed to import data. Please check the file format.');
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all session history? This action cannot be undone.')) {
            storage.clearAllData();
            this.loadSessions();
            this.updateSummaryStats();
            this.displaySessions();
            alert('All session history has been cleared.');
        }
    }

    // Utility methods
    calculateAccuracy(session) {
        if (session.responses.length === 0) return 0;
        const correct = session.responses.filter(r => r.response === 'correct').length;
        return Math.round((correct / session.responses.length) * 100);
    }

    calculateDuration(session) {
        if (!session.startTime || !session.endTime) return 0;
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        return Math.floor((end - start) / 1000); // in seconds
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.round((seconds % 1) * 100); // Get 2 decimal places
        
        if (hours > 0) {
            // Format: HH:MM
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            // return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            // Format: MM:SS
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            // return `${minutes}m ${secs}s`;
        } else {
            // Format: ss.ms (with 2 decimal places)
            const totalSeconds = seconds.toFixed(2);
            return `${totalSeconds}s`;
            // return `${secs}s`;
        }
    }

    formatDate(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatSessionType(type) {
        switch (type) {
            case 'single-words': return 'Single Words';
            case 'word-pairs': return 'Word Pairs';
            case 'sentences': return 'Sentences';
            default: return type;
        }
    }

    getAccuracyClass(accuracy) {
        if (accuracy >= 90) return 'accuracy-excellent';
        if (accuracy >= 75) return 'accuracy-good';
        if (accuracy >= 60) return 'accuracy-fair';
        return 'accuracy-poor';
    }

    getResponseText(response) {
        if (response.sentence) {
            return response.sentence;
        } else if (response.word1 && response.word2) {
            return `${response.word1} and ${response.word2}`;
        } else if (response.word) {
            return response.word;
        }
        return 'Unknown item';
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new HistoryManager();
});
