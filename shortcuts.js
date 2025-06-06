/**
 * Module de gestion des raccourcis clavier
 */

class ShortcutManager {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.isRecording = false;
        this.customShortcuts = new Map();
    }

    /**
     * Initialisation du gestionnaire de raccourcis
     */
    init() {
        this.setupDefaultShortcuts();
        this.setupEventListeners();
        this.loadCustomShortcuts();
    }

    /**
     * Configuration des raccourcis par défaut
     */
    setupDefaultShortcuts() {
        // Raccourcis de fichier
        this.addShortcut('Ctrl+N', () => this.app.clearCanvas(), 'Nouveau projet');
        this.addShortcut('Ctrl+O', () => this.app.loadProject(), 'Ouvrir projet');
        this.addShortcut('Ctrl+S', () => this.app.saveProject(), 'Sauvegarder projet');
        this.addShortcut('Ctrl+Shift+S', () => this.showSaveAsDialog(), 'Sauvegarder sous');
        this.addShortcut('Ctrl+E', () => this.app.exportImage(), 'Exporter image');
        this.addShortcut('Ctrl+P', () => this.app.printCanvas(), 'Imprimer');

        // Raccourcis d'édition
        this.addShortcut('Ctrl+Z', () => this.app.undo(), 'Annuler');
        this.addShortcut('Ctrl+Y', () => this.app.redo(), 'Refaire');
        this.addShortcut('Ctrl+Shift+Z', () => this.app.redo(), 'Refaire');
        this.addShortcut('Ctrl+C', () => this.app.copySelectedObject(), 'Copier');
        this.addShortcut('Ctrl+V', () => this.app.pasteObject(), 'Coller');
        this.addShortcut('Ctrl+X', () => this.cutSelectedObject(), 'Couper');
        this.addShortcut('Ctrl+D', () => this.app.duplicateSelectedObject(), 'Dupliquer');
        this.addShortcut('Ctrl+A', () => this.selectAllObjects(), 'Tout sélectionner');
        this.addShortcut('Delete', () => this.app.deleteSelectedObject(), 'Supprimer');
        this.addShortcut('Backspace', () => this.app.deleteSelectedObject(), 'Supprimer');

        // Raccourcis d'affichage
        this.addShortcut('Ctrl++', () => this.app.zoomIn(), 'Zoom avant');
        this.addShortcut('Ctrl+-', () => this.app.zoomOut(), 'Zoom arrière');
        this.addShortcut('Ctrl+0', () => this.app.zoomTo100(), 'Zoom 100%');
        this.addShortcut('Ctrl+1', () => this.app.zoomToFit(), 'Ajuster à la fenêtre');
        this.addShortcut('F11', () => this.app.toggleFullscreen(), 'Plein écran');

        // Raccourcis d'outils
        this.addShortcut('1', () => this.app.selectTool('select'), 'Outil sélection');
        this.addShortcut('2', () => this.app.selectTool('wall'), 'Outil mur');
        this.addShortcut('3', () => this.app.selectTool('door'), 'Outil porte');
        this.addShortcut('4', () => this.app.selectTool('window'), 'Outil fenêtre');
        this.addShortcut('5', () => this.app.selectTool('rectangle'), 'Outil rectangle');
        this.addShortcut('6', () => this.app.selectTool('circle'), 'Outil cercle');
        this.addShortcut('L', () => this.app.selectTool('line'), 'Outil ligne');
        this.addShortcut('T', () => this.app.selectTool('text'), 'Outil texte');
        this.addShortcut('E', () => this.app.selectTool('eraser'), 'Outil gomme');
        this.addShortcut('H', () => this.app.selectTool('hand'), 'Outil main');
        this.addShortcut('M', () => this.app.selectTool('measure'), 'Outil mesure');

        // Raccourcis d'alignement
        this.addShortcut('Ctrl+Shift+L', () => this.app.alignSelectedObjects('left'), 'Aligner à gauche');
        this.addShortcut('Ctrl+Shift+C', () => this.app.alignSelectedObjects('center'), 'Centrer horizontalement');
        this.addShortcut('Ctrl+Shift+R', () => this.app.alignSelectedObjects('right'), 'Aligner à droite');
        this.addShortcut('Ctrl+Shift+T', () => this.app.alignSelectedObjects('top'), 'Aligner en haut');
        this.addShortcut('Ctrl+Shift+M', () => this.app.alignSelectedObjects('middle'), 'Centrer verticalement');
        this.addShortcut('Ctrl+Shift+B', () => this.app.alignSelectedObjects('bottom'), 'Aligner en bas');

        // Raccourcis d'organisation
        this.addShortcut('Ctrl+G', () => this.app.groupSelectedObjects(), 'Grouper');
        this.addShortcut('Ctrl+Shift+G', () => this.app.ungroupSelectedObject(), 'Dégrouper');
        this.addShortcut('Ctrl+]', () => this.app.bringToFront(), 'Premier plan');
        this.addShortcut('Ctrl+[', () => this.app.sendToBack(), 'Arrière plan');
        this.addShortcut('Ctrl+Shift+]', () => this.bringForward(), 'Avancer');
        this.addShortcut('Ctrl+Shift+[', () => this.sendBackward(), 'Reculer');

        // Raccourcis de grille et accrochage
        this.addShortcut('Ctrl+;', () => this.toggleGrid(), 'Basculer grille');
        this.addShortcut('Ctrl+Shift+;', () => this.toggleSnap(), 'Basculer accrochage');
        this.addShortcut('Ctrl+R', () => this.app.toggleRulers(), 'Basculer règles');

        // Raccourcis de navigation
        this.addShortcut('Space', () => this.activateHandTool(), 'Activer main temporaire');
        this.addShortcut('Escape', () => this.cancelCurrentAction(), 'Annuler action');
        this.addShortcut('Enter', () => this.confirmCurrentAction(), 'Confirmer action');

        // Raccourcis de calques
        this.addShortcut('F7', () => this.app.layerManager.showLayerPanel(), 'Panneau calques');
        this.addShortcut('Ctrl+Shift+N', () => this.app.layerManager.addLayer(), 'Nouveau calque');

        // Raccourcis de propriétés
        this.addShortcut('F4', () => this.showPropertiesPanel(), 'Panneau propriétés');
        this.addShortcut('Ctrl+Shift+O', () => this.toggleObjectOutlines(), 'Contours objets');
    }

    /**
     * Ajoute un raccourci
     * @param {string} key - Combinaison de touches
     * @param {Function} action - Action à exécuter
     * @param {string} description - Description du raccourci
     */
    addShortcut(key, action, description) {
        const normalizedKey = this.normalizeKey(key);
        this.shortcuts.set(normalizedKey, {
            action,
            description,
            key: normalizedKey
        });
    }

    /**
     * Supprime un raccourci
     * @param {string} key - Combinaison de touches
     */
    removeShortcut(key) {
        const normalizedKey = this.normalizeKey(key);
        this.shortcuts.delete(normalizedKey);
    }

    /**
     * Normalise une combinaison de touches
     * @param {string} key - Combinaison de touches
     * @returns {string} Combinaison normalisée
     */
    normalizeKey(key) {
        return key
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace('command', 'ctrl') // macOS
            .replace('cmd', 'ctrl')
            .split('+')
            .sort((a, b) => {
                const order = ['ctrl', 'alt', 'shift', 'meta'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.localeCompare(b);
            })
            .join('+');
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // Empêcher les raccourcis par défaut du navigateur
        document.addEventListener('keydown', (e) => {
            if (this.shouldPreventDefault(e)) {
                e.preventDefault();
            }
        });
    }

    /**
     * Gestion des événements keydown
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyDown(e) {
        // Ignorer si on est dans un champ de saisie
        if (this.isInInputField(e.target)) return;

        const key = this.getKeyFromEvent(e);
        const shortcut = this.shortcuts.get(key);

        if (shortcut) {
            e.preventDefault();
            try {
                shortcut.action();
                this.showShortcutFeedback(shortcut.description);
            } catch (error) {
                console.error('Erreur lors de l\'exécution du raccourci:', error);
            }
        }
    }

    /**
     * Gestion des événements keyup
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyUp(e) {
        // Gérer les raccourcis qui nécessitent un keyup (comme Space pour l'outil main)
        if (e.code === 'Space' && this.tempHandToolActive) {
            this.deactivateHandTool();
        }
    }

    /**
     * Extrait la combinaison de touches d'un événement
     * @param {KeyboardEvent} e - Événement clavier
     * @returns {string} Combinaison de touches
     */
    getKeyFromEvent(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        let key = e.key.toLowerCase();
        
        // Gestion des touches spéciales
        const specialKeys = {
            ' ': 'space',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right',
            'escape': 'escape',
            'enter': 'enter',
            'backspace': 'backspace',
            'delete': 'delete',
            'tab': 'tab'
        };
        
        if (specialKeys[key]) {
            key = specialKeys[key];
        }
        
        // Eviter les doublons pour les touches de modification
        if (!['ctrl', 'alt', 'shift', 'meta'].includes(key)) {
            parts.push(key);
        }
        
        return parts.join('+');
    }

    /**
     * Vérifie si l'élément cible est un champ de saisie
     * @param {Element} target - Élément cible
     * @returns {boolean} Vrai si c'est un champ de saisie
     */
    isInInputField(target) {
        const inputTags = ['input', 'textarea', 'select'];
        return inputTags.includes(target.tagName.toLowerCase()) ||
               target.contentEditable === 'true';
    }

    /**
     * Détermine si l'événement par défaut doit être empêché
     * @param {KeyboardEvent} e - Événement clavier
     * @returns {boolean} Vrai si l'événement doit être empêché
     */
    shouldPreventDefault(e) {
        const key = this.getKeyFromEvent(e);
        return this.shortcuts.has(key) && !this.isInInputField(e.target);
    }

    /**
     * Affiche un feedback pour le raccourci exécuté
     * @param {string} description - Description du raccourci
     */
    showShortcutFeedback(description) {
        // Créer un indicateur visuel temporaire
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.textContent = description;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Animation d'apparition
        setTimeout(() => {
            feedback.style.opacity = '1';
        }, 10);
        
        // Suppression automatique
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 1500);
    }

    /**
     * Actions spécifiques pour les raccourcis
     */

    cutSelectedObject() {
        this.app.copySelectedObject();
        this.app.deleteSelectedObject();
    }

    selectAllObjects() {
        const objects = this.app.canvas.getObjects().filter(obj => 
            !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator && obj.selectable
        );
        
        if (objects.length > 0) {
            const selection = new fabric.ActiveSelection(objects, {
                canvas: this.app.canvas
            });
            this.app.canvas.setActiveObject(selection);
            this.app.canvas.renderAll();
        }
    }

    bringForward() {
        const activeObject = this.app.canvas.getActiveObject();
        if (activeObject) {
            this.app.canvas.bringForward(activeObject);
            this.app.canvas.renderAll();
            this.app.historyManager.saveState();
        }
    }

    sendBackward() {
        const activeObject = this.app.canvas.getActiveObject();
        if (activeObject) {
            this.app.canvas.sendBackwards(activeObject);
            this.app.canvas.renderAll();
            this.app.historyManager.saveState();
        }
    }

    toggleGrid() {
        const gridToggle = document.getElementById('gridToggle');
        if (gridToggle) {
            gridToggle.checked = !gridToggle.checked;
            this.app.canvasManager.toggleGrid();
        }
    }

    toggleSnap() {
        const snapToggle = document.getElementById('snapToggle');
        if (snapToggle) {
            snapToggle.checked = !snapToggle.checked;
            this.app.toolsManager.toggleSnap();
        }
    }

    activateHandTool() {
        this.previousTool = this.app.toolsManager.currentTool;
        this.tempHandToolActive = true;
        this.app.selectTool('hand');
    }

    deactivateHandTool() {
        if (this.tempHandToolActive && this.previousTool) {
            this.app.selectTool(this.previousTool);
            this.tempHandToolActive = false;
        }
    }

    cancelCurrentAction() {
        this.app.canvas.discardActiveObject();
        this.app.toolsManager.removePreview();
        this.app.toolsManager.hideEraserIndicator();
        this.app.canvas.renderAll();
    }

    confirmCurrentAction() {
        // Logique pour confirmer l'action en cours
        // Par exemple, terminer un tracé de polygone
    }

    showPropertiesPanel() {
        // Afficher un panneau de propriétés détaillé
        const activeObject = this.app.canvas.getActiveObject();
        if (activeObject) {
            this.app.showObjectProperties();
        }
    }

    toggleObjectOutlines() {
        // Basculer l'affichage des contours d'objets
        const objects = this.app.canvas.getObjects();
        objects.forEach(obj => {
            if (!obj.isGrid && !obj.isPreview) {
                obj.hasBorders = !obj.hasBorders;
                obj.hasControls = !obj.hasControls;
            }
        });
        this.app.canvas.renderAll();
    }

    showSaveAsDialog() {
        const newName = prompt('Nom du projet:', 
            document.getElementById('projectName')?.value || 'Mon_Plan');
        if (newName) {
            document.getElementById('projectName').value = newName;
            this.app.saveProject();
        }
    }

    /**
     * Gestion des raccourcis personnalisés
     */

    saveCustomShortcuts() {
        try {
            if (typeof localStorage !== 'undefined') {
                const customData = Array.from(this.customShortcuts.entries());
                localStorage.setItem('archidesign_shortcuts', JSON.stringify(customData));
            }
        } catch (error) {
            console.warn('Impossible de sauvegarder les raccourcis personnalisés:', error);
        }
    }

    loadCustomShortcuts() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('archidesign_shortcuts');
                if (saved) {
                    const customData = JSON.parse(saved);
                    this.customShortcuts = new Map(customData);
                    
                    // Appliquer les raccourcis personnalisés
                    this.customShortcuts.forEach((shortcut, key) => {
                        this.addShortcut(key, shortcut.action, shortcut.description);
                    });
                }
            }
        } catch (error) {
            console.warn('Impossible de charger les raccourcis personnalisés:', error);
        }
    }

    /**
     * Obtient la liste de tous les raccourcis
     * @returns {Array} Liste des raccourcis
     */
    getAllShortcuts() {
        return Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
            key,
            description: shortcut.description
        }));
    }

    /**
     * Recherche un raccourci par description
     * @param {string} query - Terme de recherche
     * @returns {Array} Raccourcis correspondants
     */
    searchShortcuts(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.getAllShortcuts().filter(shortcut =>
            shortcut.description.toLowerCase().includes(lowercaseQuery) ||
            shortcut.key.toLowerCase().includes(lowercaseQuery)
        );
    }

    /**
     * Affiche l'aide des raccourcis
     */
    showShortcutHelp() {
        const shortcuts = this.getAllShortcuts();
        const helpContent = shortcuts
            .sort((a, b) => a.description.localeCompare(b.description))
            .map(s => `${s.key.toUpperCase()} - ${s.description}`)
            .join('\n');
        
        alert('Raccourcis clavier disponibles:\n\n' + helpContent);
    }
}