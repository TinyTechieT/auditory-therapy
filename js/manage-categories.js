// Category Management Logic
class CategoryManager {
    constructor() {
        this.currentTab = 'words';
        this.editingCategory = null;
        this.editingType = null;
        
        this.initializeEventListeners();
        this.loadCategories();
    }

    initializeEventListeners() {
        // Tab switching
        document.getElementById('words-tab').addEventListener('click', () => {
            this.switchTab('words');
        });
        
        document.getElementById('sentences-tab').addEventListener('click', () => {
            this.switchTab('sentences');
        });

        // Add category buttons
        document.getElementById('add-word-category-btn').addEventListener('click', () => {
            this.openAddModal('words');
        });
        
        document.getElementById('add-sentence-category-btn').addEventListener('click', () => {
            this.openAddModal('sentences');
        });

        // Modal controls
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('save-category-btn').addEventListener('click', () => {
            this.saveCategory();
        });

        // Delete modal controls
        document.getElementById('close-delete-modal-btn').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Close modals on backdrop click
        document.getElementById('category-modal').addEventListener('click', (e) => {
            if (e.target.id === 'category-modal') {
                this.closeModal();
            }
        });
        
        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.closeDeleteModal();
            }
        });

        // Form submission
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.getElementById('words-tab').classList.toggle('active', tab === 'words');
        document.getElementById('sentences-tab').classList.toggle('active', tab === 'sentences');
        
        // Update sections
        document.getElementById('words-section').classList.toggle('hidden', tab !== 'words');
        document.getElementById('sentences-section').classList.toggle('hidden', tab !== 'sentences');
    }

    loadCategories() {
        this.loadWordCategories();
        this.loadSentenceCategories();
    }

    loadWordCategories() {
        // Load default categories
        const defaultContainer = document.getElementById('default-word-categories');
        defaultContainer.innerHTML = '';
        
        Object.entries(CONFIG.wordCategories).forEach(([id, category]) => {
            const card = this.createCategoryCard(id, category, 'words', true);
            defaultContainer.appendChild(card);
        });

        // Load custom categories
        const customContainer = document.getElementById('custom-word-categories');
        const noCustomMessage = document.getElementById('no-custom-words');
        customContainer.innerHTML = '';
        
        const customCategories = storage.getCustomCategories().words;
        
        if (Object.keys(customCategories).length === 0) {
            noCustomMessage.classList.remove('hidden');
        } else {
            noCustomMessage.classList.add('hidden');
            Object.entries(customCategories).forEach(([id, category]) => {
                const card = this.createCategoryCard(id, category, 'words', false);
                customContainer.appendChild(card);
            });
        }
    }

    loadSentenceCategories() {
        // Load default categories
        const defaultContainer = document.getElementById('default-sentence-categories');
        defaultContainer.innerHTML = '';
        
        Object.entries(CONFIG.sentenceCategories).forEach(([id, category]) => {
            const card = this.createCategoryCard(id, category, 'sentences', true);
            defaultContainer.appendChild(card);
        });

        // Load custom categories
        const customContainer = document.getElementById('custom-sentence-categories');
        const noCustomMessage = document.getElementById('no-custom-sentences');
        customContainer.innerHTML = '';
        
        const customCategories = storage.getCustomCategories().sentences;
        
        if (Object.keys(customCategories).length === 0) {
            noCustomMessage.classList.remove('hidden');
        } else {
            noCustomMessage.classList.add('hidden');
            Object.entries(customCategories).forEach(([id, category]) => {
                const card = this.createCategoryCard(id, category, 'sentences', false);
                customContainer.appendChild(card);
            });
        }
    }

    createCategoryCard(id, category, type, isDefault) {
        const card = document.createElement('div');
        card.className = `category-card ${isDefault ? 'default' : 'custom'}`;
        
        const items = type === 'words' ? category.words : category.sentences;
        const itemType = type === 'words' ? 'words' : 'sentences';
        
        card.innerHTML = `
            <div class="category-header">
                <h4 class="category-name">${category.name}</h4>
                ${!isDefault ? `
                    <div class="category-actions">
                        <button class="action-btn edit" title="Edit Category">✏️</button>
                        <button class="action-btn delete" title="Delete Category">🗑️</button>
                    </div>
                ` : ''}
            </div>
            <div class="category-count">${items.length} ${itemType}</div>
            <div class="category-preview">
                ${items.slice(0, 10).map(item => `<span class="preview-item">${item}</span>`).join('')}
                ${items.length > 10 ? '<span class="preview-item">...</span>' : ''}
            </div>
        `;

        // Add event listeners for custom categories
        if (!isDefault) {
            const editBtn = card.querySelector('.edit');
            const deleteBtn = card.querySelector('.delete');
            
            editBtn.addEventListener('click', () => {
                this.openEditModal(id, category, type);
            });
            
            deleteBtn.addEventListener('click', () => {
                this.openDeleteModal(id, category.name, type);
            });
        }

        return card;
    }

    openAddModal(type) {
        this.editingCategory = null;
        this.editingType = type;
        
        document.getElementById('modal-title').textContent = `Add ${type === 'words' ? 'Word' : 'Sentence'} Category`;
        document.getElementById('category-name').value = '';
        document.getElementById('category-words').value = '';
        document.getElementById('category-sentences').value = '';
        
        // Show/hide appropriate input groups
        document.getElementById('words-input-group').style.display = type === 'words' ? 'block' : 'none';
        document.getElementById('sentences-input-group').style.display = type === 'sentences' ? 'block' : 'none';
        
        document.getElementById('category-modal').classList.remove('hidden');
        document.getElementById('category-name').focus();
    }

    openEditModal(id, category, type) {
        this.editingCategory = id;
        this.editingType = type;
        
        document.getElementById('modal-title').textContent = `Edit ${type === 'words' ? 'Word' : 'Sentence'} Category`;
        document.getElementById('category-name').value = category.name;
        
        if (type === 'words') {
            document.getElementById('category-words').value = category.words.join('\n');
            document.getElementById('words-input-group').style.display = 'block';
            document.getElementById('sentences-input-group').style.display = 'none';
        } else {
            document.getElementById('category-sentences').value = category.sentences.join('\n');
            document.getElementById('words-input-group').style.display = 'none';
            document.getElementById('sentences-input-group').style.display = 'block';
        }
        
        document.getElementById('category-modal').classList.remove('hidden');
        document.getElementById('category-name').focus();
    }

    openDeleteModal(id, name, type) {
        this.deletingCategory = id;
        this.deletingType = type;
        
        document.getElementById('delete-category-name').textContent = name;
        document.getElementById('delete-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('category-modal').classList.add('hidden');
        this.editingCategory = null;
        this.editingType = null;
    }

    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        this.deletingCategory = null;
        this.deletingType = null;
    }

    saveCategory() {
        const name = document.getElementById('category-name').value.trim();
        
        if (!name) {
            alert('Please enter a category name.');
            return;
        }

        let items = [];
        
        if (this.editingType === 'words') {
            const wordsText = document.getElementById('category-words').value.trim();
            if (!wordsText) {
                alert('Please enter at least one word.');
                return;
            }
            items = wordsText.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        } else {
            const sentencesText = document.getElementById('category-sentences').value.trim();
            if (!sentencesText) {
                alert('Please enter at least one sentence.');
                return;
            }
            items = sentencesText.split('\n').map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
        }

        if (items.length === 0) {
            alert(`Please enter at least one ${this.editingType === 'words' ? 'word' : 'sentence'}.`);
            return;
        }

        const categoryData = {
            name: name,
            [this.editingType]: items
        };

        let success = false;
        
        if (this.editingCategory) {
            // Update existing category
            if (this.editingType === 'words') {
                success = storage.updateCustomCategory('words', this.editingCategory, categoryData);
            } else {
                success = storage.updateCustomCategory('sentences', this.editingCategory, categoryData);
            }
        } else {
            // Add new category
            const categoryId = this.generateCategoryId(name);
            if (this.editingType === 'words') {
                success = storage.addCustomWordCategory(categoryId, categoryData);
            } else {
                success = storage.addCustomSentenceCategory(categoryId, categoryData);
            }
        }

        if (success) {
            this.closeModal();
            this.loadCategories();
            alert(`Category ${this.editingCategory ? 'updated' : 'added'} successfully!`);
        } else {
            alert('Failed to save category. Please try again.');
        }
    }

    confirmDelete() {
        const success = storage.deleteCustomCategory(this.deletingType, this.deletingCategory);
        
        if (success) {
            this.closeDeleteModal();
            this.loadCategories();
            alert('Category deleted successfully!');
        } else {
            alert('Failed to delete category. Please try again.');
        }
    }

    generateCategoryId(name) {
        // Generate a simple ID from the name
        const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString().slice(-6);
        return `${baseId}_${timestamp}`;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new CategoryManager();
});
