// Shared Therapy Utilities
class TherapyUtils {

    // Wait for config data to be loaded
    static async waitForConfigData() {
        return new Promise((resolve) => {
            if (Object.keys(CONFIG.wordCategories).length > 0) {
                resolve();
            } else {
                document.addEventListener('configDataLoaded', resolve, { once: true });
            }
        });
    }

    // Common initialization for all therapy pages
    static async initializeTherapyPage(therapyInstance) {
        await this.waitForConfigData();
        
        // Call the appropriate load method based on therapy type
        if (therapyInstance.loadCategories) {
            therapyInstance.loadCategories();
        }
        
        // Call the appropriate count update method
        if (therapyInstance.updateWordCount) {
            therapyInstance.updateWordCount();
        } else if (therapyInstance.updatePairCount) {
            therapyInstance.updatePairCount();
        } else if (therapyInstance.updateSentenceCount) {
            therapyInstance.updateSentenceCount();
        }
    }

    // Calculate accuracy with 0.5 factor for multiple attempts
    static calculateAccuracy(responses) {
        if (!responses || responses.length === 0) return 0;
        
        let totalScore = 0;
        responses.forEach(response => {
            if (response.response === 'correct') {
                totalScore += 1;
            } else if (response.response === 'multiple') {
                totalScore += 0.5;
            }
            // 'wrong' responses add 0
        });
        
        return Math.round((totalScore / responses.length) * 100);
    }

    // Calculate final stats - multiple attempts count as correct for totals
    static calculateFinalStats(responses) {
        let correct = 0;
        let multiple = 0;
        let wrong = 0;

        responses.forEach(response => {
            if (response.response === 'correct') {
                correct++;
            } else if (response.response === 'multiple') {
                multiple++;
            } else if (response.response === 'wrong') {
                wrong++;
            }
        });

        return {
            correct: correct,
            multiple: multiple,
            wrong: wrong,
            totalCorrect: correct + multiple, // Include multiple in total correct
            total: responses.length,
            accuracy: this.calculateAccuracy(responses)
        };
    }

    // Format time for display (HH:MM, MM:SS, or ss.ms)
    static formatDisplayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } else if (minutes > 0) {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            const totalSeconds = seconds.toFixed(2);
            return `${totalSeconds}s`;
        }
    }

    // Shuffle array utility
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Generate category breakdown for results
    static generateCategoryBreakdown(responses, allCategories) {
        const categoryStats = {};
        
        // Calculate stats per category
        responses.forEach(response => {
            if (!categoryStats[response.category]) {
                categoryStats[response.category] = {
                    correct: 0,
                    multiple: 0,
                    wrong: 0,
                    total: 0
                };
            }
            categoryStats[response.category].total++;
            categoryStats[response.category][response.response]++;
        });

        // Generate breakdown HTML
        const breakdown = [];
        Object.entries(categoryStats).forEach(([categoryId, stats]) => {
            const categoryName = allCategories[categoryId]?.name || categoryId;
            const finalStats = this.calculateFinalStats(
                responses.filter(r => r.category === categoryId)
            );
            
            breakdown.push({
                categoryId,
                categoryName,
                correct: stats.correct,
                multiple: stats.multiple,
                wrong: stats.wrong,
                total: stats.total,
                totalCorrect: stats.correct + stats.multiple,
                accuracy: finalStats.accuracy
            });
        });

        return breakdown;
    }

    // Generate detailed response list for results
    static generateResponseDetails(responses) {
        return responses.map(response => {
            let text = '';
            if (response.sentence) {
                text = response.sentence;
            } else if (response.word1 && response.word2) {
                text = `${response.word1} and ${response.word2}`;
            } else if (response.word) {
                text = response.word;
            }
            
            return {
                text: text,
                response: response.response,
                timestamp: response.timestamp
            };
        });
    }

    // Format duration
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
}

// Make available globally
window.TherapyUtils = TherapyUtils;