// Application ArchiDesign Complète
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

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.drawGrid();
        this.saveState();
        this.updateUI();
        
        console.log('🏛️ ArchiDesign initialisé avec succès!');
    }

    // Configuration du canvas
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

    // Configuration des événements
    setupEventListeners() {
        // Outils
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        // Propriétés
        const strokeColor = document.getElementById('strokeColor');
        const fillColor = document.getElementById('fillColor');
        const strokeWidth = document.getElementById('strokeWidth');
        const opacity = document.getElementById('opacity');

        if (strokeColor) strokeColor.addEventListener('change', this.updateProperties.bind(this));
        if (fillColor) fillColor.addEventListener('change', this.updateProperties.bind(this));
        if (strokeWidth) strokeWidth.addEventListener('input', this.updateStrokeWidth.bind(this));
        if (opacity) opacity.addEventListener('input', this.updateOpacity.bind(this));

        // Paramètres
        const gridToggle = document.getElementById('gridToggle');
        const snapToggle = document.getElementById('snapToggle');
        const autoSelectToggle = document.getElementById('autoSelectToggle');
        const zoomSlider = document.getElementById('zoomSlider');

        if (gridToggle) gridToggle.addEventListener('change', this.toggleGrid.bind(this));
        if (snapToggle) snapToggle.addEventListener('change', this.toggleSnap.bind(this));
        if (autoSelectToggle) autoSelectToggle.addEventListener('change', this.toggleAutoSelect.bind(this));
        if (zoomSlider) zoomSlider.addEventListener('input', this.updateZoom.bind(this));

        // Actions
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        const clearBtn = document.getElementById('clearBtn');
        const saveBtn = document.getElementById('saveBtn');
        const loadBtn = document.getElementById('loadBtn');
        const exportBtn = document.getElementById('exportBtn');

        if (undoBtn) undoBtn.addEventListener('click', this.undo.bind(this));
        if (redoBtn) redoBtn.addEventListener('click', this.redo.bind(this));
        if (clearBtn) clearBtn.addEventListener('click', this.clearCanvas.bind(this));
        if (saveBtn) saveBtn.addEventListener('click', this.saveProject.bind(this));
        if (loadBtn) loadBtn.addEventListener('click', this.loadProject.bind(this));
        if (exportBtn) exportBtn.addEventListener('click', this.exportImage.bind(this));

        // Raccourcis clavier
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    // Sélection d'outil
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

    // Gestion de la souris
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
                setTimeout(() => this.selectTool('select'), 100);
            }
        }
    }

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
                    setTimeout(() => this.selectTool('select'), 100);
                }
            }
        }
        
        this.isDrawing = false;
    }

    // Prévisualisation
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
            console.log('Erreur lors de la prévisualisation:', error);
        }
    }

    removePreview() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isPreview) {
                this.canvas.remove(obj);
            }
        });
        this.canvas.renderAll();
    }

    // Création d'objets
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
                    if (text && text.trim() !== '') {
                        obj = new fabric.Text(text, {
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
            console.log('Erreur lors de la création:', error);
        } finally {
            setTimeout(() => {
                this.creatingObject = false;
            }, 200);
        }
    }

    // Éléments architecturaux prédéfinis
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

        return new fabric.Group([doorFrame, handle], {
            left: x,
            top: y,
            opacity: opacity,
            type: 'door'
        });
    }

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

        return new fabric.Group([frame, cross], {
            left: x,
            top: y,
            opacity: opacity,
            type: 'window'
        });
    }

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

        return new fabric.Group(steps, {
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            opacity: opacity,
            type: 'stairs'
        });
    }

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

        return new fabric.Group([cabin, door1, door2, buttons, symbol], {
            left: x,
            top: y,
            opacity: opacity,
            type: 'elevator'
        });
    }

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

        return new fabric.Group([voile, ...hatches], {
            type: 'voile'
        });
    }

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

        return new fabric.Group([conduit, elecSymbol, plumbSymbol], {
            type: 'gaine'
        });
    }

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

        return new fabric.Group([room, equipment1, equipment2, equipment3, label], {
            left: x,
            top: y,
            opacity: opacity,
            type: 'tech-space'
        });
    }

    // Fonction gomme
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

    hideEraserIndicator() {
        const indicator = this.canvas.getObjects().find(obj => obj.isEraserIndicator);
        if (indicator) {
            this.canvas.remove(indicator);
            this.canvas.renderAll();
        }
    }

    isPointNearObject(x, y, obj, tolerance) {
        const objBounds = obj.getBoundingRect();
        return (x >= objBounds.left - tolerance && 
                x <= objBounds.left + objBounds.width + tolerance &&
                y >= objBounds.top - tolerance && 
                y <= objBounds.top + objBounds.height + tolerance);
    }

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
            this.canvas.remove(lineObj);
        }
    }

    // Utilitaires
    snapToGrid(value) {
        return this.snapEnabled ? Math.round(value / this.gridSize) * this.gridSize : value;
    }

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

    drawGrid() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isGrid) {
                this.canvas.remove(obj);
            }
        });

        const gridToggle = document.getElementById('gridToggle');
        if (!gridToggle || !gridToggle.checked) return;

        const gridLines = [];

        for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
            gridLines.push(new fabric.Line([i, 0, i, this.canvas.height], {
                stroke: '#e0e0e0',
                strokeWidth: 1,
                selectable: false,
                evented: false,
                isGrid: true
            }));
        }

        for (let i = 0; i <= this.canvas.height; i += this.gridSize) {
            gridLines.push(new fabric.Line([0, i, this.canvas.width, i], {
                stroke: '#e0e0e0',
                strokeWidth: 1,
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

    // Gestion des propriétés
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
            console.log('Erreur lors de la mise à jour des propriétés:', error);
        }
    }

    updateStrokeWidth() {
        const strokeWidthInput = document.getElementById('strokeWidth');
        const strokeValue = document.getElementById('strokeValue');
        
        if (!strokeWidthInput) return;
        
        const value = strokeWidthInput.value;
        if (strokeValue) strokeValue.textContent = value;
        this.updateProperties();
    }

    updateOpacity() {
        const opacityInput = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacityValue');
        
        if (!opacityInput) return;
        
        const value = opacityInput.value;
        if (opacityValue) opacityValue.textContent = Math.round(value * 100) + '%';
        this.updateProperties();
    }

    // Gestion de la sélection
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

    handleSelectionClear() {
        const selectionInfo = document.getElementById('selection');
        if (selectionInfo) {
            selectionInfo.textContent = 'Aucune sélection';
        }
    }

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
            console.log('Erreur lors de la mise à jour des propriétés:', error);
        }
    }

    // Paramètres
    toggleGrid() {
        this.drawGrid();
    }

    toggleSnap() {
        this.snapEnabled = document.getElementById('snapToggle')?.checked ?? true;
        console.log('Accrochage:', this.snapEnabled ? 'activé' : 'désactivé');
    }

    toggleAutoSelect() {
        this.autoSelectAfterDraw = document.getElementById('autoSelectToggle')?.checked ?? true;
        console.log('Retour auto à la sélection:', this.autoSelectAfterDraw ? 'activé' : 'désactivé');
    }

    updateZoom() {
        const zoomSlider = document.getElementById('zoomSlider');
        if (!zoomSlider) return;
        
        const zoom = parseFloat(zoomSlider.value);
        this.canvas.setZoom(zoom);
        
        const zoomValue = document.getElementById('zoomValue');
        const zoomInfo = document.getElementById('zoomInfo');
        
        if (zoomValue) zoomValue.textContent = Math.round(zoom * 100) + '%';
        if (zoomInfo) zoomInfo.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    }

    // Historique
    saveState() {
        try {
            const objectsToSave = this.canvas.getObjects().filter(obj => 
                !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
            );
            
            const cleanObjects = objectsToSave.map(obj => {
                const objData = obj.toObject();
                delete objData.textAlign;
                delete objData.textBaseline;
                return objData;
            });
            
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
            console.log('Erreur lors de la sauvegarde:', error);
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            try {
                this.historyIndex--;
                const state = JSON.parse(this.history[this.historyIndex]);
                
                const gridObjects = this.canvas.getObjects().filter(obj => obj.isGrid);
                this.canvas.clear();
                
                gridObjects.forEach(grid => this.canvas.add(grid));
                
                if (state.objects && state.objects.length > 0) {
                    state.objects.forEach(objData => {
                        try {
                            fabric.util.enlivenObjects([objData], (objects) => {
                                objects.forEach(obj => {
                                    if (obj && typeof obj === 'object') {
                                        this.canvas.add(obj);
                                    }
                                });
                                this.canvas.renderAll();
                            });
                        } catch (objError) {
                            console.log('Erreur lors de la restauration d\'un objet:', objError);
                        }
                    });
                }
                
                this.canvas.backgroundColor = '#f8f9fa';
                this.updateObjectCount();
            } catch (error) {
                console.log('Erreur lors de l\'annulation:', error);
            }
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            try {
                this.historyIndex++;
                const state = JSON.parse(this.history[this.historyIndex]);
                
                const gridObjects = this.canvas.getObjects().filter(obj => obj.isGrid);
                this.canvas.clear();
                
                gridObjects.forEach(grid => this.canvas.add(grid));
                
                if (state.objects && state.objects.length > 0) {
                    state.objects.forEach(objData => {
                        try {
                            fabric.util.enlivenObjects([objData], (objects) => {
                                objects.forEach(obj => {
                                    if (obj && typeof obj === 'object') {
                                        this.canvas.add(obj);
                                    }
                                });
                                this.canvas.renderAll();
                            });
                        } catch (objError) {
                            console.log('Erreur lors de la restauration d\'un objet:', objError);
                        }
                    });
                }
                
                this.canvas.backgroundColor = '#f8f9fa';
                this.updateObjectCount();
            } catch (error) {
                console.log('Erreur lors de la restauration:', error);
            }
        }
    }

    // Actions
    clearCanvas() {
        if (confirm('Effacer tout le plan ?')) {
            this.canvas.clear();
            this.canvas.backgroundColor = '#f8f9fa';
            this.drawGrid();
            this.saveState();
            this.updateObjectCount();
        }
    }

    saveProject() {
        try {
            const cleanObjects = this.canvas.getObjects().filter(obj => 
                !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
            );
            
            const safeObjects = cleanObjects.map(obj => {
                const objData = obj.toObject();
                delete objData.textAlign;
                delete objData.textBaseline;
                return objData;
            });
            
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
            console.log('Erreur lors de la sauvegarde du projet:', error);
            alert('Erreur lors de la sauvegarde du projet');
        }
    }

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
                            projectData.canvas.objects.forEach(objData => {
                                try {
                                    if (objData.textAlign) delete objData.textAlign;
                                    if (objData.textBaseline) delete objData.textBaseline;
                                    
                                    fabric.util.enlivenObjects([objData], (objects) => {
                                        objects.forEach(obj => {
                                            if (obj && typeof obj === 'object') {
                                                this.canvas.add(obj);
                                            }
                                        });
                                        this.canvas.renderAll();
                                    });
                                } catch (objError) {
                                    console.log('Erreur lors du chargement d\'un objet:', objError);
                                }
                            });
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
            console.log('Erreur lors de l\'export:', error);
            alert('Erreur lors de l\'export de l\'image');
        }
    }

    // Interface
    updateObjectCount() {
        const objects = this.canvas.getObjects().filter(obj => 
            !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
        );
        const objectCount = document.getElementById('objectCount');
        if (objectCount) {
            objectCount.textContent = `Objets: ${objects.length}`;
        }
    }

    updateUI() {
        this.updateObjectCount();
        
        const zoomValue = document.getElementById('zoomValue');
        const strokeValue = document.getElementById('strokeValue');
        const opacityValue = document.getElementById('opacityValue');
        
        if (zoomValue) zoomValue.textContent = '100%';
        if (strokeValue) strokeValue.textContent = '2';
        if (opacityValue) opacityValue.textContent = '100%';
    }

    // Raccourcis clavier
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