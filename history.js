/**
 * Module de gestion de l'historique et de la sauvegarde
 */

class HistoryManager {
    constructor(app) {
        this.app = app;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 30;
    }

    /**
     * Sauvegarde de l'état du canevas
     */
    saveState() {
        try {
            const cleanObjects = filterCanvasObjects(this.app.canvas.getObjects());
            
            const safeObjects = cleanObjects.map(obj => sanitizeObjectData(obj)).filter(obj => obj !== null);
            
            const canvasState = {
                version: this.app.canvas.version,
                objects: safeObjects
            };
            
            const state = JSON.stringify(canvasState);
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(state);
            this.historyIndex++;
            
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
                this.historyIndex--;
            }

            this.app.uiManager.updateSaveStatus('modified');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état:', error);
        }
    }

    /**
     * Annulation de la dernière action
     */
    undo() {
        if (this.historyIndex > 0) {
            try {
                this.historyIndex--;
                this.restoreState(this.history[this.historyIndex]);
                console.log('Annulation effectuée');
            } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
                this.app.uiManager.showErrorMessage('Erreur lors de l\'annulation');
            }
        }
    }

    /**
     * Restauration de l'action suivante
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            try {
                this.historyIndex++;
                this.restoreState(this.history[this.historyIndex]);
                console.log('Restauration effectuée');
            } catch (error) {
                console.error('Erreur lors de la restauration:', error);
                this.app.uiManager.showErrorMessage('Erreur lors de la restauration');
            }
        }
    }

    /**
     * Restaure un état donné
     * @param {string} stateJson - État JSON à restaurer
     */
    restoreState(stateJson) {
        const state = JSON.parse(stateJson);
        
        const gridObjects = this.app.canvas.getObjects().filter(obj => obj.isGrid);
        this.app.canvas.clear();
        
        gridObjects.forEach(grid => this.app.canvas.add(grid));
        
        if (state.objects && state.objects.length > 0) {
            this.app.canvasManager.loadObjectsFromData(state.objects);
        }
        
        this.app.canvas.backgroundColor = '#f8f9fa';
        this.app.canvasManager.updateObjectCount();
    }

    /**
     * Sauvegarde du projet
     */
    saveProject() {
        try {
            this.app.uiManager.updateSaveStatus('saving');
            
            const cleanObjects = filterCanvasObjects(this.app.canvas.getObjects());
            
            const safeObjects = cleanObjects.map(obj => sanitizeObjectData(obj)).filter(obj => obj !== null);
            
            const projectNameInput = document.getElementById('projectName');
            const projectName = projectNameInput?.value || 'Mon_Plan';
            
            const projectData = {
                name: projectName,
                canvas: {
                    version: this.app.canvas.version,
                    objects: safeObjects,
                    background: this.app.canvas.backgroundColor
                },
                timestamp: new Date().toISOString(),
                metadata: {
                    objectCount: safeObjects.length,
                    version: '1.0.0',
                    creator: 'ArchiDesign'
                }
            };

            const dataStr = JSON.stringify(projectData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', generateSafeFileName(projectName, 'json'));
            link.click();

            this.app.uiManager.updateSaveStatus('saved');
            this.app.uiManager.showStatusMessage('Projet sauvegardé avec succès');
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            this.app.uiManager.updateSaveStatus('error');
            this.app.uiManager.showErrorMessage('Erreur lors de la sauvegarde du projet');
        }
    }

    /**
     * Chargement d'un projet
     */
    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        this.processLoadedProject(e.target.result);
                    } catch (error) {
                        this.app.uiManager.showErrorMessage('Erreur lors du chargement: ' + error.message);
                        console.error('Erreur de chargement:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * Traite un projet chargé
     * @param {string} fileContent - Contenu du fichier
     */
    processLoadedProject(fileContent) {
        const projectData = JSON.parse(fileContent);
        
        // Vérification de la structure du projet
        if (!projectData.canvas || !projectData.canvas.objects) {
            throw new Error('Format de fichier invalide');
        }
        
        const gridObjects = this.app.canvas.getObjects().filter(obj => obj.isGrid);
        this.app.canvas.clear();
        
        gridObjects.forEach(grid => this.app.canvas.add(grid));
        
        this.app.canvasManager.loadObjectsFromData(projectData.canvas.objects);

        if (projectData.name) {
            const projectNameInput = document.getElementById('projectName');
            if (projectNameInput) {
                projectNameInput.value = projectData.name;
            }
        }

        this.app.canvas.backgroundColor = projectData.canvas?.background || '#f8f9fa';
        
        // Réinitialiser l'historique avec le nouvel état
        this.history = [];
        this.historyIndex = -1;
        this.saveState();
        
        this.app.canvasManager.updateObjectCount();
        
        this.app.uiManager.updateSaveStatus('ready');
        this.app.uiManager.showStatusMessage(`Projet "${projectData.name || 'Sans nom'}" chargé avec succès`);
        
        // Log des métadonnées si disponibles
        if (projectData.metadata) {
            console.log('Métadonnées du projet:', projectData.metadata);
        }
    }

    /**
     * Sauvegarde automatique (optionnelle)
     */
    enableAutoSave(intervalMs = 30000) {
        setInterval(() => {
            if (this.history.length > 1) { // Seulement s'il y a des changements
                this.autoSaveToLocalStorage();
            }
        }, intervalMs);
    }

    /**
     * Sauvegarde automatique dans le localStorage
     */
    autoSaveToLocalStorage() {
        try {
            const autoSaveData = {
                timestamp: new Date().toISOString(),
                state: this.history[this.historyIndex] || '{"objects":[]}'
            };
            
            // Note: localStorage n'est pas disponible dans les artifacts Claude
            // Cette méthode est préparée pour un environnement externe
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('archidesign_autosave', JSON.stringify(autoSaveData));
            }
        } catch (error) {
            console.warn('Sauvegarde automatique échouée:', error);
        }
    }

    /**
     * Récupération de la sauvegarde automatique
     */
    loadAutoSave() {
        try {
            if (typeof localStorage !== 'undefined') {
                const autoSaveData = localStorage.getItem('archidesign_autosave');
                if (autoSaveData) {
                    const parsed = JSON.parse(autoSaveData);
                    const timeDiff = Date.now() - new Date(parsed.timestamp).getTime();
                    
                    // Proposer la récupération si moins de 24h
                    if (timeDiff < 24 * 60 * 60 * 1000) {
                        if (confirm('Une sauvegarde automatique a été trouvée. Voulez-vous la récupérer ?')) {
                            this.restoreState(parsed.state);
                            this.app.uiManager.showStatusMessage('Sauvegarde automatique restaurée');
                            return true;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Erreur lors du chargement de la sauvegarde automatique:', error);
        }
        return false;
    }

    /**
     * Nettoie l'historique
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.saveState(); // Sauvegarder l'état actuel comme nouveau point de départ
    }

    /**
     * Exporte l'historique pour débogage
     * @returns {Object} Données d'historique
     */
    exportHistory() {
        return {
            history: this.history,
            currentIndex: this.historyIndex,
            totalStates: this.history.length
        };
    }

    /**
     * Obtient des statistiques sur l'historique
     * @returns {Object} Statistiques
     */
    getHistoryStats() {
        const currentState = this.history[this.historyIndex];
        let objectCount = 0;
        
        if (currentState) {
            try {
                const state = JSON.parse(currentState);
                objectCount = state.objects ? state.objects.length : 0;
            } catch (error) {
                console.error('Erreur lors du calcul des statistiques:', error);
            }
        }
        
        return {
            totalStates: this.history.length,
            currentIndex: this.historyIndex,
            canUndo: this.historyIndex > 0,
            canRedo: this.historyIndex < this.history.length - 1,
            objectCount: objectCount,
            memoryUsage: JSON.stringify(this.history).length
        };
    }
}