// Local Storage Management
class StorageManager {
    constructor() {
        this.storageKey = 'auditoryTherapyData';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                sessions: [],
                customCategories: {
                    words: {},
                    sentences: {}
                },
                settings: {
                    theme: 'light',
                    lastUsed: new Date().toISOString()
                },
                version: CONFIG.version
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    saveData(data) {
        try {
            data.settings.lastUsed = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Session management
    saveSession(sessionData) {
        const data = this.getData();
        if (data) {
            data.sessions.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...sessionData
            });
            return this.saveData(data);
        }
        return false;
    }

    getSessions() {
        const data = this.getData();
        return data ? data.sessions : [];
    }

    // Custom categories management
    addCustomWordCategory(categoryId, categoryData) {
        const data = this.getData();
        if (data) {
            data.customCategories.words[categoryId] = categoryData;
            return this.saveData(data);
        }
        return false;
    }

    addCustomSentenceCategory(categoryId, categoryData) {
        const data = this.getData();
        if (data) {
            data.customCategories.sentences[categoryId] = categoryData;
            return this.saveData(data);
        }
        return false;
    }

    getCustomCategories() {
        const data = this.getData();
        return data ? data.customCategories : { words: {}, sentences: {} };
    }

    // Settings management
    updateSettings(newSettings) {
        const data = this.getData();
        if (data) {
            data.settings = { ...data.settings, ...newSettings };
            return this.saveData(data);
        }
        return false;
    }

    getSettings() {
        const data = this.getData();
        return data ? data.settings : { theme: 'light' };
    }

    // Data export/import
    exportData() {
        const data = this.getData();
        if (data) {
            const exportData = {
                ...data,
                exportDate: new Date().toISOString(),
                appVersion: CONFIG.version
            };
            return JSON.stringify(exportData, null, 2);
        }
        return null;
    }

    importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            // Validate basic structure
            if (importedData.sessions && importedData.customCategories && importedData.settings) {
                return this.saveData(importedData);
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.initializeStorage();
        return true;
    }

    // Custom category management
    addCustomWordCategory(categoryId, categoryData) {
        const data = this.getData();
        if (data) {
            if (!data.customCategories) {
                data.customCategories = { words: {}, sentences: {} };
            }
            data.customCategories.words[categoryId] = categoryData;
            return this.saveData(data);
        }
        return false;
    }

    addCustomSentenceCategory(categoryId, categoryData) {
        const data = this.getData();
        if (data) {
            if (!data.customCategories) {
                data.customCategories = { words: {}, sentences: {} };
            }
            data.customCategories.sentences[categoryId] = categoryData;
            return this.saveData(data);
        }
        return false;
    }

    deleteCustomCategory(type, categoryId) {
        const data = this.getData();
        if (data && data.customCategories && data.customCategories[type]) {
            delete data.customCategories[type][categoryId];
            return this.saveData(data);
        }
        return false;
    }

    updateCustomCategory(type, categoryId, categoryData) {
        const data = this.getData();
        if (data && data.customCategories && data.customCategories[type]) {
            data.customCategories[type][categoryId] = categoryData;
            return this.saveData(data);
        }
        return false;
    }

}

// Initialize storage manager
const storage = new StorageManager();
