/**
 * Application ArchiDesign pour la création de plans architecturaux
 */
class SimpleArchitectApp {
    constructor() {
        this.canvas = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.gridSize = 20;
        this.snapEnabled = true;
        this.history = [];
        this.historyIndex = -1;
        this.autoSelectAfterDraw = true;
        this.creatingObject = false;

        this.init();
    }

    /**
     * Initialisation de l'application
     */
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.drawGrid();
        this.saveState();
        this.updateUI();
        
        console.log('🏛️ ArchiDesign initialisé avec succès!');
    }

    /**
     * Configuration du canvas Fabric.js
     */
    setupCanvas() {
        this.canvas = new fabric.Canvas('canvas', {
            backgroundColor: '#f8f9fa',
            selection: true
        });

        // Événements du canvas
        this.canvas.on('mouse:down', this.handleMouseDown.bind(this));
        this.canvas.on('mouse:move', this.handleMouseMove.bind(this));
        this.canvas.on('mouse:up', this.handleMouseUp.bind(this));
        this.canvas.on('selection:created', this.handleSelection.bind(this));
        this.canvas.on('selection:updated', this.handleSelection.bind(this));
        this.canvas.on('selection:cleared', this.handleSelectionClear.bind(this));
        this.canvas.on('object:added', this.updateObjectCount.bind(this));
        this.canvas.on('object:removed', this.updateObjectCount.bind(this));

        // Suivi du curseur
        this.canvas.on('mouse:move', (e) => {
            const pointer = this.canvas.getPointer(e.e);
            const cursorPos = document.getElementById('cursorPos');
            if (cursorPos) {
                cursorPos.textContent = `Position: X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`;
            }
        });
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
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        // Propriétés
        if (elements.strokeColor) elements.strokeColor.addEventListener('change', this.updateProperties.bind(this));
        if (elements.fillColor) elements.fillColor.addEventListener('change', this.updateProperties.bind(this));
        if (elements.strokeWidth) elements.strokeWidth.addEventListener('input', this.updateStrokeWidth.bind(this));
        if (elements.opacity) elements.opacity.addEventListener('input', this.updateOpacity.bind(this));

        // Paramètres
        if (elements.gridToggle) elements.gridToggle.addEventListener('change', this.toggleGrid.bind(this));
        if (elements.snapToggle) elements.snapToggle.addEventListener('change', this.toggleSnap.bind(this));
        if (elements.autoSelectToggle) elements.autoSelectToggle.addEventListener('change', this.toggleAutoSelect.bind(this));
        if (elements.zoomSlider) elements.zoomSlider.addEventListener('input', this.updateZoom.bind(this));

        // Actions
        if (elements.undoBtn) elements.undoBtn.addEventListener('click', this.undo.bind(this));
        if (elements.redoBtn) elements.redoBtn.addEventListener('click', this.redo.bind(this));
        if (elements.clearBtn) elements.clearBtn.addEventListener('click', this.clearCanvas.bind(this));
        if (elements.saveBtn) elements.saveBtn.addEventListener('click', this.saveProject.bind(this));
        if (elements.loadBtn) elements.loadBtn.addEventListener('click', this.loadProject.bind(this));
        if (elements.exportBtn) elements.exportBtn.addEventListener('click', this.exportImage.bind(this));

        // Raccourcis clavier
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Sélection d'un outil de dessin
     * @param {string} tool - Nom de l'outil à sélectionner
     */
    selectTool(tool) {
        // Nettoyer l'état précédent
        this.isDrawing = false;
        this.removePreview();
        this.hideEraserIndicator();
        
        // Mettre à jour l'interface
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        this.currentTool = tool;

        // Mettre à jour les classes CSS du canvas wrapper
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.classList.remove('eraser-mode', 'drawing-mode', 'select-mode');
            
            if (tool === 'eraser') {
                canvasWrapper.classList.add('eraser-mode');
            } else if (tool === 'select') {
                canvasWrapper.classList.add('select-mode');
            } else {
                canvasWrapper.classList.add('drawing-mode');
            }
        }

        // Configuration du canvas selon l'outil
        if (tool === 'select') {
            this.canvas.defaultCursor = 'default';
            this.canvas.selection = true;
            this.canvas.forEachObject(obj => {
                if (!obj.isGrid && !obj.isPreview && !obj.isEraserIndicator) {
                    obj.selectable = true;
                    obj.evented = true;
                }
            });
            
            const selectionInfo = document.getElementById('selection');
            if (selectionInfo) {
                selectionInfo.textContent = 'Mode sélection actif';
            }
        } else {
            this.canvas.defaultCursor = 'crosshair';
            this.canvas.selection = false;
            this.canvas.discardActiveObject();
            this.canvas.forEachObject(obj => {
                if (!obj.isGrid && !obj.isPreview && !obj.isEraserIndicator) {
                    obj.selectable = false;
                    obj.evented = false;
                }
            });
            
            // Messages d'état pour chaque outil
            const toolNames = {
                'wall': 'Dessiner des murs',
                'voile': 'Dessiner des voiles béton',
                'door': 'Placer des portes',
                'window': 'Placer des fenêtres', 
                'stairs': 'Dessiner des escaliers',
                'elevator': 'Placer des ascenseurs',
                'gaine': 'Dessiner des gaines techniques',
                'tech-space': 'Placer des espaces techniques',
                'rectangle': 'Dessiner des rectangles',
                'circle': 'Dessiner des cercles',
                'line': 'Dessiner des lignes',
                'text': 'Ajouter du texte',
                'eraser': 'Effacer des éléments (maintenir le clic)'
            };
            
            const selectionInfo = document.getElementById('selection');
            if (selectionInfo) {
                selectionInfo.textContent = toolNames[tool] || `Outil ${tool} actif`;
            }
        }

        this.canvas.renderAll();
        console.log(`Outil sélectionné: ${tool}`);
    }

    /**
     * Gestion de l'événement mouse:down
     * @param {Object} e - Événement Fabric.js
     */
    handleMouseDown(e) {
        if (this.currentTool === 'select') return;
        
        const pointer = this.canvas.getPointer(e.e);
        this.startX = this.snapEnabled ? this.snapToGrid(pointer.x) : pointer.x;
        this.startY = this.snapEnabled ? this.snapToGrid(pointer.y) : pointer.y;
        this.isDrawing = true;

        // Outil gomme - logique spéciale
        if (this.currentTool === 'eraser') {
            this.handleEraser(pointer);
            return;
        }

        // Pour les outils qui créent des objets au clic
        if (['door', 'window', 'text', 'elevator', 'tech-space'].includes(this.currentTool)) {
            this.createObject(this.startX, this.startY, this.startX, this.startY);
            this.isDrawing = false;
            this.saveState();
            
            if (this.autoSelectAfterDraw) {
                this.selectTool('select');
            }
        }
    }

    /**
     * Gestion de l'événement mouse:move
     * @param {Object} e - Événement Fabric.js
     */
    handleMouseMove(e) {
        if (!this.isDrawing || this.currentTool === 'select') return;
        
        // Outil gomme
        if (this.currentTool === 'eraser') {
            const pointer = this.canvas.getPointer(e.e);
            this.handleEraser(pointer);
            return;
        }
        
        // Prévisualisation pour les outils glisser-déposer
        if (['wall', 'line', 'rectangle', 'circle', 'voile', 'stairs', 'gaine'].includes(this.currentTool)) {
            const pointer = this.canvas.getPointer(e.e);
            const endX = this.snapEnabled ? this.snapToGrid(pointer.x) : pointer.x;
            const endY = this.snapEnabled ? this.snapToGrid(pointer.y) : pointer.y;
            
            this.removePreview();
            
            const distance = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2));
            if (distance > 5) {
                this.createPreview(this.startX, this.startY, endX, endY);
            }
        }
    }

    /**
     * Gestion de l'événement mouse:up
     * @param {Object} e - Événement Fabric.js
     */
    handleMouseUp(e) {
        if (!this.isDrawing || this.currentTool === 'select') return;
        
        // Arrêter la gomme
        if (this.currentTool === 'eraser') {
            this.hideEraserIndicator();
            this.saveState();
            this.isDrawing = false;
            return;
        }
        
        const pointer = this.canvas.getPointer(e.e);
        const endX = this.snapEnabled ? this.snapToGrid(pointer.x) : pointer.x;
        const endY = this.snapEnabled ? this.snapToGrid(pointer.y) : pointer.y;
        
        this.removePreview();
        
        // Créer l'objet pour les outils glisser-déposer
        if (['wall', 'line', 'rectangle', 'circle', 'voile', 'stairs', 'gaine'].includes(this.currentTool)) {
            const distance = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2));
            
            if (distance > 5) {
                this.createObject(this.startX, this.startY, endX, endY);
                this.saveState();
                
                if (this.autoSelectAfterDraw) {
                    this.selectTool('select');
                }
            }
        }
        
        this.isDrawing = false;
    }

    /**
     * Création d'une prévisualisation pour l'outil actif
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     */
    createPreview(x1, y1, x2, y2) {
        try {
            const strokeColorInput = document.getElementById('strokeColor');
            const strokeWidthInput = document.getElementById('strokeWidth');
            
            const strokeColor = strokeColorInput?.value || '#333333';
            const strokeWidth = parseInt(strokeWidthInput?.value || '2');

            let preview = null;

            switch(this.currentTool) {
                case 'wall':
                case 'line':
                    preview = new fabric.Line([x1, y1, x2, y2], {
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        opacity: 0.5,
                        selectable: false,
                        evented: false,
                        isPreview: true,
                        strokeDashArray: [5, 5]
                    });
                    break;

                case 'voile':
                    const voileWidth = Math.abs(x2 - x1) || 20;
                    const voileHeight = Math.abs(y2 - y1) || 100;
                    if (voileWidth > 5 || voileHeight > 5) {
                        preview = new fabric.Rect({
                            left: Math.min(x1, x2),
                            top: Math.min(y1, y2),
                            width: Math.max(voileWidth, 20),
                            height: Math.max(voileHeight, 50),
                            fill: 'transparent',
                            stroke: strokeColor,
                            strokeWidth: strokeWidth * 2,
                            opacity: 0.5,
                            selectable: false,
                            evented: false,
                            isPreview: true,
                            strokeDashArray: [5, 5]
                        });
                    }
                    break;

                case 'gaine':
                    const gaineWidth = Math.abs(x2 - x1) || 40;
                    const gaineHeight = Math.abs(y2 - y1) || 40;
                    if (gaineWidth > 5 || gaineHeight > 5) {
                        preview = new fabric.Rect({
                            left: Math.min(x1, x2),
                            top: Math.min(y1, y2),
                            width: Math.max(gaineWidth, 30),
                            height: Math.max(gaineHeight, 30),
                            fill: 'transparent',
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            opacity: 0.5,
                            selectable: false,
                            evented: false,
                            isPreview: true,
                            strokeDashArray: [10, 5]
                        });
                    }
                    break;

                case 'stairs':
                    const stairsWidth = Math.abs(x2 - x1) || 80;
                    const stairsHeight = Math.abs(y2 - y1) || 120;
                    if (stairsWidth > 5 || stairsHeight > 5) {
                        preview = new fabric.Rect({
                            left: Math.min(x1, x2),
                            top: Math.min(y1, y2),
                            width: Math.max(stairsWidth, 80),
                            height: Math.max(stairsHeight, 120),
                            fill: 'transparent',
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            opacity: 0.5,
                            selectable: false,
                            evented: false,
                            isPreview: true,
                            strokeDashArray: [5, 5]
                        });
                    }
                    break;

                case 'rectangle':
                    const width = Math.abs(x2 - x1);
                    const height = Math.abs(y2 - y1);
                    if (width > 5 && height > 5) {
                        preview = new fabric.Rect({
                            left: Math.min(x1, x2),
                            top: Math.min(y1, y2),
                            width: width,
                            height: height,
                            fill: 'transparent',
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            opacity: 0.5,
                            selectable: false,
                            evented: false,
                            isPreview: true,
                            strokeDashArray: [5, 5]
                        });
                    }
                    break;

                case 'circle':
                    const radius = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
                    if (radius > 5) {
                        preview = new fabric.Circle({
                            left: x1 - radius,
                            top: y1 - radius,
                            radius: radius,
                            fill: 'transparent',
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            opacity: 0.5,
                            selectable: false,
                            evented: false,
                            isPreview: true,
                            strokeDashArray: [5, 5]
                        });
                    }
                    break;
            }

            if (preview) {
                this.canvas.add(preview);
                this.canvas.renderAll();
            }
        } catch (error) {
            console.error(`Erreur lors de la prévisualisation de ${this.currentTool}:`, error);
        }
    }

    /**
     * Suppression des objets de prévisualisation
     */
    removePreview() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isPreview) {
                this.canvas.remove(obj);
            }
        });
        this.canvas.renderAll();
    }

    /**
     * Création d'un nouvel objet sur le canevas
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     */
    createObject(x1, y1, x2, y2) {
        if (this.creatingObject) return;
        this.creatingObject = true;
        
        try {
            const strokeColorInput = document.getElementById('strokeColor');
            const fillColorInput = document.getElementById('fillColor');
            const strokeWidthInput = document.getElementById('strokeWidth');
            const opacityInput = document.getElementById('opacity');

            const strokeColor = strokeColorInput?.value || '#333333';
            const fillColor = fillColorInput?.value || '#ffffff';
            const strokeWidth = parseInt(strokeWidthInput?.value || '2');
            const opacity = parseFloat(opacityInput?.value || '1');

            let obj = null;

            switch(this.currentTool) {
                case 'wall':
                    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    if (distance > 5) {
                        obj = new fabric.Line([x1, y1, x2, y2], {
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            opacity: opacity,
                            selectable: true,
                            type: 'wall'
                        });
                    }
                    break;

                case 'voile':
                    obj = this.createVoile(x1, y1, x2, y2, strokeColor, strokeWidth, opacity);
                    break;

                case 'door':
                    obj = this.createDoor(x1, y1, opacity);
                    break;

                case 'window':
                    obj = this.createWindow(x1, y1, opacity);
                    break;

                case 'stairs':
                    obj = this.createStairs(x1, y1, x2, y2, opacity);
                    break;

                case 'elevator':
                    obj = this.createElevator(x1, y1, opacity);
                    break;

                case 'gaine':
                    obj = this.createGaine(x1, y1, x2, y2, strokeColor, strokeWidth, opacity);
                    break;

                case 'tech-space':
                    obj = this.createTechSpace(x1, y1, opacity);
                    break;

                case 'rectangle':
                    const width = Math.abs(x2 - x1);
                    const height = Math.abs(y2 - y1);
                    const rectWidth = width > 5 ? width : 50;
                    const rectHeight = height > 5 ? height : 50;
                    
                    obj = new fabric.Rect({
                        left: width > 5 ? Math.min(x1, x2) : x1 - 25,
                        top: height > 5 ? Math.min(y1, y2) : y1 - 25,
                        width: rectWidth,
                        height: rectHeight,
                        fill: fillColor,
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        opacity: opacity,
                        type: 'rectangle'
                    });
                    break;

                case 'circle':
                    const radiusCalc = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
                    const radius = radiusCalc > 5 ? radiusCalc : 25;
                    
                    obj = new fabric.Circle({
                        left: radiusCalc > 5 ? x1 - radius : x1 - 25,
                        top: radiusCalc > 5 ? y1 - radius : y1 - 25,
                        radius: radius,
                        fill: fillColor,
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        opacity: opacity,
                        type: 'circle'
                    });
                    break;

                case 'line':
                    const lineDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    if (lineDistance > 5) {
                        obj = new fabric.Line([x1, y1, x2, y2], {
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            opacity: opacity,
                            type: 'line'
                        });
                    }
                    break;

                case 'text':
                    const text = prompt('Entrez le texte:');
                    if (text && text.trim() !== '' && text.length <= 100) {
                        obj = new fabric.Text(text.trim(), {
                            left: x1,
                            top: y1,
                            fill: strokeColor,
                            fontSize: 16,
                            opacity: opacity,
                            fontFamily: 'Arial, sans-serif',
                            type: 'text'
                        });
                    }
                    break;
            }

            if (obj) {
                this.canvas.add(obj);
                this.canvas.renderAll();
                console.log(`Objet créé: ${this.currentTool}`, obj);
            }
        } catch (error) {
            console.error(`Erreur lors de la création de l'objet ${this.currentTool}:`, error);
        } finally {
            this.creatingObject = false;
        }
    }

    /**
     * Création d'une porte
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet porte
     */
    createDoor(x, y, opacity) {
        const doorFrame = new fabric.Rect({
            left: -25,
            top: -5,
            width: 50,
            height: 10,
            fill: '#8B4513',
            stroke: '#654321',
            strokeWidth: 2
        });

        const handle = new fabric.Circle({
            left: 15,
            top: 0,
            radius: 2,
            fill: '#FFD700'
        });

        const group = new fabric.Group([doorFrame, handle], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'door';
        group.customType = 'door';
        return group;
    }

    /**
     * Création d'une fenêtre
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet fenêtre
     */
    createWindow(x, y, opacity) {
        const frame = new fabric.Rect({
            left: -30,
            top: -5,
            width: 60,
            height: 10,
            fill: '#E6E6FA',
            stroke: '#4682B4',
            strokeWidth: 2
        });

        const cross = new fabric.Line([-30, 0, 30, 0], {
            stroke: '#4682B4',
            strokeWidth: 1
        });

        const group = new fabric.Group([frame, cross], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'window';
        group.customType = 'window';
        return group;
    }

    /**
     * Création d'un escalier
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet escalier
     */
    createStairs(x1, y1, x2, y2, opacity) {
        const width = Math.abs(x2 - x1) || 80;
        const height = Math.abs(y2 - y1) || 120;
        const steps = [];
        const numSteps = Math.max(Math.floor(height / 15), 4);
        
        // Base de l'escalier
        const base = new fabric.Rect({
            left: 0,
            top: 0,
            width: width,
            height: height,
            fill: '#F5F5DC',
            stroke: '#8B4513',
            strokeWidth: 2
        });
        steps.push(base);

        // Marches
        for (let i = 0; i < numSteps; i++) {
            const stepY = (height / numSteps) * i;
            const step = new fabric.Line([0, stepY, width, stepY], {
                stroke: '#8B4513',
                strokeWidth: 1
            });
            steps.push(step);
        }

        // Flèche de direction
        const arrow = new fabric.Polygon([
            {x: width/2, y: height - 20},
            {x: width/2 - 10, y: height - 10},
            {x: width/2 + 10, y: height - 10}
        ], {
            fill: '#2F4F4F',
            stroke: '#000000',
            strokeWidth: 1
        });
        steps.push(arrow);

        const group = new fabric.Group(steps, {
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            opacity: opacity
        });
        
        group.type = 'stairs';
        group.customType = 'stairs';
        return group;
    }

    /**
     * Création d'un ascenseur
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet ascenseur
     */
    createElevator(x, y, opacity) {
        const cabin = new fabric.Rect({
            left: -30,
            top: -30,
            width: 60,
            height: 60,
            fill: '#C0C0C0',
            stroke: '#808080',
            strokeWidth: 3
        });

        const door1 = new fabric.Rect({
            left: -25,
            top: -25,
            width: 20,
            height: 50,
            fill: '#A9A9A9',
            stroke: '#696969',
            strokeWidth: 1
        });

        const door2 = new fabric.Rect({
            left: 5,
            top: -25,
            width: 20,
            height: 50,
            fill: '#A9A9A9',
            stroke: '#696969',
            strokeWidth: 1
        });

        const buttons = new fabric.Rect({
            left: 25,
            top: -15,
            width: 8,
            height: 30,
            fill: '#FFD700',
            stroke: '#FFA500',
            strokeWidth: 1
        });

        const symbol = new fabric.Text('ASC', {
            left: 0,
            top: 0,
            fontSize: 12,
            fill: '#000000',
            fontFamily: 'Arial, sans-serif',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([cabin, door1, door2, buttons, symbol], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'elevator';
        group.customType = 'elevator';
        return group;
    }

    /**
     * Création d'un voile béton
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {string} color - Couleur du contour
     * @param {number} strokeWidth - Épaisseur du contour
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet voile
     */
    createVoile(x1, y1, x2, y2, color, strokeWidth, opacity) {
        const width = Math.abs(x2 - x1) || 20;
        const height = Math.abs(y2 - y1) || 100;
        
        const voile = new fabric.Rect({
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: Math.max(width, 20),
            height: Math.max(height, 50),
            fill: '#D3D3D3',
            stroke: color,
            strokeWidth: strokeWidth * 2,
            opacity: opacity
        });

        const hatches = [];
        for (let i = 0; i < Math.max(width, height); i += 15) {
            const hatch = new fabric.Line([i, 0, i + 10, 10], {
                stroke: color,
                strokeWidth: 1,
                opacity: opacity * 0.5
            });
            hatches.push(hatch);
        }

        const group = new fabric.Group([voile, ...hatches]);
        group.type = 'voile';
        group.customType = 'voile';
        return group;
    }

    /**
     * Création d'une gaine technique
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {string} color - Couleur du contour
     * @param {number} strokeWidth - Épaisseur du contour
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet gaine
     */
    createGaine(x1, y1, x2, y2, color, strokeWidth, opacity) {
        const width = Math.abs(x2 - x1) || 40;
        const height = Math.abs(y2 - y1) || 40;
        
        const conduit = new fabric.Rect({
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: Math.max(width, 30),
            height: Math.max(height, 30),
            fill: 'transparent',
            stroke: color,
            strokeWidth: strokeWidth,
            strokeDashArray: [10, 5],
            opacity: opacity
        });

        const centerX = Math.min(x1, x2) + Math.max(width, 30) / 2;
        const centerY = Math.min(y1, y2) + Math.max(height, 30) / 2;

        const elecSymbol = new fabric.Text('E', {
            left: centerX - 10,
            top: centerY - 10,
            fontSize: 14,
            fill: color,
            fontFamily: 'Arial, sans-serif',
            originX: 'center',
            originY: 'center'
        });

        const plumbSymbol = new fabric.Text('P', {
            left: centerX + 10,
            top: centerY - 10,
            fontSize: 14,
            fill: color,
            fontFamily: 'Arial, sans-serif',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([conduit, elecSymbol, plumbSymbol]);
        group.type = 'gaine';
        group.customType = 'gaine';
        return group;
    }

    /**
     * Création d'un espace technique
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet espace technique
     */
    createTechSpace(x, y, opacity) {
        const room = new fabric.Rect({
            left: -40,
            top: -30,
            width: 80,
            height: 60,
            fill: '#F0F8FF',
            stroke: '#4169E1',
            strokeWidth: 3,
            strokeDashArray: [15, 10]
        });

        const equipment1 = new fabric.Rect({
            left: -30,
            top: -20,
            width: 25,
            height: 15,
            fill: '#708090',
            stroke: '#2F4F4F',
            strokeWidth: 1
        });

        const equipment2 = new fabric.Circle({
            left: 0,
            top: -10,
            radius: 8,
            fill: '#708090',
            stroke: '#2F4F4F',
            strokeWidth: 1
        });

        const equipment3 = new fabric.Rect({
            left: 15,
            top: -15,
            width: 20,
            height: 25,
            fill: '#708090',
            stroke: '#2F4F4F',
            strokeWidth: 1
        });

        const label = new fabric.Text('R.TECH', {
            left: 0,
            top: 20,
            fontSize: 10,
            fill: '#4169E1',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([room, equipment1, equipment2, equipment3, label], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'tech-space';
        group.customType = 'tech-space';
        return group;
    }

    /**
     * Gestion de l'outil gomme
     * @param {Object} pointer - Coordonnées du pointeur
     */
    handleEraser(pointer) {
        const x = pointer.x;
        const y = pointer.y;
        const eraserSize = 20;

        this.showEraserIndicator(x, y, eraserSize);

        const objectsToCheck = this.canvas.getObjects().filter(obj => 
            !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator && obj.selectable !== false
        );

        objectsToCheck.forEach(obj => {
            if (this.isPointNearObject(x, y, obj, eraserSize)) {
                if (obj.type === 'line' || obj.type === 'wall') {
                    this.eraseFromLine(obj, x, y, eraserSize);
                } else {
                    this.canvas.remove(obj);
                }
            }
        });
        
        this.canvas.renderAll();
    }

    /**
     * Affichage de l'indicateur de gomme
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} size - Taille de l'indicateur
     */
    showEraserIndicator(x, y, size) {
        const oldIndicator = this.canvas.getObjects().find(obj => obj.isEraserIndicator);
        if (oldIndicator) {
            this.canvas.remove(oldIndicator);
        }

        const indicator = new fabric.Circle({
            left: x - size/2,
            top: y - size/2,
            radius: size/2,
            fill: 'transparent',
            stroke: '#ff0000',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            isEraserIndicator: true,
            opacity: 0.7
        });

        this.canvas.add(indicator);
    }

    /**
     * Masquer l'indicateur de gomme
     */
    hideEraserIndicator() {
        const indicator = this.canvas.getObjects().find(obj => obj.isEraserIndicator);
        if (indicator) {
            this.canvas.remove(indicator);
            this.canvas.renderAll();
        }
    }

    /**
     * Vérifie si un point est proche d'un objet
     * @param {number} x - Coordonnée X du point
     * @param {number} y - Coordonnée Y du point
     * @param {Object} obj - Objet Fabric.js
     * @param {number} tolerance - Tolérance en pixels
     * @returns {boolean} Vrai si le point est proche
     */
    isPointNearObject(x, y, obj, tolerance) {
        const objBounds = obj.getBoundingRect();
        return (x >= objBounds.left - tolerance && 
                x <= objBounds.left + objBounds.width + tolerance &&
                y >= objBounds.top - tolerance && 
                y <= objBounds.top + objBounds.height + tolerance);
    }

    /**
     * Efface ou divise une ligne
     * @param {Object} lineObj - Objet ligne Fabric.js
     * @param {number} x - Position X du pointeur
     * @param {number} y - Position Y du pointeur
     * @param {number} tolerance - Tolérance en pixels
     */
    eraseFromLine(lineObj, x, y, tolerance) {
        if (lineObj.type !== 'line' && lineObj.type !== 'wall') return;

        const x1 = lineObj.x1;
        const y1 = lineObj.y1;
        const x2 = lineObj.x2;
        const y2 = lineObj.y2;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            this.canvas.remove(lineObj);
            return;
        }

        const param = dot / lenSq;

        if (param < 0 || param > 1) return;

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const distance = Math.sqrt((x - xx) * (x - xx) + (y - yy) * (y - yy));

        if (distance <= tolerance) {
            // Diviser la ligne en deux segments si le point est à l'intérieur
            if (param > 0.2 && param < 0.8) {
                const segment1 = new fabric.Line([x1, y1, xx, yy], {
                    stroke: lineObj.stroke,
                    strokeWidth: lineObj.strokeWidth,
                    opacity: lineObj.opacity,
                    selectable: true,
                    type: lineObj.type
                });
                const segment2 = new fabric.Line([xx, yy, x2, y2], {
                    stroke: lineObj.stroke,
                    strokeWidth: lineObj.strokeWidth,
                    opacity: lineObj.opacity,
                    selectable: true,
                    type: lineObj.type
                });
                this.canvas.add(segment1, segment2);
            }
            this.canvas.remove(lineObj);
        }
    }

    /**
     * Alignement à la grille
     * @param {number} value - Valeur à aligner
     * @returns {number} Valeur alignée
     */
    snapToGrid(value) {
        return this.snapEnabled ? Math.round(value / this.gridSize) * this.gridSize : value;
    }

    /**
     * Conversion RGB vers hexadécimal
     * @param {string} rgb - Couleur au format RGB
     * @returns {string} Couleur au format hexadécimal
     */
    rgbToHex(rgb) {
        if (!rgb) return '#000000';
        if (rgb.startsWith('#')) return rgb;
        
        const match = rgb.match(/rgba?\((\d+),?\s*(\d+),?\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        return rgb.startsWith('#') ? rgb : '#000000';
    }

    /**
     * Dessin de la grille (optimisé pour la zone visible)
     */
    drawGrid() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isGrid) {
                this.canvas.remove(obj);
            }
        });

        const gridToggle = document.getElementById('gridToggle');
        if (!gridToggle || !gridToggle.checked) {
            this.canvas.renderAll();
            return;
        }

        const zoom = this.canvas.getZoom() || 1;
        const gridSize = this.gridSize * zoom;
        const vpt = this.canvas.viewportTransform;
        const viewWidth = this.canvas.width / zoom;
        const viewHeight = this.canvas.height / zoom;
        const gridLines = [];

        // Calculer les limites visibles
        const left = -vpt[4] / zoom;
        const top = -vpt[5] / zoom;
        const right = left + viewWidth;
        const bottom = top + viewHeight;

        // Dessiner seulement les lignes dans la zone visible
        for (let i = Math.floor(left / gridSize) * gridSize; i <= right; i += gridSize) {
            gridLines.push(new fabric.Line([i, top, i, bottom], {
                stroke: '#e0e0e0',
                strokeWidth: 1 / zoom,
                selectable: false,
                evented: false,
                isGrid: true
            }));
        }

        for (let i = Math.floor(top / gridSize) * gridSize; i <= bottom; i += gridSize) {
            gridLines.push(new fabric.Line([left, i, right, i], {
                stroke: '#e0e0e0',
                strokeWidth: 1 / zoom,
                selectable: false,
                evented: false,
                isGrid: true
            }));
        }

        gridLines.forEach(line => {
            this.canvas.add(line);
            this.canvas.sendToBack(line);
        });

        this.canvas.renderAll();
    }

    /**
     * Mise à jour des propriétés de l'objet sélectionné
     */
    updateProperties() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        try {
            const strokeColorInput = document.getElementById('strokeColor');
            const fillColorInput = document.getElementById('fillColor');
            const strokeWidthInput = document.getElementById('strokeWidth');
            const opacityInput = document.getElementById('opacity');

            const strokeColor = strokeColorInput?.value || '#333333';
            const fillColor = fillColorInput?.value || '#ffffff';
            const strokeWidth = parseInt(strokeWidthInput?.value || '2');
            const opacity = parseFloat(opacityInput?.value || '1');

            if (activeObject.type === 'line' || activeObject.type === 'wall') {
                activeObject.set({ 
                    stroke: strokeColor, 
                    strokeWidth: strokeWidth, 
                    opacity: opacity 
                });
            } else if (activeObject.type === 'text') {
                activeObject.set({ 
                    fill: strokeColor, 
                    opacity: opacity,
                    fontFamily: 'Arial, sans-serif'
                });
            } else {
                const updateProps = { opacity: opacity };
                
                if (activeObject.fill !== undefined) {
                    updateProps.fill = fillColor;
                }
                if (activeObject.stroke !== undefined) {
                    updateProps.stroke = strokeColor;
                    updateProps.strokeWidth = strokeWidth;
                }
                
                activeObject.set(updateProps);
            }

            this.canvas.renderAll();
            this.saveState();
        } catch (error) {
            console.error('Erreur lors de la mise à jour des propriétés:', error);
        }
    }

    /**
     * Mise à jour de l'épaisseur du contour
     */
    updateStrokeWidth() {
        const strokeWidthInput = document.getElementById('strokeWidth');
        const strokeValue = document.getElementById('strokeValue');
        
        if (!strokeWidthInput) return;
        
        const value = strokeWidthInput.value;
        if (strokeValue) strokeValue.textContent = value;
        this.updateProperties();
    }

    /**
     * Mise à jour de l'opacité
     */
    updateOpacity() {
        const opacityInput = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacityValue');
        
        if (!opacityInput) return;
        
        const value = opacityInput.value;
        if (opacityValue) opacityValue.textContent = Math.round(value * 100) + '%';
        this.updateProperties();
    }

    /**
     * Gestion de la sélection d'un objet
     * @param {Object} e - Événement Fabric.js
     */
    handleSelection(e) {
        const obj = e.selected[0];
        if (obj) {
            const selectionInfo = document.getElementById('selection');
            if (selectionInfo) {
                selectionInfo.textContent = `Sélectionné: ${obj.type || 'objet'}`;
            }
            this.updatePropertiesFromObject(obj);
        }
    }

    /**
     * Gestion de la désélection
     */
    handleSelectionClear() {
        const selectionInfo = document.getElementById('selection');
        if (selectionInfo) {
            selectionInfo.textContent = 'Aucune sélection';
        }
    }

    /**
     * Mise à jour des champs de propriétés à partir d'un objet
     * @param {Object} obj - Objet Fabric.js
     */
    updatePropertiesFromObject(obj) {
        if (!obj) return;

        try {
            if (obj.stroke && obj.stroke !== 'transparent') {
                const hexStroke = this.rgbToHex(obj.stroke);
                const strokeColorInput = document.getElementById('strokeColor');
                if (strokeColorInput) strokeColorInput.value = hexStroke;
            }
            
            if (obj.fill && obj.fill !== 'transparent') {
                const hexFill = this.rgbToHex(obj.fill);
                const fillColorInput = document.getElementById('fillColor');
                if (fillColorInput) fillColorInput.value = hexFill;
            }
            
            if (obj.strokeWidth !== undefined) {
                const strokeWidth = Math.max(1, Math.min(10, obj.strokeWidth));
                const strokeWidthInput = document.getElementById('strokeWidth');
                const strokeValue = document.getElementById('strokeValue');
                if (strokeWidthInput) strokeWidthInput.value = strokeWidth;
                if (strokeValue) strokeValue.textContent = strokeWidth;
            }
            
            if (obj.opacity !== undefined) {
                const opacity = Math.max(0.1, Math.min(1, obj.opacity));
                const opacityInput = document.getElementById('opacity');
                const opacityValue = document.getElementById('opacityValue');
                if (opacityInput) opacityInput.value = opacity;
                if (opacityValue) opacityValue.textContent = Math.round(opacity * 100) + '%';
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des propriétés:', error);
        }
    }

    /**
     * Basculement de l'affichage de la grille
     */
    toggleGrid() {
        this.drawGrid();
    }

    /**
     * Basculement de l'accrochage à la grille
     */
    toggleSnap() {
        this.snapEnabled = document.getElementById('snapToggle')?.checked ?? true;
        console.log('Accrochage:', this.snapEnabled ? 'activé' : 'désactivé');
    }

    /**
     * Basculement de la sélection automatique après dessin
     */
    toggleAutoSelect() {
        this.autoSelectAfterDraw = document.getElementById('autoSelectToggle')?.checked ?? true;
        console.log('Retour auto à la sélection:', this.autoSelectAfterDraw ? 'activé' : 'désactivé');
    }

    /**
     * Mise à jour du niveau de zoom
     */
    updateZoom() {
        const zoomSlider = document.getElementById('zoomSlider');
        if (!zoomSlider) return;
        
        const zoom = parseFloat(zoomSlider.value);
        this.canvas.setZoom(zoom);
        
        const zoomValue = document.getElementById('zoomValue');
        const zoomInfo = document.getElementById('zoomInfo');
        
        if (zoomValue) zoomValue.textContent = Math.round(zoom * 100) + '%';
        if (zoomInfo) zoomInfo.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
        this.drawGrid();
    }

    /**
     * Sauvegarde de l'état du canevas
     */
    saveState() {
        try {
            const objectsToSave = this.canvas.getObjects().filter(obj => 
                !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
            );
            
            const cleanObjects = objectsToSave.map(obj => {
                try {
                    const objData = obj.toObject(['type', 'customType', 'left', 'top', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'opacity', 'angle', 'scaleX', 'scaleY', 'x1', 'y1', 'x2', 'y2', 'radius', 'text', 'fontSize', 'fontFamily']);
                    delete objData.textAlign;
                    delete objData.textBaseline;
                    delete objData.clipPath;
                    
                    objData.type = obj.customType || obj.type || 'rect';
                    
                    return objData;
                } catch (error) {
                    console.error('Erreur lors de la sérialisation d\'un objet:', error);
                    return {
                        type: 'rect',
                        left: obj.left || 0,
                        top: obj.top || 0,
                        width: 50,
                        height: 50,
                        fill: 'rgba(200, 200, 200, 0.5)',
                        stroke: '#666666',
                        strokeWidth: 1,
                        opacity: obj.opacity || 1
                    };
                }
            }).filter(obj => obj !== null);
            
            const canvasState = {
                version: this.canvas.version,
                objects: cleanObjects
            };
            
            const state = JSON.stringify(canvasState);
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(state);
            this.historyIndex++;
            
            if (this.history.length > 30) {
                this.history.shift();
                this.historyIndex--;
            }

            const saveStatus = document.getElementById('saveStatus');
            if (saveStatus) {
                saveStatus.textContent = '💾 Modifié';
            }
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
                const state = JSON.parse(this.history[this.historyIndex]);
                
                const gridObjects = this.canvas.getObjects().filter(obj => obj.isGrid);
                this.canvas.clear();
                
                gridObjects.forEach(grid => this.canvas.add(grid));
                
                if (state.objects && state.objects.length > 0) {
                    this.loadObjectsFromData(state.objects);
                }
                
                this.canvas.backgroundColor = '#f8f9fa';
                this.updateObjectCount();
            } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
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
                const state = JSON.parse(this.history[this.historyIndex]);
                
                const gridObjects = this.canvas.getObjects().filter(obj => obj.isGrid);
                this.canvas.clear();
                
                gridObjects.forEach(grid => this.canvas.add(grid));
                
                if (state.objects && state.objects.length > 0) {
                    this.loadObjectsFromData(state.objects);
                }
                
                this.canvas.backgroundColor = '#f8f9fa';
                this.updateObjectCount();
            } catch (error) {
                console.error('Erreur lors de la restauration:', error);
            }
        }
    }

    /**
     * Chargement des objets à partir des données
     * @param {Array} objectsData - Données des objets
     */
    loadObjectsFromData(objectsData) {
        objectsData.forEach(objData => {
            try {
                if (objData.textAlign) delete objData.textAlign;
                if (objData.textBaseline) delete objData.textBaseline;
                
                let obj = null;
                
                switch(objData.type) {
                    case 'rect':
                    case 'rectangle':
                        obj = new fabric.Rect({
                            left: objData.left || 0,
                            top: objData.top || 0,
                            width: objData.width || 50,
                            height: objData.height || 50,
                            fill: objData.fill || '#ffffff',
                            stroke: objData.stroke || '#000000',
                            strokeWidth: objData.strokeWidth || 1,
                            opacity: objData.opacity || 1,
                            angle: objData.angle || 0,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1
                        });
                        break;
                        
                    case 'circle':
                        obj = new fabric.Circle({
                            left: objData.left || 0,
                            top: objData.top || 0,
                            radius: objData.radius || 25,
                            fill: objData.fill || '#ffffff',
                            stroke: objData.stroke || '#000000',
                            strokeWidth: objData.strokeWidth || 1,
                            opacity: objData.opacity || 1,
                            angle: objData.angle || 0,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1
                        });
                        break;
                        
                    case 'line':
                    case 'wall':
                        obj = new fabric.Line([
                            objData.x1 || 0, 
                            objData.y1 || 0, 
                            objData.x2 || 50, 
                            objData.y2 || 50
                        ], {
                            left: objData.left || 0,
                            top: objData.top || 0,
                            stroke: objData.stroke || '#000000',
                            strokeWidth: objData.strokeWidth || 1,
                            opacity: objData.opacity || 1,
                            angle: objData.angle || 0,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1
                        });
                        break;
                        
                    case 'text':
                        obj = new fabric.Text(objData.text || 'Texte', {
                            left: objData.left || 0,
                            top: objData.top || 0,
                            fill: objData.fill || '#000000',
                            fontSize: objData.fontSize || 16,
                            fontFamily: objData.fontFamily || 'Arial, sans-serif',
                            opacity: objData.opacity || 1,
                            angle: objData.angle || 0,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1
                        });
                        break;
                        
                    case 'group':
                    case 'door':
                    case 'window':
                    case 'elevator':
                    case 'stairs':
                    case 'voile':
                    case 'gaine':
                    case 'tech-space':
                        obj = this.recreateComplexObject(objData);
                        break;
                        
                    default:
                        try {
                            obj = new fabric.Rect({
                                left: objData.left || 0,
                                top: objData.top || 0,
                                width: objData.width || 50,
                                height: objData.height || 50,
                                fill: objData.fill || 'transparent',
                                stroke: objData.stroke || '#000000',
                                strokeWidth: objData.strokeWidth || 1,
                                opacity: objData.opacity || 1
                            });
                        } catch (defaultError) {
                            console.error('Impossible de créer l\'objet:', objData.type);
                        }
                        break;
                }
                
                if (obj) {
                    obj.type = objData.type;
                    this.canvas.add(obj);
                }
                
            } catch (objError) {
                console.error('Erreur lors de la restauration d\'un objet:', objError);
            }
        });
        
        this.canvas.renderAll();
    }

    /**
     * Recréation des objets complexes (groupes)
     * @param {Object} objData - Données de l'objet
     * @returns {fabric.Object} Objet recréé
     */
    recreateComplexObject(objData) {
        try {
            const left = objData.left || 0;
            const top = objData.top || 0;
            const opacity = objData.opacity || 1;
            
            switch(objData.type) {
                case 'door':
                    return this.createDoor(left, top, opacity);
                    
                case 'window':
                    return this.createWindow(left, top, opacity);
                    
                case 'elevator':
                    return this.createElevator(left, top, opacity);
                    
                case 'stairs':
                    const width = objData.width || 80;
                    const height = objData.height || 120;
                    return this.createStairs(left, top, left + width, top + height, opacity);
                    
                case 'voile':
                    const voileWidth = objData.width || 20;
                    const voileHeight = objData.height || 100;
                    return this.createVoile(left, top, left + voileWidth, top + voileHeight, 
                                         objData.stroke || '#333333', objData.strokeWidth || 2, opacity);
                    
                case 'gaine':
                    const gaineWidth = objData.width || 40;
                    const gaineHeight = objData.height || 40;
                    return this.createGaine(left, top, left + gaineWidth, top + gaineHeight,
                                         objData.stroke || '#333333', objData.strokeWidth || 2, opacity);
                    
                case 'tech-space':
                    return this.createTechSpace(left, top, opacity);
                    
                default:
                    return new fabric.Rect({
                        left: left,
                        top: top,
                        width: objData.width || 50,
                        height: objData.height || 50,
                        fill: 'rgba(200, 200, 200, 0.5)',
                        stroke: '#666666',
                        strokeWidth: 1,
                        opacity: opacity
                    });
            }
        } catch (error) {
            console.error('Erreur lors de la recréation d\'un objet complexe:', error);
            return new fabric.Rect({
                left: objData.left || 0,
                top: objData.top || 0,
                width: 50,
                height: 50,
                fill: 'rgba(255, 0, 0, 0.3)',
                stroke: '#ff0000',
                strokeWidth: 1
            });
        }
    }

    /**
     * Effacement du canevas
     */
    clearCanvas() {
        if (confirm('Effacer tout le plan ?')) {
            this.canvas.clear();
            this.canvas.backgroundColor = '#f8f9fa';
            this.drawGrid();
            this.saveState();
            this.updateObjectCount();
        }
    }

    /**
     * Sauvegarde du projet
     */
    saveProject() {
        try {
            const cleanObjects = this.canvas.getObjects().filter(obj => 
                !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
            );
            
            const safeObjects = cleanObjects.map(obj => {
                try {
                    const objData = obj.toObject(['type', 'customType', 'left', 'top', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'opacity', 'angle', 'scaleX', 'scaleY', 'x1', 'y1', 'x2', 'y2', 'radius', 'text', 'fontSize', 'fontFamily']);
                    delete objData.textAlign;
                    delete objData.textBaseline;
                    delete objData.clipPath;
                    
                    objData.type = obj.customType || obj.type || 'rect';
                    
                    return objData;
                } catch (error) {
                    console.error('Erreur lors de la sérialisation d\'un objet:', error);
                    return null;
                }
            }).filter(obj => obj !== null);
            
            const projectNameInput = document.getElementById('projectName');
            const projectName = projectNameInput?.value || 'Mon_Plan';
            
            const projectData = {
                name: projectName,
                canvas: {
                    version: this.canvas.version,
                    objects: safeObjects,
                    background: this.canvas.backgroundColor
                },
                timestamp: new Date().toISOString()
            };

            const dataStr = JSON.stringify(projectData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}.json`);
            link.click();

            const saveStatus = document.getElementById('saveStatus');
            if (saveStatus) {
                saveStatus.textContent = '💾 Sauvegardé';
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            alert('Erreur lors de la sauvegarde du projet');
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
                        const projectData = JSON.parse(e.target.result);
                        
                        const gridObjects = this.canvas.getObjects().filter(obj => obj.isGrid);
                        this.canvas.clear();
                        
                        gridObjects.forEach(grid => this.canvas.add(grid));
                        
                        if (projectData.canvas && projectData.canvas.objects) {
                            this.loadObjectsFromData(projectData.canvas.objects);
                        }

                        if (projectData.name) {
                            const projectNameInput = document.getElementById('projectName');
                            if (projectNameInput) {
                                projectNameInput.value = projectData.name;
                            }
                        }

                        this.canvas.backgroundColor = projectData.canvas?.background || '#f8f9fa';
                        this.saveState();
                        this.updateObjectCount();
                        
                        const saveStatus = document.getElementById('saveStatus');
                        if (saveStatus) {
                            saveStatus.textContent = '💾 Chargé';
                        }
                        
                    } catch (error) {
                        alert('Erreur lors du chargement: ' + error.message);
                        console.error('Erreur de chargement:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * Exportation du canevas en image
     */
    exportImage() {
        try {
            const gridObjects = this.canvas.getObjects().filter(obj => obj.isGrid);
            gridObjects.forEach(obj => obj.visible = false);
            
            this.canvas.renderAll();
            
            const projectNameInput = document.getElementById('projectName');
            const projectName = projectNameInput?.value || 'Mon_Plan';
            
            const link = document.createElement('a');
            link.download = `${projectName}.png`;
            link.href = this.canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2
            });
            link.click();
            
            gridObjects.forEach(obj => obj.visible = true);
            this.canvas.renderAll();
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            alert('Erreur lors de l\'export de l\'image');
        }
    }

    /**
     * Mise à jour du compteur d'objets
     */
    updateObjectCount() {
        const objects = this.canvas.getObjects().filter(obj => 
            !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
        );
        const objectCount = document.getElementById('objectCount');
        if (objectCount) {
            objectCount.textContent = `Objets: ${objects.length}`;
        }
    }

    /**
     * Mise à jour de l'interface utilisateur
     */
    updateUI() {
        this.updateObjectCount();
        
        const zoomValue = document.getElementById('zoomValue');
        const strokeValue = document.getElementById('strokeValue');
        const opacityValue = document.getElementById('opacityValue');
        
        if (zoomValue) zoomValue.textContent = '100%';
        if (strokeValue) strokeValue.textContent = '2';
        if (opacityValue) opacityValue.textContent = '100%';
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
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
            }
        } else {
            switch(e.key) {
                case 'Delete':
                case 'Backspace':
                    const activeObject = this.canvas.getActiveObject();
                    if (activeObject && !activeObject.isGrid && !activeObject.isPreview && !activeObject.isEraserIndicator) {
                        this.canvas.remove(activeObject);
                        this.saveState();
                        this.updateObjectCount();
                    }
                    break;
                case 'Escape':
                    this.canvas.discardActiveObject();
                    this.canvas.renderAll();
                    break;
            }
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SimpleArchitectApp();
});

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    if (window.app && window.app.canvas) {
        window.app.canvas.calcOffset();
    }
});

// Alerte avant fermeture si modifications
window.addEventListener('beforeunload', (e) => {
    const saveStatus = document.getElementById('saveStatus');
    if (saveStatus && saveStatus.textContent.includes('Modifié')) {
        e.preventDefault();
        e.returnValue = 'Modifications non sauvegardées !';
    }
});