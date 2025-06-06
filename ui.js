/**
 * Module de gestion de l'interface utilisateur
 */

class UIManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        const elements = {
            strokeColor: document.getElementById('strokeColor'),
            fillColor: document.getElementById('fillColor'),
            strokeWidth: document.getElementById('strokeWidth'),
            opacity: document.getElementById('opacity'),
            gridToggle: document.getElementById('gridToggle'),
            snapToggle: document.getElementById('snapToggle'),
            autoSelectToggle: document.getElementById('autoSelectToggle'),
            zoomSlider: document.getElementById('zoomSlider'),
            undoBtn: document.getElementById('undoBtn'),
            redoBtn: document.getElementById('redoBtn'),
            clearBtn: document.getElementById('clearBtn'),
            saveBtn: document.getElementById('saveBtn'),
            loadBtn: document.getElementById('loadBtn'),
            exportBtn: document.getElementById('exportBtn')
        };

        // Outils
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => this.app.toolsManager.selectTool(btn.dataset.tool));
        });

        // Propriétés
        if (elements.strokeColor) elements.strokeColor.addEventListener('change', this.updateProperties.bind(this));
        if (elements.fillColor) elements.fillColor.addEventListener('change', this.updateProperties.bind(this));
        if (elements.strokeWidth) elements.strokeWidth.addEventListener('input', this.updateStrokeWidth.bind(this));
        if (elements.opacity) elements.opacity.addEventListener('input', this.updateOpacity.bind(this));

        // Paramètres
        if (elements.gridToggle) elements.gridToggle.addEventListener('change', this.app.canvasManager.toggleGrid.bind(this.app.canvasManager));
        if (elements.snapToggle) elements.snapToggle.addEventListener('change', this.app.toolsManager.toggleSnap.bind(this.app.toolsManager));
        if (elements.autoSelectToggle) elements.autoSelectToggle.addEventListener('change', this.app.toolsManager.toggleAutoSelect.bind(this.app.toolsManager));
        if (elements.zoomSlider) elements.zoomSlider.addEventListener('input', this.app.canvasManager.updateZoom.bind(this.app.canvasManager));

        // Actions
        if (elements.undoBtn) elements.undoBtn.addEventListener('click', this.app.historyManager.undo.bind(this.app.historyManager));
        if (elements.redoBtn) elements.redoBtn.addEventListener('click', this.app.historyManager.redo.bind(this.app.historyManager));
        if (elements.clearBtn) elements.clearBtn.addEventListener('click', this.app.canvasManager.clearCanvas.bind(this.app.canvasManager));
        if (elements.saveBtn) elements.saveBtn.addEventListener('click', this.app.historyManager.saveProject.bind(this.app.historyManager));
        if (elements.loadBtn) elements.loadBtn.addEventListener('click', this.app.historyManager.loadProject.bind(this.app.historyManager));
        if (elements.exportBtn) elements.exportBtn.addEventListener('click', this.app.canvasManager.exportImage.bind(this.app.canvasManager));

        // Raccourcis clavier
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Mise à jour des propriétés de l'objet sélectionné
     */
    updateProperties() {
        const activeObject = this.app.canvas.getActiveObject();
        if (!activeObject) return;

        try {
            const properties = getCurrentProperties();

            if (activeObject.type === 'line' || activeObject.type === 'wall') {
                activeObject.set({ 
                    stroke: properties.strokeColor, 
                    strokeWidth: properties.strokeWidth, 
                    opacity: properties.opacity 
                });
            } else if (activeObject.type === 'text') {
                activeObject.set({ 
                    fill: properties.strokeColor, 
                    opacity: properties.opacity,
                    fontFamily: 'Arial, sans-serif'
                });
            } else {
                const updateProps = { opacity: properties.opacity };
                
                if (activeObject.fill !== undefined) {
                    updateProps.fill = properties.fillColor;
                }
                if (activeObject.stroke !== undefined) {
                    updateProps.stroke = properties.strokeColor;
                    updateProps.strokeWidth = properties.strokeWidth;
                }
                
                activeObject.set(updateProps);
            }

            this.app.canvas.renderAll();
            this.app.historyManager.saveState();
        } catch (error) {
            console.error('Erreur lors de la mise à jour des propriétés:', error);
        }
    }

    /**
     * Mise à jour de l'épaisseur du contour
     */
    updateStrokeWidth() {
        const strokeWidthInput = document.getElementById('strokeWidth');
        
        if (!strokeWidthInput) return;
        
        const value = strokeWidthInput.value;
        updateDisplayValue('strokeValue', value);
        this.updateProperties();
    }

    /**
     * Mise à jour de l'opacité
     */
    updateOpacity() {
        const opacityInput = document.getElementById('opacity');
        
        if (!opacityInput) return;
        
        const value = opacityInput.value;
        updateDisplayValue('opacityValue', Math.round(value * 100) + '%');
        this.updateProperties();
    }

    /**
     * Gestion de la sélection d'un objet
     * @param {Object} e - Événement Fabric.js
     */
    handleSelection(e) {
        const obj = e.selected[0];
        if (obj) {
            updateDisplayValue('selection', `Sélectionné: ${obj.type || 'objet'}`);
            this.updatePropertiesFromObject(obj);
        }
    }

    /**
     * Gestion de la désélection
     */
    handleSelectionClear() {
        updateDisplayValue('selection', 'Aucune sélection');
    }

    /**
     * Mise à jour des champs de propriétés à partir d'un objet
     * @param {Object} obj - Objet Fabric.js
     */
    updatePropertiesFromObject(obj) {
        if (!obj) return;

        try {
            if (obj.stroke && obj.stroke !== 'transparent') {
                const hexStroke = rgbToHex(obj.stroke);
                const strokeColorInput = document.getElementById('strokeColor');
                if (strokeColorInput) strokeColorInput.value = hexStroke;
            }
            
            if (obj.fill && obj.fill !== 'transparent') {
                const hexFill = rgbToHex(obj.fill);
                const fillColorInput = document.getElementById('fillColor');
                if (fillColorInput) fillColorInput.value = hexFill;
            }
            
            if (obj.strokeWidth !== undefined) {
                const strokeWidth = Math.max(1, Math.min(10, obj.strokeWidth));
                const strokeWidthInput = document.getElementById('strokeWidth');
                if (strokeWidthInput) strokeWidthInput.value = strokeWidth;
                updateDisplayValue('strokeValue', strokeWidth);
            }
            
            if (obj.opacity !== undefined) {
                const opacity = Math.max(0.1, Math.min(1, obj.opacity));
                const opacityInput = document.getElementById('opacity');
                if (opacityInput) opacityInput.value = opacity;
                updateDisplayValue('opacityValue', Math.round(opacity * 100) + '%');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des propriétés:', error);
        }
    }

    /**
     * Mise à jour de l'interface utilisateur
     */
    updateUI() {
        this.app.canvasManager.updateObjectCount();
        
        updateDisplayValue('zoomValue', '100%');
        updateDisplayValue('strokeValue', '2');
        updateDisplayValue('opacityValue', '100%');
    }

    /**
     * Gestion des raccourcis clavier
     * @param {Object} e - Événement clavier
     */
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT') return;

        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.app.historyManager.redo();
                    } else {
                        this.app.historyManager.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.app.historyManager.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.app.historyManager.saveProject();
                    break;
            }
        } else {
            switch(e.key) {
                case 'Delete':
                case 'Backspace':
                    const activeObject = this.app.canvas.getActiveObject();
                    if (activeObject && !activeObject.isGrid && !activeObject.isPreview && !activeObject.isEraserIndicator) {
                        this.app.canvas.remove(activeObject);
                        this.app.historyManager.saveState();
                        this.app.canvasManager.updateObjectCount();
                    }
                    break;
                case 'Escape':
                    this.app.canvas.discardActiveObject();
                    this.app.canvas.renderAll();
                    break;
                case '1':
                    this.app.toolsManager.selectTool('select');
                    break;
                case '2':
                    this.app.toolsManager.selectTool('wall');
                    break;
                case '3':
                    this.app.toolsManager.selectTool('door');
                    break;
                case '4':
                    this.app.toolsManager.selectTool('window');
                    break;
                case '5':
                    this.app.toolsManager.selectTool('rectangle');
                    break;
                case '6':
                    this.app.toolsManager.selectTool('circle');
                    break;
                case 'e':
                case 'E':
                    this.app.toolsManager.selectTool('eraser');
                    break;
                case 't':
                case 'T':
                    this.app.toolsManager.selectTool('text');
                    break;
            }
        }
    }

    /**
     * Affiche un message de statut temporaire
     * @param {string} message - Message à afficher
     * @param {number} duration - Durée en ms
     */
    showStatusMessage(message, duration = 3000) {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            const originalText = saveStatus.textContent;
            saveStatus.textContent = message;
            saveStatus.style.background = 'rgba(76, 175, 80, 0.2)';
            
            setTimeout(() => {
                saveStatus.textContent = originalText;
                saveStatus.style.background = '';
            }, duration);
        }
    }

    /**
     * Affiche un message d'erreur temporaire
     * @param {string} message - Message d'erreur
     * @param {number} duration - Durée en ms
     */
    showErrorMessage(message, duration = 5000) {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            const originalText = saveStatus.textContent;
            saveStatus.textContent = `❌ ${message}`;
            saveStatus.style.background = 'rgba(244, 67, 54, 0.2)';
            
            setTimeout(() => {
                saveStatus.textContent = originalText;
                saveStatus.style.background = '';
            }, duration);
        }
    }

    /**
     * Met à jour l'indicateur de sauvegarde
     * @param {string} status - Statut ('saved', 'modified', 'saving', 'error')
     */
    updateSaveStatus(status) {
        const saveStatus = document.getElementById('saveStatus');
        if (!saveStatus) return;

        const statusMap = {
            'saved': '💾 Sauvegardé',
            'modified': '💾 Modifié',
            'saving': '💾 Sauvegarde...',
            'error': '❌ Erreur',
            'ready': '💾 Prêt'
        };

        saveStatus.textContent = statusMap[status] || status;
    }

    /**
     * Ajoute des tooltips aux boutons
     */
    setupTooltips() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            const tool = btn.dataset.tool;
            const tooltips = {
                'select': 'Sélection (1)',
                'wall': 'Mur (2)',
                'door': 'Porte (3)',
                'window': 'Fenêtre (4)',
                'rectangle': 'Rectangle (5)',
                'circle': 'Cercle (6)',
                'eraser': 'Gomme (E)',
                'text': 'Texte (T)'
            };
            
            if (tooltips[tool]) {
                btn.setAttribute('title', tooltips[tool]);
                btn.setAttribute('data-tooltip', tooltips[tool]);
                btn.classList.add('tooltip');
            }
        });
    }

    /**
     * Configure les animations d'interface
     */
    setupAnimations() {
        // Animation au survol des boutons d'outils
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.classList.add('pulse');
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('pulse');
            });
        });

        // Animation des sections d'outils
        document.querySelectorAll('.tool-section').forEach((section, index) => {
            section.style.animationDelay = `${index * 0.1}s`;
            section.classList.add('slide-in');
        });
    }

    /**
     * Gère le mode responsive
     */
    setupResponsive() {
        const checkMobile = () => {
            const isMobile = window.innerWidth <= 768;
            document.body.classList.toggle('mobile-layout', isMobile);
            
            if (isMobile) {
                // Ajustements pour mobile
                const canvas = document.getElementById('canvas');
                if (canvas) {
                    canvas.style.maxWidth = '100%';
                    canvas.style.height = 'auto';
                }
            }
        };

        checkMobile();
        window.addEventListener('resize', debounce(checkMobile, 250));
    }
}