/**
 * Application ArchiDesign pour la création de plans architecturaux
 * Classe principale qui orchestre tous les modules
 */
class SimpleArchitectApp {
    constructor() {
        this.canvas = null;
        this.clipboard = null;
        this.scale = 100; // Échelle 1:100 par défaut
        this.isFullscreen = false;
        
        // Initialisation des managers
        this.canvasManager = new CanvasManager(this);
        this.toolsManager = new ToolsManager(this);
        this.uiManager = new UIManager(this);
        this.historyManager = new HistoryManager(this);
        this.layerManager = new LayerManager(this);
        this.shortcutManager = new ShortcutManager(this);
        
        this.init();
    }

    /**
     * Initialisation de l'application
     */
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.canvasManager.drawGrid();
        this.historyManager.saveState();
        this.uiManager.updateUI();
        this.uiManager.setupTooltips();
        this.uiManager.setupAnimations();
        this.uiManager.setupResponsive();
        this.layerManager.init();
        this.shortcutManager.init();
        
        // Sélectionner l'outil par défaut
        this.toolsManager.selectTool('select');
        
        // Configuration avancée
        this.setupAdvancedFeatures();
        
        // Tentative de récupération automatique
        this.historyManager.loadAutoSave();
        
        console.log('🏛️ ArchiDesign Pro initialisé avec succès!');
    }

    /**
     * Configuration des fonctionnalités avancées
     */
    setupAdvancedFeatures() {
        // Menu contextuel
        this.setupContextMenu();
        
        // Gestion plein écran
        this.setupFullscreen();
        
        // Zoom avancé
        this.setupAdvancedZoom();
        
        // Règles et guides
        this.setupRulers();
        
        // Auto-sauvegarde
        this.historyManager.enableAutoSave();
    }

    /**
     * Configuration du menu contextuel
     */
    setupContextMenu() {
        this.canvas.on('mouse:down', (e) => {
            if (e.e.button === 2) { // Clic droit
                e.e.preventDefault();
                this.showContextMenu(e.e.clientX, e.e.clientY);
            } else {
                this.hideContextMenu();
            }
        });

        // Empêcher le menu contextuel par défaut
        document.getElementById('canvas').addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Actions du menu contextuel
        document.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleContextAction(e.target.dataset.action);
                this.hideContextMenu();
            });
        });
    }

    /**
     * Affiche le menu contextuel
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    showContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        const activeObject = this.canvas.getActiveObject();
        
        // Activer/désactiver les options selon le contexte
        this.updateContextMenuItems(activeObject);
        
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }

    /**
     * Cache le menu contextuel
     */
    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }

    /**
     * Met à jour les éléments du menu contextuel
     * @param {fabric.Object} activeObject - Objet actif
     */
    updateContextMenuItems(activeObject) {
        const items = document.querySelectorAll('.context-item');
        items.forEach(item => {
            const action = item.dataset.action;
            let enabled = true;
            
            switch(action) {
                case 'copy':
                case 'duplicate':
                case 'delete':
                case 'properties':
                    enabled = !!activeObject;
                    break;
                case 'paste':
                    enabled = !!this.clipboard;
                    break;
                case 'group':
                    enabled = activeObject && activeObject.type === 'activeSelection';
                    break;
                case 'ungroup':
                    enabled = activeObject && activeObject.type === 'group';
                    break;
            }
            
            item.style.opacity = enabled ? '1' : '0.5';
            item.style.pointerEvents = enabled ? 'auto' : 'none';
        });
    }

    /**
     * Gère les actions du menu contextuel
     * @param {string} action - Action à exécuter
     */
    handleContextAction(action) {
        switch(action) {
            case 'copy':
                this.copySelectedObject();
                break;
            case 'paste':
                this.pasteObject();
                break;
            case 'duplicate':
                this.duplicateSelectedObject();
                break;
            case 'bring-front':
                this.bringToFront();
                break;
            case 'send-back':
                this.sendToBack();
                break;
            case 'group':
                this.groupSelectedObjects();
                break;
            case 'ungroup':
                this.ungroupSelectedObject();
                break;
            case 'properties':
                this.showObjectProperties();
                break;
            case 'delete':
                this.deleteSelectedObject();
                break;
        }
    }

    /**
     * Configuration du mode plein écran
     */
    setupFullscreen() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // Écouter les changements de plein écran
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenUI();
        });
    }

    /**
     * Bascule le mode plein écran
     */
    toggleFullscreen() {
        if (!this.isFullscreen) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Met à jour l'interface en mode plein écran
     */
    updateFullscreenUI() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = this.isFullscreen ? '🔍 Quitter' : '🔍 Plein écran';
        }
        
        document.body.classList.toggle('fullscreen-mode', this.isFullscreen);
    }

    /**
     * Configuration du zoom avancé
     */
    setupAdvancedZoom() {
        // Boutons de zoom
        document.getElementById('zoomInBtn')?.addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
            this.zoomOut();
        });
        
        document.getElementById('zoomFitBtn')?.addEventListener('click', () => {
            this.zoomToFit();
        });
        
        document.getElementById('zoom100Btn')?.addEventListener('click', () => {
            this.zoomTo100();
        });

        // Zoom avec la molette
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** delta;
            
            if (zoom > 5) zoom = 5;
            if (zoom < 0.1) zoom = 0.1;
            
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            this.updateZoomDisplay();
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
    }

    /**
     * Zoom avant
     */
    zoomIn() {
        const zoom = Math.min(this.canvas.getZoom() * 1.2, 5);
        this.canvas.setZoom(zoom);
        this.updateZoomDisplay();
        this.canvasManager.drawGrid();
    }

    /**
     * Zoom arrière
     */
    zoomOut() {
        const zoom = Math.max(this.canvas.getZoom() / 1.2, 0.1);
        this.canvas.setZoom(zoom);
        this.updateZoomDisplay();
        this.canvasManager.drawGrid();
    }

    /**
     * Ajuster le zoom pour voir tous les objets
     */
    zoomToFit() {
        const objects = filterCanvasObjects(this.canvas.getObjects());
        if (objects.length === 0) return;

        const group = new fabric.Group(objects, { canvas: this.canvas });
        const bounds = group.getBoundingRect();
        group.destroy();

        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        
        const zoomX = canvasWidth / (bounds.width + 100);
        const zoomY = canvasHeight / (bounds.height + 100);
        const zoom = Math.min(zoomX, zoomY, 5);

        this.canvas.setZoom(zoom);
        this.canvas.absolutePan({
            x: (canvasWidth - bounds.width * zoom) / 2 - bounds.left * zoom,
            y: (canvasHeight - bounds.height * zoom) / 2 - bounds.top * zoom
        });

        this.updateZoomDisplay();
        this.canvasManager.drawGrid();
    }

    /**
     * Zoom à 100%
     */
    zoomTo100() {
        this.canvas.setZoom(1);
        this.canvas.absolutePan({ x: 0, y: 0 });
        this.updateZoomDisplay();
        this.canvasManager.drawGrid();
    }

    /**
     * Met à jour l'affichage du zoom
     */
    updateZoomDisplay() {
        const zoom = this.canvas.getZoom();
        updateDisplayValue('zoomValue', Math.round(zoom * 100) + '%');
        updateDisplayValue('zoomInfo', `Zoom: ${Math.round(zoom * 100)}%`);
        
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) {
            zoomSlider.value = zoom;
        }
    }

    /**
     * Configuration des règles
     */
    setupRulers() {
        const rulerBtn = document.getElementById('rulerBtn');
        if (rulerBtn) {
            rulerBtn.addEventListener('click', () => {
                this.toggleRulers();
            });
        }
    }

    /**
     * Bascule l'affichage des règles
     */
    toggleRulers() {
        const rulers = document.getElementById('rulers');
        const isVisible = rulers.style.display !== 'none';
        rulers.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.drawRulers();
        }
    }

    /**
     * Dessine les règles
     */
    drawRulers() {
        const zoom = this.canvas.getZoom();
        const vpt = this.canvas.viewportTransform;
        
        // Implémenter le dessin des règles ici
        // Cette fonction serait plus complexe dans une vraie implémentation
    }

    /**
     * Configuration du canvas Fabric.js
     */
    setupCanvas() {
        this.canvasManager.setupCanvas();
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        this.uiManager.setupEventListeners();
    }

    /**
     * Délégation des événements mouse vers ToolsManager
     */
    handleMouseDown(e) {
        this.toolsManager.handleMouseDown(e);
    }

    handleMouseMove(e) {
        this.toolsManager.handleMouseMove(e);
    }

    handleMouseUp(e) {
        this.toolsManager.handleMouseUp(e);
    }

    /**
     * Gestion de la sélection d'un objet
     * @param {Object} e - Événement Fabric.js
     */
    handleSelection(e) {
        this.uiManager.handleSelection(e);
    }

    /**
     * Gestion de la désélection
     */
    handleSelectionClear() {
        this.uiManager.handleSelectionClear();
    }

    /**
     * Délégation de la mise à jour du compteur d'objets
     */
    updateObjectCount() {
        this.canvasManager.updateObjectCount();
    }

    /**
     * Méthodes publiques pour l'API
     */
    
    /**
     * Sélectionne un outil
     * @param {string} tool - Nom de l'outil
     */
    selectTool(tool) {
        this.toolsManager.selectTool(tool);
    }

    /**
     * Sauvegarde le projet
     */
    saveProject() {
        this.historyManager.saveProject();
    }

    /**
     * Charge un projet
     */
    loadProject() {
        this.historyManager.loadProject();
    }

    /**
     * Exporte l'image
     */
    exportImage() {
        this.canvasManager.exportImage();
    }

    /**
     * Annule la dernière action
     */
    undo() {
        this.historyManager.undo();
    }

    /**
     * Refait la dernière action annulée
     */
    redo() {
        this.historyManager.redo();
    }

    /**
     * Efface le canvas
     */
    clearCanvas() {
        this.canvasManager.clearCanvas();
    }

    /**
     * Met à jour le zoom
     * @param {number} zoomLevel - Niveau de zoom
     */
    setZoom(zoomLevel) {
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) {
            zoomSlider.value = zoomLevel;
            this.canvasManager.updateZoom();
        }
    }

    /**
     * Active/désactive la grille
     * @param {boolean} enabled - État de la grille
     */
    toggleGrid(enabled) {
        const gridToggle = document.getElementById('gridToggle');
        if (gridToggle) {
            gridToggle.checked = enabled;
            this.canvasManager.toggleGrid();
        }
    }

    /**
     * Active/désactive l'accrochage
     * @param {boolean} enabled - État de l'accrochage
     */
    toggleSnap(enabled) {
        const snapToggle = document.getElementById('snapToggle');
        if (snapToggle) {
            snapToggle.checked = enabled;
            this.toolsManager.toggleSnap();
        }
    }

    /**
     * Obtient l'objet actuellement sélectionné
     * @returns {fabric.Object|null} Objet sélectionné
     */
    getSelectedObject() {
        return this.canvas.getActiveObject();
    }

    /**
     * Sélectionne un objet par son ID
     * @param {string} objectId - ID de l'objet
     */
    selectObjectById(objectId) {
        const objects = this.canvas.getObjects();
        const targetObject = objects.find(obj => obj.id === objectId);
        if (targetObject) {
            this.canvas.setActiveObject(targetObject);
            this.canvas.renderAll();
        }
    }

    /**
     * Supprime l'objet sélectionné
     */
    deleteSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && !activeObject.isGrid && !activeObject.isPreview && !activeObject.isEraserIndicator) {
            this.canvas.remove(activeObject);
            this.historyManager.saveState();
            this.updateObjectCount();
        }
    }

    /**
     * Copie l'objet sélectionné
     */
    copySelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((cloned) => {
                this.clipboard = cloned;
                this.uiManager.showStatusMessage('Objet copié');
            });
        }
    }

    /**
     * Colle l'objet du presse-papiers
     */
    pasteObject() {
        if (this.clipboard) {
            this.clipboard.clone((cloned) => {
                cloned.set({
                    left: cloned.left + 20,
                    top: cloned.top + 20,
                    evented: true,
                });
                if (cloned.type === 'activeSelection') {
                    cloned.canvas = this.canvas;
                    cloned.forEachObject((obj) => {
                        this.canvas.add(obj);
                    });
                    cloned.setCoords();
                } else {
                    this.canvas.add(cloned);
                }
                this.canvas.setActiveObject(cloned);
                this.canvas.renderAll();
                this.historyManager.saveState();
                this.uiManager.showStatusMessage('Objet collé');
            });
        }
    }

    /**
     * Amène l'objet au premier plan
     */
    bringToFront() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.bringToFront(activeObject);
            this.canvas.renderAll();
            this.historyManager.saveState();
        }
    }

    /**
     * Envoie l'objet à l'arrière-plan
     */
    sendToBack() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.sendToBack(activeObject);
            this.canvas.renderAll();
            this.historyManager.saveState();
        }
    }

    /**
     * Affiche les propriétés de l'objet
     */
    showObjectProperties() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            // Implémenter un panneau de propriétés détaillé
            const props = {
                type: activeObject.type,
                left: Math.round(activeObject.left),
                top: Math.round(activeObject.top),
                width: Math.round(activeObject.width || 0),
                height: Math.round(activeObject.height || 0),
                angle: Math.round(activeObject.angle || 0),
                opacity: activeObject.opacity
            };
            
            console.log('Propriétés de l\'objet:', props);
            alert(`Propriétés:\nType: ${props.type}\nPosition: ${props.left}, ${props.top}\nTaille: ${props.width} × ${props.height}\nAngle: ${props.angle}°\nOpacité: ${Math.round(props.opacity * 100)}%`);
        }
    }

    /**
     * Imprime le canvas
     */
    printCanvas() {
        window.print();
    }

    /**
     * Définit l'échelle du plan
     * @param {number} scale - Échelle (ex: 100 pour 1:100)
     */
    setScale(scale) {
        this.scale = scale;
        updateDisplayValue('scaleInfo', `Échelle: 1:${scale}`);
        updateDisplayValue('canvasScale', `Échelle: 1:${scale}`);
    }

    /**
     * Convertit les pixels en unités réelles
     * @param {number} pixels - Valeur en pixels
     * @returns {number} Valeur en centimètres
     */
    pixelsToReal(pixels) {
        // Supposons 1 pixel = 1mm à l'échelle 1:1
        return (pixels * this.scale) / 10; // Conversion en cm
    }

    /**
     * Convertit les unités réelles en pixels
     * @param {number} cm - Valeur en centimètres
     * @returns {number} Valeur en pixels
     */
    realToPixels(cm) {
        return (cm * 10) / this.scale;
    }

    /**
     * Mesure la distance entre deux points
     * @param {Object} point1 - Premier point {x, y}
     * @param {Object} point2 - Deuxième point {x, y}
     * @returns {Object} Distance en pixels et en unités réelles
     */
    measureDistance(point1, point2) {
        const pixelDistance = calculateDistance(point1.x, point1.y, point2.x, point2.y);
        const realDistance = this.pixelsToReal(pixelDistance);
        
        return {
            pixels: pixelDistance,
            cm: realDistance,
            m: realDistance / 100
        };
    }

    /**
     * Ajoute une cotation entre deux points
     * @param {Object} point1 - Premier point
     * @param {Object} point2 - Deuxième point
     */
    addDimension(point1, point2) {
        const distance = this.measureDistance(point1, point2);
        const midX = (point1.x + point2.x) / 2;
        const midY = (point1.y + point2.y) / 2;
        
        // Ligne de cotation
        const line = new fabric.Line([point1.x, point1.y, point2.x, point2.y], {
            stroke: '#666666',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            isDimension: true
        });
        
        // Texte de cotation
        const text = new fabric.Text(`${distance.cm.toFixed(1)} cm`, {
            left: midX,
            top: midY - 10,
            fontSize: 12,
            fill: '#666666',
            fontFamily: 'Arial',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            isDimension: true
        });
        
        this.canvas.add(line, text);
        this.canvas.renderAll();
        this.historyManager.saveState();
    }

    /**
     * Met à jour les informations de mémoire
     */
    updateMemoryInfo() {
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
            updateDisplayValue('memoryInfo', `Mémoire: ${used}MB`);
        }
    }

    /**
     * Met à jour les statistiques du projet
     */
    updateProjectStats() {
        const stats = this.getProjectStats();
        updateDisplayValue('objectCount', `Objets: ${stats.totalObjects}`);
        updateDisplayValue('historyCount', stats.historyStats.totalStates);
        
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            if (activeObject.type === 'activeSelection') {
                updateDisplayValue('selectionCount', activeObject.getObjects().length);
                updateDisplayValue('selectionInfo', `${activeObject.getObjects().length} objets sélectionnés`);
            } else {
                updateDisplayValue('selectionCount', 1);
                updateDisplayValue('selectionInfo', `${activeObject.type || 'objet'} sélectionné`);
            }
        } else {
            updateDisplayValue('selectionCount', 0);
            updateDisplayValue('selectionInfo', 'Aucune sélection');
        }
    }

    /**
     * Méthodes publiques pour l'API externe
     */
    
    /**
     * Exporte le projet au format JSON étendu
     * @returns {Object} Données complètes du projet
     */
    exportProjectDataExtended() {
        const baseData = this.exportProjectData();
        return {
            ...baseData,
            settings: {
                scale: this.scale,
                gridSize: this.canvasManager.gridSize,
                snapEnabled: this.toolsManager.snapEnabled,
                showGrid: document.getElementById('gridToggle')?.checked,
                showRulers: document.getElementById('rulers')?.style.display !== 'none'
            },
            layers: this.layerManager.exportLayers(),
            metadata: {
                ...baseData.metadata,
                version: '2.0.0',
                features: ['layers', 'advanced-tools', 'context-menu', 'shortcuts']
            }
        };
    }

    /**
     * Importe un projet avec toutes les données étendues
     * @param {Object} projectData - Données complètes du projet
     */
    importProjectDataExtended(projectData) {
        try {
            // Importer les données de base
            this.importProjectData(projectData);
            
            // Importer les paramètres
            if (projectData.settings) {
                this.setScale(projectData.settings.scale || 100);
                this.canvasManager.gridSize = projectData.settings.gridSize || 20;
                
                if (projectData.settings.showGrid !== undefined) {
                    this.toggleGrid(projectData.settings.showGrid);
                }
            }
            
            // Importer les calques
            if (projectData.layers) {
                this.layerManager.importLayers(projectData.layers);
            }
            
            this.uiManager.showStatusMessage('Projet importé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'import étendu:', error);
            this.uiManager.showErrorMessage('Erreur lors de l\'import du projet');
        }
    }

    /**
     * Groupe les objets sélectionnés
     */
    groupSelectedObjects() {
        const activeSelection = this.canvas.getActiveObject();
        if (activeSelection && activeSelection.type === 'activeSelection') {
            const group = activeSelection.toGroup();
            this.canvas.renderAll();
            this.historyManager.saveState();
        }
    }

    /**
     * Dégroupe l'objet sélectionné
     */
    ungroupSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.type === 'group') {
            activeObject.toActiveSelection();
            this.canvas.renderAll();
            this.historyManager.saveState();
        }
    }

    /**
     * Aligne les objets sélectionnés
     * @param {string} alignment - Type d'alignement ('left', 'center', 'right', 'top', 'middle', 'bottom')
     */
    alignSelectedObjects(alignment) {
        const activeSelection = this.canvas.getActiveObject();
        if (!activeSelection || activeSelection.type !== 'activeSelection') return;

        const objects = activeSelection.getObjects();
        if (objects.length < 2) return;

        const bounds = activeSelection.getBoundingRect();

        objects.forEach(obj => {
            switch(alignment) {
                case 'left':
                    obj.set('left', bounds.left);
                    break;
                case 'center':
                    obj.set('left', bounds.left + bounds.width / 2 - obj.width / 2);
                    break;
                case 'right':
                    obj.set('left', bounds.left + bounds.width - obj.width);
                    break;
                case 'top':
                    obj.set('top', bounds.top);
                    break;
                case 'middle':
                    obj.set('top', bounds.top + bounds.height / 2 - obj.height / 2);
                    break;
                case 'bottom':
                    obj.set('top', bounds.top + bounds.height - obj.height);
                    break;
            }
            obj.setCoords();
        });

        this.canvas.renderAll();
        this.historyManager.saveState();
    }

    /**
     * Obtient des statistiques sur le projet
     * @returns {Object} Statistiques
     */
    getProjectStats() {
        const objects = filterCanvasObjects(this.canvas.getObjects());
        const stats = {
            totalObjects: objects.length,
            objectTypes: {},
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            historyStats: this.historyManager.getHistoryStats(),
            currentTool: this.toolsManager.currentTool
        };

        // Compter les types d'objets
        objects.forEach(obj => {
            const type = obj.customType || obj.type || 'unknown';
            stats.objectTypes[type] = (stats.objectTypes[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Exporte les données du projet
     * @returns {Object} Données du projet
     */
    exportProjectData() {
        const cleanObjects = filterCanvasObjects(this.canvas.getObjects());
        const safeObjects = cleanObjects.map(obj => sanitizeObjectData(obj)).filter(obj => obj !== null);
        
        return {
            name: document.getElementById('projectName')?.value || 'Mon_Plan',
            canvas: {
                version: this.canvas.version,
                objects: safeObjects,
                background: this.canvas.backgroundColor,
                width: this.canvas.width,
                height: this.canvas.height
            },
            timestamp: new Date().toISOString(),
            stats: this.getProjectStats()
        };
    }

    /**
     * Importe des données de projet
     * @param {Object} projectData - Données à importer
     */
    importProjectData(projectData) {
        try {
            this.historyManager.processLoadedProject(JSON.stringify(projectData));
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            this.uiManager.showErrorMessage('Erreur lors de l\'import des données');
        }
    }

    /**
     * Gestion complète des événements de redimensionnement
     */
    handleResize() {
        // Débounce pour éviter trop d'appels
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.canvasManager.handleResize();
            this.updateProjectStats();
            this.updateMemoryInfo();
        }, 250);
    }

    /**
     * Mise à jour périodique des statistiques
     */
    startStatsUpdater() {
        // Mettre à jour les stats toutes les 5 secondes
        this.statsInterval = setInterval(() => {
            this.updateProjectStats();
            this.updateMemoryInfo();
        }, 5000);
    }

    /**
     * Nettoyage et destruction de l'application
     */
    destroy() {
        // Nettoyer les intervalles
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Nettoyer les événements
        document.removeEventListener('keydown', this.uiManager.handleKeyboard);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        
        // Nettoyer le canvas
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
        
        // Nettoyer les managers
        this.canvasManager = null;
        this.toolsManager = null;
        this.uiManager = null;
        this.historyManager = null;
        this.layerManager = null;
        this.shortcutManager = null;
        
        console.log('ArchiDesign Pro détruit');
    }

    /**
     * Gestion de la fermeture avec modifications non sauvegardées
     */
    beforeUnloadHandler(e) {
        const stats = this.historyManager.getHistoryStats();
        if (stats.totalStates > 1) { // Il y a des modifications
            e.preventDefault();
            e.returnValue = 'Modifications non sauvegardées !';
        }
    }

    /**
     * Méthodes d'aide et de diagnostic
     */

    /**
     * Obtient des informations de diagnostic complètes
     * @returns {Object} Informations de diagnostic
     */
    getDiagnosticInfo() {
        return {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            canvas: {
                width: this.canvas?.width || 0,
                height: this.canvas?.height || 0,
                zoom: this.canvas?.getZoom() || 1,
                objectCount: filterCanvasObjects(this.canvas?.getObjects() || []).length
            },
            tools: {
                currentTool: this.toolsManager?.currentTool || 'unknown',
                snapEnabled: this.toolsManager?.snapEnabled || false,
                autoSelectAfterDraw: this.toolsManager?.autoSelectAfterDraw || false
            },
            history: this.historyManager?.getHistoryStats() || {},
            layers: {
                count: this.layerManager?.layers?.length || 0,
                activeLayerId: this.layerManager?.activeLayerId || null
            },
            settings: {
                scale: this.scale,
                gridSize: this.canvasManager?.gridSize || 20,
                isFullscreen: this.isFullscreen
            },
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                } : null,
                timing: performance.timing ? {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                } : null
            }
        };
    }

    /**
     * Exporte les informations de diagnostic
     */
    exportDiagnostics() {
        const diagnostics = this.getDiagnosticInfo();
        const dataStr = JSON.stringify(diagnostics, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `archidesign_diagnostics_${Date.now()}.json`);
        link.click();
    }

    /**
     * Active/désactive le mode débogage
     * @param {boolean} enabled - État du mode débogage
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        
        if (enabled) {
            // Afficher des informations de débogage
            this.debugPanel = this.createDebugPanel();
            document.body.appendChild(this.debugPanel);
            
            // Logger les événements importants
            this.canvas.on('after:render', () => {
                if (this.debugMode) {
                    console.log('Canvas rendu:', this.canvas.getObjects().length, 'objets');
                }
            });
        } else if (this.debugPanel) {
            document.body.removeChild(this.debugPanel);
            this.debugPanel = null;
        }
    }

    /**
     * Crée un panneau de débogage
     * @returns {HTMLElement} Panneau de débogage
     */
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
        `;
        
        // Mettre à jour le contenu périodiquement
        const updateDebugInfo = () => {
            if (!this.debugMode) return;
            
            const stats = this.getProjectStats();
            panel.innerHTML = `
                <strong>Debug Info</strong><br>
                Objets: ${stats.totalObjects}<br>
                Zoom: ${Math.round(this.canvas.getZoom() * 100)}%<br>
                Outil: ${this.toolsManager.currentTool}<br>
                Historique: ${stats.historyStats.totalStates}<br>
                Calques: ${this.layerManager.layers.length}<br>
                Mémoire: ${performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'N/A'}
            `;
        };
        
        updateDebugInfo();
        setInterval(updateDebugInfo, 1000);
        
        return panel;
    }

    /**
     * Réinitialise l'application à l'état initial
     */
    reset() {
        if (confirm('Réinitialiser complètement l\'application ? Toutes les données seront perdues.')) {
            // Arrêter tous les intervalles
            if (this.statsInterval) {
                clearInterval(this.statsInterval);
            }
            
            // Nettoyer le canvas
            this.canvas.clear();
            this.canvas.backgroundColor = '#f8f9fa';
            
            // Réinitialiser les managers
            this.historyManager.clearHistory();
            this.layerManager.resetLayers();
            this.toolsManager.selectTool('select');
            
            // Réinitialiser les paramètres
            this.scale = 100;
            this.isFullscreen = false;
            this.clipboard = null;
            
            // Redessiner et sauvegarder l'état initial
            this.canvasManager.drawGrid();
            this.historyManager.saveState();
            this.updateProjectStats();
            
            // Redémarrer les statistiques
            this.startStatsUpdater();
            
            this.uiManager.showStatusMessage('Application réinitialisée');
        }
    }

    /**
     * Méthodes d'API publique pour l'intégration externe
     */

    /**
     * API publique pour les développeurs externes
     */
    getAPI() {
        return {
            // Méthodes de base
            selectTool: this.selectTool.bind(this),
            saveProject: this.saveProject.bind(this),
            loadProject: this.loadProject.bind(this),
            exportImage: this.exportImage.bind(this),
            clearCanvas: this.clearCanvas.bind(this),
            
            // Gestion des objets
            getSelectedObject: this.getSelectedObject.bind(this),
            selectObjectById: this.selectObjectById.bind(this),
            deleteSelectedObject: this.deleteSelectedObject.bind(this),
            duplicateSelectedObject: this.duplicateSelectedObject.bind(this),
            
            // Gestion de la vue
            setZoom: this.setZoom.bind(this),
            zoomIn: this.zoomIn.bind(this),
            zoomOut: this.zoomOut.bind(this),
            zoomToFit: this.zoomToFit.bind(this),
            
            // Gestion des calques
            addLayer: () => this.layerManager.addLayer(),
            setActiveLayer: (id) => this.layerManager.setActiveLayer(id),
            toggleLayerVisibility: (id) => this.layerManager.toggleLayerVisibility(id),
            
            // Informations et statistiques
            getProjectStats: this.getProjectStats.bind(this),
            getDiagnosticInfo: this.getDiagnosticInfo.bind(this),
            
            // Import/Export avancé
            exportProjectDataExtended: this.exportProjectDataExtended.bind(this),
            importProjectDataExtended: this.importProjectDataExtended.bind(this),
            
            // Événements personnalisés
            on: (event, callback) => this.canvas.on(event, callback),
            off: (event, callback) => this.canvas.off(event, callback),
            
            // Accès aux managers (lecture seule)
            get canvas() { return this.canvas; },
            get toolsManager() { return this.toolsManager; },
            get layerManager() { return this.layerManager; },
            get historyManager() { return this.historyManager; }
        };
    }
}

// Auto-initialisation lors du chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SimpleArchitectApp();
    
    // Exposer l'API publique
    window.ArchiDesignAPI = window.app.getAPI();
    
    // Démarrer les mises à jour périodiques
    window.app.startStatsUpdater();
    
    // Configuration de la gestion de fermeture
    window.app.beforeUnloadHandler = window.app.beforeUnloadHandler.bind(window.app);
    window.addEventListener('beforeunload', window.app.beforeUnloadHandler);
});

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    if (window.app) {
        window.app.handleResize();
    }
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
    console.error('Erreur ArchiDesign:', e.error);
    if (window.app && window.app.uiManager) {
        window.app.uiManager.showErrorMessage('Une erreur inattendue s\'est produite');
    }
});

// API globale pour la console de développement
window.ArchiDesign = {
    version: '2.0.0',
    debug: (enabled = true) => window.app?.setDebugMode(enabled),
    diagnostics: () => window.app?.exportDiagnostics(),
    reset: () => window.app?.reset(),
    stats: () => window.app?.getProjectStats(),
    shortcuts: () => window.app?.shortcutManager?.getAllShortcuts()
};