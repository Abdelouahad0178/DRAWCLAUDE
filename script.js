class ArchitectApp {
    constructor() {
        this.canvas = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.lastPosX = 0;
        this.lastPosY = 0;
        this.gridSize = 20;
        this.history = [];
        this.historyIndex = -1;
        this.clipboard = null;
        this.hasUnsavedChanges = false;
        this.autoSaveInterval = null;
        this.unitSystem = 'px';
        this.pixelsPerUnit = { px: 1, cm: 37.8, m: 3780 };
        
        // Calques
        this.layers = {
            structure: { visible: true, locked: false, objects: [] },
            furniture: { visible: true, locked: false, objects: [] },
            dimensions: { visible: true, locked: false, objects: [] }
        };
        this.currentLayer = 'structure';
        
        // Paramètres
        this.snapEnabled = true;
        this.guidesEnabled = true;
        this.guides = { horizontal: [], vertical: [] };
        this.theme = 'light';
        
        // Catégories de mobilier
        this.furnitureCategories = {
            salon: [
                { id: 'sofa', icon: '🛋️', name: 'Canapé' },
                { id: 'armchair', icon: '🪑', name: 'Fauteuil' },
                { id: 'coffee-table', icon: '🪵', name: 'Table basse' },
                { id: 'tv-stand', icon: '📺', name: 'Meuble TV' },
                { id: 'bookshelf', icon: '📚', name: 'Bibliothèque' }
            ],
            chambre: [
                { id: 'bed', icon: '🛏️', name: 'Lit' },
                { id: 'wardrobe', icon: '🚪', name: 'Armoire' },
                { id: 'nightstand', icon: '🗄️', name: 'Table de nuit' },
                { id: 'dresser', icon: '🗃️', name: 'Commode' }
            ],
            cuisine: [
                { id: 'fridge', icon: '🧊', name: 'Réfrigérateur' },
                { id: 'stove', icon: '🔥', name: 'Cuisinière' },
                { id: 'dishwasher', icon: '🍽️', name: 'Lave-vaisselle' },
                { id: 'kitchen-island', icon: '🏝️', name: 'Îlot' }
            ],
            bureau: [
                { id: 'desk', icon: '🖥️', name: 'Bureau' },
                { id: 'office-chair', icon: '🪑', name: 'Chaise bureau' },
                { id: 'filing-cabinet', icon: '🗄️', name: 'Classeur' }
            ]
        };
        
        this.init();
    }

    init() {
        this.showLoader();
        
        setTimeout(() => {
            this.initCanvas();
            this.initEventListeners();
            this.initUI();
            this.drawGrid();
            this.initRulers();
            this.loadTheme();
            this.saveState();
            this.startAutoSave();
            this.hideLoader();
            
            console.log('🏛️ ArchiDesign Pro initialisé avec succès!');
            this.showToast('ArchiDesign Pro prêt!', 'success');
        }, 1000);
    }

    // ========================================
    // Gestion du Canvas
    // ========================================
    
    initCanvas() {
        this.canvas = new fabric.Canvas('canvas', {
            backgroundColor: '#f8f9fa',
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: false,
            enableRetinaScaling: true
        });

        this.canvas.selection = this.currentTool === 'select';
    }

    // ========================================
    // Événements
    // ========================================
    
    initEventListeners() {
        // Outils
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolBtn = e.target.closest('.tool-btn');
                if (toolBtn) {
                    this.selectTool(toolBtn.dataset.tool);
                }
            });
        });

        // Propriétés
        document.getElementById('strokeColor').addEventListener('change', this.updateProperties.bind(this));
        document.getElementById('fillColor').addEventListener('change', this.updateProperties.bind(this));
        document.getElementById('strokeWidth').addEventListener('change', this.updateProperties.bind(this));
        document.getElementById('opacity').addEventListener('input', this.updateOpacity.bind(this));
        document.getElementById('fontSize').addEventListener('change', this.updateProperties.bind(this));
        document.getElementById('rotation').addEventListener('change', this.updateRotation.bind(this));

        // Paramètres
        document.getElementById('gridToggle').addEventListener('change', this.toggleGrid.bind(this));
        document.getElementById('snapToggle').addEventListener('change', this.toggleSnap.bind(this));
        document.getElementById('guidesToggle').addEventListener('change', this.toggleGuides.bind(this));
        document.getElementById('rulerToggle').addEventListener('change', this.toggleRulers.bind(this));
        document.getElementById('zoomSlider').addEventListener('input', this.updateZoom.bind(this));
        document.getElementById('gridSize').addEventListener('change', this.updateGridSize.bind(this));
        document.getElementById('unitSystem').addEventListener('change', this.updateUnitSystem.bind(this));

        // Contrôles
        document.getElementById('newProject').addEventListener('click', this.newProject.bind(this));
        document.getElementById('saveProject').addEventListener('click', this.saveProject.bind(this));
        document.getElementById('loadProject').addEventListener('click', this.loadProject.bind(this));
        document.getElementById('templateBtn').addEventListener('click', this.showTemplateModal.bind(this));
        document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));
        document.getElementById('redoBtn').addEventListener('click', this.redo.bind(this));
        document.getElementById('copyBtn').addEventListener('click', this.copy.bind(this));
        document.getElementById('pasteBtn').addEventListener('click', this.paste.bind(this));
        document.getElementById('duplicateBtn').addEventListener('click', this.duplicate.bind(this));
        document.getElementById('groupBtn').addEventListener('click', this.groupObjects.bind(this));
        document.getElementById('ungroupBtn').addEventListener('click', this.ungroupObjects.bind(this));
        document.getElementById('alignBtn').addEventListener('click', this.showAlignModal.bind(this));
        document.getElementById('distributeBtn').addEventListener('click', this.showAlignModal.bind(this));
        document.getElementById('exportPNG').addEventListener('click', this.exportPNG.bind(this));
        document.getElementById('exportSVG').addEventListener('click', this.exportSVG.bind(this));
        document.getElementById('exportPDF').addEventListener('click', this.exportPDF.bind(this));
        document.getElementById('exportDXF').addEventListener('click', this.exportDXF.bind(this));
        document.getElementById('printBtn').addEventListener('click', this.print.bind(this));
        document.getElementById('zoomIn').addEventListener('click', this.zoomIn.bind(this));
        document.getElementById('zoomOut').addEventListener('click', this.zoomOut.bind(this));
        document.getElementById('zoomFit').addEventListener('click', this.zoomFit.bind(this));
        document.getElementById('zoom100').addEventListener('click', this.zoom100.bind(this));
        document.getElementById('clearCanvas').addEventListener('click', this.clearCanvas.bind(this));

        // Calques
        document.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const layerName = item.dataset.layer;
                
                if (action === 'toggle-visibility') {
                    this.toggleLayerVisibility(layerName);
                } else if (action === 'toggle-lock') {
                    this.toggleLayerLock(layerName);
                } else {
                    this.selectLayer(layerName);
                }
            });
        });

        document.querySelector('.add-layer-btn').addEventListener('click', this.addNewLayer.bind(this));

        // Modales
        document.getElementById('furnitureModal').addEventListener('click', this.handleModalClick.bind(this));
        document.getElementById('templateModal').addEventListener('click', this.handleModalClick.bind(this));
        document.getElementById('alignModal').addEventListener('click', this.handleModalClick.bind(this));
        document.getElementById('helpModal').addEventListener('click', this.handleModalClick.bind(this));
        
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', this.closeAllModals.bind(this));
        });

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showFurnitureCategory(e.target.dataset.category));
        });

        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const template = e.target.closest('.template-item').dataset.template;
                this.loadTemplate(template);
            });
        });

        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.alignObjects(e.target.dataset.align));
        });

        document.querySelectorAll('.distribute-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.distributeObjects(e.target.dataset.distribute));
        });

        document.addEventListener('contextmenu', this.showContextMenu.bind(this));
        document.addEventListener('click', this.hideContextMenu.bind(this));
        
        document.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleContextMenuAction(e.target.dataset.action));
        });

        document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));
        document.getElementById('helpBtn').addEventListener('click', this.showHelpModal.bind(this));
        document.getElementById('mobileMenuToggle').addEventListener('click', this.toggleMobileMenu.bind(this));

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        // Événements du canvas
        this.canvas.on('mouse:down', this.onMouseDown.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
        this.canvas.on('mouse:wheel', this.onMouseWheel.bind(this));
        this.canvas.on('selection:created', this.onSelectionCreated.bind(this));
        this.canvas.on('selection:updated', this.onSelectionUpdated.bind(this));
        this.canvas.on('selection:cleared', this.onSelectionCleared.bind(this));
        this.canvas.on('object:added', this.onObjectAdded.bind(this));
        this.canvas.on('object:removed', this.onObjectRemoved.bind(this));
        this.canvas.on('object:modified', this.onObjectModified.bind(this));
        this.canvas.on('object:rotating', this.onObjectRotating.bind(this));
        this.canvas.on('object:scaling', this.onObjectScaling.bind(this));
        this.canvas.on('object:moving', this.onObjectMoving.bind(this));
    }

    // ========================================
    // Gestion des outils
    // ========================================
    
    selectTool(tool) {
        if (!tool) return;
        
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const btn = document.querySelector(`[data-tool="${tool}"]`);
        if (btn) {
            btn.classList.add('active');
            this.currentTool = tool;
        }

        if (tool === 'select') {
            this.canvas.defaultCursor = 'default';
            this.canvas.selection = true;
            this.canvas.forEachObject(obj => {
                obj.selectable = true;
                obj.evented = true;
            });
        } else if (tool === 'pan') {
            this.canvas.defaultCursor = 'grab';
            this.canvas.selection = false;
            this.canvas.forEachObject(obj => {
                obj.selectable = false;
                obj.evented = false;
            });
        } else {
            this.canvas.defaultCursor = 'crosshair';
            this.canvas.selection = false;
            this.canvas.discardActiveObject();
            this.canvas.forEachObject(obj => {
                obj.selectable = false;
                obj.evented = false;
            });
        }
        
        if (tool === 'furniture') {
            this.showFurnitureModal();
        }

        this.canvas.renderAll();
    }

    // ========================================
    // Événements de souris
    // ========================================
    
    onMouseDown(e) {
        const pointer = this.canvas.getPointer(e.e);
        
        if (this.currentTool === 'pan' || (e.e.spaceKey && this.currentTool !== 'select')) {
            this.isPanning = true;
            this.lastPosX = e.e.clientX;
            this.lastPosY = e.e.clientY;
            this.canvas.defaultCursor = 'grabbing';
            return;
        }
        
        if (this.currentTool === 'select') return;
        
        this.startX = this.snapEnabled ? this.snapToGrid(pointer.x) : pointer.x;
        this.startY = this.snapEnabled ? this.snapToGrid(pointer.y) : pointer.y;
        this.isDrawing = true;
        
        if (this.guidesEnabled) {
            this.showGuides(this.startX, this.startY);
        }
    }

    onMouseMove(e) {
        const pointer = this.canvas.getPointer(e.e);
        
        const x = Math.round(pointer.x);
        const y = Math.round(pointer.y);
        const unitX = this.convertToUnit(x);
        const unitY = this.convertToUnit(y);
        document.getElementById('cursorPosition').textContent = 
            `X: ${unitX}${this.unitSystem}, Y: ${unitY}${this.unitSystem}`;
        
        if (this.isPanning) {
            const deltaX = e.e.clientX - this.lastPosX;
            const deltaY = e.e.clientY - this.lastPosY;
            
            this.canvas.relativePan({ x: deltaX, y: deltaY });
            this.lastPosX = e.e.clientX;
            this.lastPosY = e.e.clientY;
            return;
        }
        
        if (!this.isDrawing || this.currentTool === 'select') return;
        
        const endX = this.snapEnabled ? this.snapToGrid(pointer.x) : pointer.x;
        const endY = this.snapEnabled ? this.snapToGrid(pointer.y) : pointer.y;
        
        let constrainedEndX = endX;
        let constrainedEndY = endY;
        
        if (e.e.shiftKey) {
            const deltaX = Math.abs(endX - this.startX);
            const deltaY = Math.abs(endY - this.startY);
            const maxDelta = Math.max(deltaX, deltaY);
            
            constrainedEndX = this.startX + (endX > this.startX ? maxDelta : -maxDelta);
            constrainedEndY = this.startY + (endY > this.startY ? maxDelta : -maxDelta);
        }
        
        this.showPreview(this.startX, this.startY, constrainedEndX, constrainedEndY);
        this.showDistanceWhileDrawing(this.startX, this.startY, constrainedEndX, constrainedEndY);
        
        if (this.guidesEnabled) {
            this.updateGuides(constrainedEndX, constrainedEndY);
        }
    }

    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.defaultCursor = this.currentTool === 'pan' ? 'grab' : 'default';
            return;
        }
        
        if (!this.isDrawing || this.currentTool === 'select') return;
        
        const pointer = this.canvas.getPointer(e.e);
        let endX = this.snapEnabled ? this.snapToGrid(pointer.x) : pointer.x;
        let endY = this.snapEnabled ? this.snapToGrid(pointer.y) : pointer.y;
        
        if (e.e.shiftKey) {
            const deltaX = Math.abs(endX - this.startX);
            const deltaY = Math.abs(endY - this.startY);
            const maxDelta = Math.max(deltaX, deltaY);
            
            endX = this.startX + (endX > this.startX ? maxDelta : -maxDelta);
            endY = this.startY + (endY > this.startY ? maxDelta : -maxDelta);
        }
        
        const minDistance = 5;
        const distance = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2));
        
        if (distance > minDistance || ['column', 'door', 'window', 'text'].includes(this.currentTool)) {
            this.createObject(this.currentTool, this.startX, this.startY, endX, endY);
        }
        
        this.isDrawing = false;
        this.clearPreview();
        this.hideGuides();
        this.hideDistanceTooltip();
    }

    onMouseWheel(e) {
        e.e.preventDefault();
        e.e.stopPropagation();
        
        const delta = e.e.deltaY;
        let zoom = this.canvas.getZoom();
        zoom *= 0.999 ** delta;
        
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;
        
        this.canvas.zoomToPoint({ x: e.e.offsetX, y: e.e.offsetY }, zoom);
        this.updateZoomDisplay();
        
        document.getElementById('zoomSlider').value = zoom;
    }

    // ========================================
    // Création d'objets
    // ========================================
    
    createObject(tool, x1, y1, x2, y2) {
        const strokeColor = document.getElementById('strokeColor').value;
        const fillColor = document.getElementById('fillColor').value;
        const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
        const opacity = parseFloat(document.getElementById('opacity').value);
        const fontSize = parseInt(document.getElementById('fontSize').value);

        let obj = null;

        switch(tool) {
            case 'wall':
                obj = this.createWall(x1, y1, x2, y2, strokeColor, strokeWidth, opacity);
                break;
            case 'load-wall':
                obj = this.createLoadWall(x1, y1, x2, y2, strokeColor, strokeWidth, opacity);
                break;
            case 'column':
                obj = this.createColumn(x1, y1, fillColor, strokeColor, strokeWidth, opacity);
                break;
            case 'beam':
                obj = this.createBeam(x1, y1, x2, y2, fillColor, strokeColor, strokeWidth, opacity);
                break;
            case 'door':
                obj = this.createDoor(x1, y1, opacity);
                break;
            case 'sliding-door':
                obj = this.createSlidingDoor(x1, y1, opacity);
                break;
            case 'window':
                obj = this.createWindow(x1, y1, opacity);
                break;
            case 'bay-window':
                obj = this.createBayWindow(x1, y1, opacity);
                break;
            case 'kitchen':
                obj = this.createKitchen(x1, y1, opacity);
                break;
            case 'bathroom':
                obj = this.createBathroom(x1, y1, opacity);
                break;
            case 'stairs':
                obj = this.createStairs(x1, y1, x2, y2, opacity);
                break;
            case 'rectangle':
                obj = this.createRectangle(x1, y1, x2, y2, fillColor, strokeColor, strokeWidth, opacity);
                break;
            case 'circle':
                obj = this.createCircle(x1, y1, x2, y2, fillColor, strokeColor, strokeWidth, opacity);
                break;
            case 'polygon':
                const sides = parseInt(prompt('Nombre de côtés:', '6')) || 6;
                obj = this.createPolygon(x1, y1, x2, y2, sides, fillColor, strokeColor, strokeWidth, opacity);
                break;
            case 'line':
                obj = this.createLine(x1, y1, x2, y2, strokeColor, strokeWidth, opacity);
                break;
            case 'text':
                obj = this.createText(x1, y1, strokeColor, fontSize, opacity);
                break;
            case 'dimension':
                obj = this.createDimension(x1, y1, x2, y2, strokeColor, opacity);
                break;
            case 'arrow':
                obj = this.createArrow(x1, y1, x2, y2, strokeColor, strokeWidth, opacity);
                break;
            case 'area':
                obj = this.createArea(x1, y1, x2, y2, fillColor, strokeColor, opacity);
                break;
        }

        if (obj) {
            obj.layer = this.currentLayer;
            this.canvas.add(obj);
            this.layers[this.currentLayer].objects.push(obj);
            this.canvas.renderAll();
            this.selectTool('select');
            this.saveState();
        }
    }

    createWall(x1, y1, x2, y2, strokeColor, strokeWidth, opacity) {
        return new fabric.Line([x1, y1, x2, y2], {
            stroke: strokeColor,
            strokeWidth: strokeWidth * 2,
            opacity: opacity,
            selectable: true,
            type: 'wall',
            layer: this.currentLayer
        });
    }

    createLoadWall(x1, y1, x2, y2, strokeColor, strokeWidth, opacity) {
        return new fabric.Line([x1, y1, x2, y2], {
            stroke: strokeColor,
            strokeWidth: strokeWidth * 3,
            strokeDashArray: [10, 5],
            opacity: opacity,
            selectable: true,
            type: 'load-wall',
            layer: this.currentLayer
        });
    }

    createColumn(x1, y1, fillColor, strokeColor, strokeWidth, opacity) {
        return new fabric.Circle({
            left: x1 - 20,
            top: y1 - 20,
            radius: 20,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            selectable: true,
            type: 'column',
            layer: this.currentLayer
        });
    }

    createBeam(x1, y1, x2, y2, fillColor, strokeColor, strokeWidth, opacity) {
        return new fabric.Line([x1, y1, x2, y2], {
            stroke: strokeColor,
            strokeWidth: strokeWidth * 1.5,
            strokeDashArray: [5, 5],
            opacity: opacity,
            selectable: true,
            type: 'beam',
            layer: this.currentLayer
        });
    }

    createDoor(x1, y1, opacity) {
        return new fabric.Rect({
            left: x1 - 30,
            top: y1 - 15,
            width: 60,
            height: 30,
            fill: 'transparent',
            stroke: '#333333',
            strokeWidth: 2,
            opacity: opacity,
            selectable: true,
            type: 'door',
            layer: this.currentLayer
        });
    }

    createSlidingDoor(x1, y1, opacity) {
        return new fabric.Rect({
            left: x1 - 40,
            top: y1 - 10,
            width: 80,
            height: 20,
            fill: 'transparent',
            stroke: '#333333',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            opacity: opacity,
            selectable: true,
            type: 'sliding-door',
            layer: this.currentLayer
        });
    }

    createWindow(x1, y1, opacity) {
        return new fabric.Rect({
            left: x1 - 50,
            top: y1 - 10,
            width: 100,
            height: 20,
            fill: '#87CEEB',
            stroke: '#333333',
            strokeWidth: 2,
            opacity: opacity,
            selectable: true,
            type: 'window',
            layer: this.currentLayer
        });
    }

    createBayWindow(x1, y1, opacity) {
        return new fabric.Rect({
            left: x1 - 75,
            top: y1 - 15,
            width: 150,
            height: 30,
            fill: '#87CEEB',
            stroke: '#333333',
            strokeWidth: 2,
            opacity: opacity,
            selectable: true,
            type: 'bay-window',
            layer: this.currentLayer
        });
    }

    createKitchen(x1, y1, opacity) {
        return new fabric.Rect({
            left: x1 - 50,
            top: y1 - 25,
            width: 100,
            height: 50,
            fill: '#F5F5DC',
            stroke: '#333333',
            strokeWidth: 2,
            opacity: opacity,
            selectable: true,
            type: 'kitchen',
            layer: this.currentLayer
        });
    }

    createBathroom(x1, y1, opacity) {
        return new fabric.Rect({
            left: x1 - 40,
            top: y1 - 40,
            width: 80,
            height: 80,
            fill: '#E0FFFF',
            stroke: '#333333',
            strokeWidth: 2,
            opacity: opacity,
            selectable: true,
            type: 'bathroom',
            layer: this.currentLayer
        });
    }

    createStairs(x1, y1, x2, y2, opacity) {
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return new fabric.Rect({
            left: x1,
            top: y1,
            width: width,
            height: height,
            fill: 'transparent',
            stroke: '#333333',
            strokeWidth: 2,
            strokeDashArray: [10, 10],
            opacity: opacity,
            selectable: true,
            type: 'stairs',
            layer: this.currentLayer
        });
    }

    createRectangle(x1, y1, x2, y2, fillColor, strokeColor, strokeWidth, opacity) {
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return new fabric.Rect({
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: width,
            height: height,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            selectable: true,
            type: 'rectangle',
            layer: this.currentLayer
        });
    }

    createCircle(x1, y1, x2, y2, fillColor, strokeColor, strokeWidth, opacity) {
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
        return new fabric.Circle({
            left: x1 - radius,
            top: y1 - radius,
            radius: radius,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            selectable: true,
            type: 'circle',
            layer: this.currentLayer
        });
    }

    createPolygon(x1, y1, x2, y2, sides, fillColor, strokeColor, strokeWidth, opacity) {
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
        const points = [];
        
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            points.push({
                x: x1 + radius * Math.cos(angle),
                y: y1 + radius * Math.sin(angle)
            });
        }
        
        return new fabric.Polygon(points, {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            selectable: true,
            type: 'polygon',
            layer: this.currentLayer
        });
    }

    createLine(x1, y1, x2, y2, strokeColor, strokeWidth, opacity) {
        return new fabric.Line([x1, y1, x2, y2], {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            selectable: true,
            type: 'line',
            layer: this.currentLayer
        });
    }

    createText(x1, y1, strokeColor, fontSize, opacity) {
        return new fabric.Textbox('Texte', {
            left: x1,
            top: y1,
            fontSize: fontSize,
            fill: strokeColor,
            opacity: opacity,
            selectable: true,
            type: 'text',
            layer: this.currentLayer
        });
    }

    createDimension(x1, y1, x2, y2, strokeColor, opacity) {
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const text = new fabric.Text(`${this.convertToUnit(distance).toFixed(2)}${this.unitSystem}`, {
            left: (x1 + x2) / 2,
            top: (y1 + y2) / 2 - 20,
            fontSize: 14,
            fill: strokeColor,
            opacity: opacity
        });
        const line = new fabric.Line([x1, y1, x2, y2], {
            stroke: strokeColor,
            strokeWidth: 1,
            opacity: opacity
        });
        return new fabric.Group([line, text], {
            selectable: true,
            type: 'dimension',
            layer: this.currentLayer
        });
    }

    createArrow(x1, y1, x2, y2, strokeColor, strokeWidth, opacity) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headSize = 10;
        const headPoints = [
            { x: x2, y: y2 },
            { x: x2 - headSize * Math.cos(angle - Math.PI / 6), y: y2 - headSize * Math.sin(angle - Math.PI / 6) },
            { x: x2 - headSize * Math.cos(angle + Math.PI / 6), y: y2 - headSize * Math.sin(angle + Math.PI / 6) }
        ];
        return new fabric.Group([
            new fabric.Line([x1, y1, x2, y2], { stroke: strokeColor, strokeWidth: strokeWidth, opacity: opacity }),
            new fabric.Polygon(headPoints, { fill: strokeColor, stroke: strokeColor, strokeWidth: strokeWidth, opacity: opacity })
        ], {
            selectable: true,
            type: 'arrow',
            layer: this.currentLayer
        });
    }

    createArea(x1, y1, x2, y2, fillColor, strokeColor, opacity) {
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        const area = this.convertToUnit(width) * this.convertToUnit(height);
        const rect = new fabric.Rect({
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: width,
            height: height,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 1,
            opacity: opacity
        });
        const text = new fabric.Text(`${area.toFixed(2)} ${this.unitSystem}²`, {
            left: (x1 + x2) / 2,
            top: (y1 + y2) / 2,
            fontSize: 14,
            fill: strokeColor,
            opacity: opacity
        });
        return new fabric.Group([rect, text], {
            selectable: true,
            type: 'area',
            layer: this.currentLayer
        });
    }

    // ========================================
    // Gestion des calques
    // ========================================
    
    selectLayer(layerName) {
        if (!this.layers[layerName]) return;

        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-layer="${layerName}"]`).classList.add('active');

        this.currentLayer = layerName;
        document.getElementById('layerStatus').textContent = `Calque: ${this.getLayerDisplayName(layerName)}`;
    }

    toggleLayerVisibility(layerName) {
        const layer = this.layers[layerName];
        layer.visible = !layer.visible;
        
        const layerItem = document.querySelector(`[data-layer="${layerName}"]`);
        const visibilityIcon = layerItem.querySelector('.layer-visibility');
        visibilityIcon.textContent = layer.visible ? '👁️' : '👁️‍🗨️';
        
        this.canvas.getObjects().forEach(obj => {
            if (obj.layer === layerName) {
                obj.visible = layer.visible;
                obj.selectable = layer.visible && !layer.locked;
            }
        });
        
        this.canvas.renderAll();
        this.showToast(`Calque ${layer.visible ? 'visible' : 'masqué'}`, 'info');
    }

    toggleLayerLock(layerName) {
        const layer = this.layers[layerName];
        layer.locked = !layer.locked;
        
        const layerItem = document.querySelector(`[data-layer="${layerName}"]`);
        const lockIcon = layerItem.querySelector('.layer-lock');
        lockIcon.textContent = layer.locked ? '🔒' : '🔓';
        
        this.canvas.getObjects().forEach(obj => {
            if (obj.layer === layerName) {
                obj.selectable = !layer.locked && layer.visible;
                obj.evented = !layer.locked;
            }
        });
        
        this.canvas.renderAll();
        this.showToast(`Calque ${layer.locked ? 'verrouillé' : 'déverrouillé'}`, 'info');
    }

    addNewLayer() {
        const layerName = prompt('Nom du nouveau calque:');
        if (layerName && !this.layers[layerName]) {
            this.layers[layerName] = { visible: true, locked: false, objects: [] };
            
            const layerPanel = document.querySelector('.layers-panel');
            const newLayerItem = document.createElement('div');
            newLayerItem.className = 'layer-item';
            newLayerItem.dataset.layer = layerName;
            newLayerItem.innerHTML = `
                <span class="layer-visibility" data-action="toggle-visibility">👁️</span>
                <span class="layer-name">${layerName}</span>
                <span class="layer-lock" data-action="toggle-lock">🔓</span>
            `;
            
            newLayerItem.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'toggle-visibility') {
                    this.toggleLayerVisibility(layerName);
                } else if (action === 'toggle-lock') {
                    this.toggleLayerLock(layerName);
                } else {
                    this.selectLayer(layerName);
                }
            });
            
            const addBtn = layerPanel.querySelector('.add-layer-btn');
            layerPanel.insertBefore(newLayerItem, addBtn);
            
            this.selectLayer(layerName);
            this.showToast('Nouveau calque créé', 'success');
        }
    }

    getLayerDisplayName(layerName) {
        const names = {
            structure: 'Structure',
            furniture: 'Mobilier',
            dimensions: 'Cotations'
        };
        return names[layerName] || layerName;
    }

    // ========================================
    // Grouper/Dégrouper
    // ========================================
    
    groupObjects() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.type === 'activeSelection') {
            const group = activeObject.toGroup();
            group.layer = this.currentLayer;
            this.canvas.requestRenderAll();
            this.saveState();
            this.showToast('Objets groupés', 'success');
        }
    }

    ungroupObjects() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.type === 'group') {
            activeObject.toActiveSelection();
            this.canvas.requestRenderAll();
            this.saveState();
            this.showToast('Groupe défait', 'success');
        }
    }

    // ========================================
    // Alignement et Distribution
    // ========================================
    
    alignObjects(alignment) {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'activeSelection') {
            this.showToast('Veuillez sélectionner plusieurs objets pour aligner', 'warning');
            return;
        }

        const objects = activeObject.getObjects();
        if (objects.length < 2) {
            this.showToast('Sélectionnez au moins deux objets pour aligner', 'warning');
            return;
        }

        const bounds = activeObject.getBoundingRect(true, true);

        objects.forEach(obj => {
            switch (alignment) {
                case 'left':
                    obj.set('left', bounds.left);
                    break;
                case 'center-h':
                    obj.set('left', bounds.left + (bounds.width - obj.getScaledWidth()) / 2);
                    break;
                case 'right':
                    obj.set('left', bounds.left + bounds.width - obj.getScaledWidth());
                    break;
                case 'top':
                    obj.set('top', bounds.top);
                    break;
                case 'center-v':
                    obj.set('top', bounds.top + (bounds.height - obj.getScaledHeight()) / 2);
                    break;
                case 'bottom':
                    obj.set('top', bounds.top + bounds.height - obj.getScaledHeight());
                    break;
            }
            obj.setCoords();
        });

        this.canvas.renderAll();
        this.saveState();
        this.showToast(`Objets alignés : ${alignment}`, 'success');
        this.closeAllModals();
    }

    distributeObjects(distribution) {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'activeSelection') {
            this.showToast('Veuillez sélectionner plusieurs objets pour distribuer', 'warning');
            return;
        }

        const objects = activeObject.getObjects();
        if (objects.length < 3) {
            this.showToast('Sélectionnez au moins trois objets pour distribuer', 'warning');
            return;
        }

        const sortedObjects = objects.slice().sort((a, b) => {
            const boundsA = a.getBoundingRect(true, true);
            const boundsB = b.getBoundingRect(true, true);
            return distribution === 'horizontal' 
                ? boundsA.left - boundsB.left 
                : boundsA.top - boundsB.top;
        });

        const bounds = activeObject.getBoundingRect(true, true);
        const firstObj = sortedObjects[0];
        const lastObj = sortedObjects[sortedObjects.length - 1];
        const firstBounds = firstObj.getBoundingRect(true, true);
        const lastBounds = lastObj.getBoundingRect(true, true);

        let totalWidth = 0;
        let totalHeight = 0;
        sortedObjects.forEach(obj => {
            const objBounds = obj.getBoundingRect(true, true);
            totalWidth += objBounds.width;
            totalHeight += objBounds.height;
        });

        const spaceX = distribution === 'horizontal' 
            ? (bounds.width - totalWidth) / (sortedObjects.length - 1)
            : 0;
        const spaceY = distribution === 'vertical' 
            ? (bounds.height - totalHeight) / (sortedObjects.length - 1)
            : 0;

        sortedObjects.forEach((obj, index) => {
            if (index === 0 || index === sortedObjects.length - 1) return;

            const prevObj = sortedObjects[index - 1];
            const prevBounds = prevObj.getBoundingRect(true, true);
            const objBounds = obj.getBoundingRect(true, true);

            if (distribution === 'horizontal') {
                obj.set('left', prevBounds.left + prevBounds.width + spaceX);
            } else {
                obj.set('top', prevBounds.top + prevBounds.height + spaceY);
            }
            obj.setCoords();
        });

        this.canvas.renderAll();
        this.saveState();
        this.showToast(`Objets distribués : ${distribution}`, 'success');
        this.closeAllModals();
    }

    // ========================================
    // Gestion des modales
    // ========================================
    
    showFurnitureModal() {
        this.showFurnitureCategory('salon');
        document.getElementById('furnitureModal').style.display = 'block';
    }

    showFurnitureCategory(category) {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        const grid = document.getElementById('furnitureGrid');
        grid.innerHTML = '';
        this.furnitureCategories[category].forEach(item => {
            const div = document.createElement('div');
            div.className = 'furniture-item';
            div.dataset.furnitureId = item.id;
            div.innerHTML = `
                <div class="furniture-icon">${item.icon}</div>
                <div class="furniture-name">${item.name}</div>
            `;
            grid.appendChild(div);
        });
    }

    handleModalClick(e) {
        const furnitureItem = e.target.closest('.furniture-item');
        if (furnitureItem) {
            const furnitureId = furnitureItem.dataset.furnitureId;
            this.addFurniture(furnitureId, this.startX, this.startY);
            this.closeAllModals();
        }

        const templateItem = e.target.closest('.template-item');
        if (templateItem) {
            const template = templateItem.dataset.template;
            this.loadTemplate(template);
        }
    }

    addFurniture(furnitureId, x, y) {
        let furniture = null;
        for (let category in this.furnitureCategories) {
            furniture = this.furnitureCategories[category].find(item => item.id === furnitureId);
            if (furniture) break;
        }
        if (!furniture) return;

        const obj = new fabric.Rect({
            left: x - 50,
            top: y - 50,
            width: 100,
            height: 100,
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 2,
            opacity: 1,
            selectable: true,
            type: `furniture-${furnitureId}`,
            layer: this.currentLayer
        });
        this.canvas.add(obj);
        this.layers[this.currentLayer].objects.push(obj);
        this.canvas.renderAll();
        this.saveState();
        this.showToast(`${furniture.name} ajouté`, 'success');
    }

    showTemplateModal() {
        document.getElementById('templateModal').style.display = 'block';
    }

    showAlignModal() {
        document.getElementById('alignModal').style.display = 'block';
    }

    showHelpModal() {
        document.getElementById('helpModal').style.display = 'block';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // ========================================
    // Templates
    // ========================================
    
    loadTemplate(template) {
        this.clearCanvas();
        switch (template) {
            case 'studio':
                this.createWall(100, 100, 300, 100, '#333333', 5, 1);
                this.createWall(300, 100, 300, 300, '#333333', 5, 1);
                this.createWall(300, 300, 100, 300, '#333333', 5, 1);
                this.createWall(100, 300, 100, 100, '#333333', 5, 1);
                this.createDoor(200, 300, 1);
                this.addFurniture('sofa', 150, 150);
                break;
            case 't2':
                this.createWall(100, 100, 400, 100, '#333333', 5, 1);
                this.createWall(400, 100, 400, 400, '#333333', 5, 1);
                this.createWall(400, 400, 100, 400, '#333333', 5, 1);
                this.createWall(100, 400, 100, 100, '#333333', 5, 1);
                this.createDoor(250, 400, 1);
                this.addFurniture('bed', 200, 200);
                break;
            // Ajouter d'autres templates si nécessaire
        }
        this.canvas.renderAll();
        this.saveState();
        this.closeAllModals();
        this.showToast(`Template ${template} chargé`, 'success');
    }

    // ========================================
    // Historique
    // ========================================
    
    saveState() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        const canvasState = JSON.stringify(this.canvas);
        this.history.push(canvasState);
        this.historyIndex++;
        this.hasUnsavedChanges = true;
        this.updateSaveIndicator();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
                this.canvas.renderAll();
                this.updateLayers();
            });
            this.showToast('Action annulée', 'info');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
                this.canvas.renderAll();
                this.updateLayers();
            });
            this.showToast('Action refaite', 'info');
        }
    }

    updateLayers() {
        Object.keys(this.layers).forEach(layerName => {
            this.layers[layerName].objects = this.canvas.getObjects().filter(obj => obj.layer === layerName);
        });
    }

    // ========================================
    // Exportation
    // ========================================
    
    exportPNG() {
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            quality: 1
        });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${document.getElementById('projectName').value || 'plan'}.png`;
        link.click();
        this.showToast('Plan exporté en PNG', 'success');
    }

    exportSVG() {
        const svg = this.canvas.toSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${document.getElementById('projectName').value || 'plan'}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Plan exporté en SVG', 'success');
    }

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [this.canvas.width, this.canvas.height]
        });

        const imgData = this.canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, this.canvas.width, this.canvas.height);
        doc.save(`${document.getElementById('projectName').value || 'plan'}.pdf`);
        this.showToast('Plan exporté en PDF', 'success');
    }

    exportDXF() {
        this.showToast('Exportation DXF non implémentée', 'warning');
        // Note : L'exportation DXF nécessite une bibliothèque comme dxf-writer
    }

    print() {
        window.print();
        this.showToast('Impression lancée', 'info');
    }

    // ========================================
    // Gestion du projet
    // ========================================
    
    newProject() {
        if (this.hasUnsavedChanges && !confirm('Créer un nouveau projet ? Les modifications non sauvegardées seront perdues.')) {
            return;
        }
        this.clearCanvas();
        this.history = [];
        this.historyIndex = -1;
        this.saveState();
        this.showToast('Nouveau projet créé', 'success');
    }

    saveProject() {
        const data = JSON.stringify(this.canvas);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${document.getElementById('projectName').value || 'plan'}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.hasUnsavedChanges = false;
        this.updateSaveIndicator();
        this.showToast('Projet sauvegardé', 'success');
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                this.canvas.loadFromJSON(event.target.result, () => {
                    this.canvas.renderAll();
                    this.updateLayers();
                    this.saveState();
                    this.showToast('Projet chargé', 'success');
                });
            };
            reader.readAsText(file);
        };
        input.click();
    }

    clearCanvas() {
        this.canvas.clear();
        this.canvas.backgroundColor = '#f8f9fa';
        Object.keys(this.layers).forEach(layerName => {
            this.layers[layerName].objects = [];
        });
        this.canvas.renderAll();
    }

    // ========================================
    // Interface et paramètres
    // ========================================
    
    initUI() {
        this.updateZoomDisplay();
        this.updateSaveIndicator();
        this.updateObjectCount();
    }

    updateZoomDisplay() {
        const zoom = this.canvas.getZoom();
        document.getElementById('zoomValue').textContent = `${Math.round(zoom * 100)}%`;
        document.getElementById('zoomStatus').textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    }

    updateSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        indicator.textContent = this.hasUnsavedChanges ? '💾 Non sauvegardé' : '💾 Sauvegardé';
    }

    updateObjectCount() {
        const count = this.canvas.getObjects().length;
        document.getElementById('objectCount').textContent = `Objets: ${count}`;
    }

    drawGrid() {
        // Implémenter si nécessaire avec des lignes Fabric.js
    }

    initRulers() {
        // Implémenter si nécessaire
    }

    toggleGrid() {
        this.drawGrid();
        this.showToast(`Grille ${document.getElementById('gridToggle').checked ? 'activée' : 'désactivée'}`, 'info');
    }

    toggleSnap() {
        this.snapEnabled = document.getElementById('snapToggle').checked;
        this.showToast(`Accrochage ${this.snapEnabled ? 'activé' : 'désactivé'}`, 'info');
    }

    toggleGuides() {
        this.guidesEnabled = document.getElementById('guidesToggle').checked;
        this.showToast(`Guides ${this.guidesEnabled ? 'activés' : 'désactivés'}`, 'info');
    }

    toggleRulers() {
        // Implémenter si nécessaire
        this.showToast(`Règles ${document.getElementById('rulerToggle').checked ? 'activées' : 'désactivées'}`, 'info');
    }

    updateZoom() {
        const zoom = parseFloat(document.getElementById('zoomSlider').value);
        this.canvas.setZoom(zoom);
        this.updateZoomDisplay();
    }

    updateGridSize() {
        this.gridSize = parseInt(document.getElementById('gridSize').value);
        this.drawGrid();
        this.showToast(`Taille de grille: ${this.gridSize}px`, 'info');
    }

    updateUnitSystem() {
        this.unitSystem = document.getElementById('unitSystem').value;
        document.getElementById('unitDisplay').textContent = `Unité: ${this.unitSystem}`;
        this.showToast(`Unité: ${this.unitSystem}`, 'info');
    }

    zoomIn() {
        this.canvas.setZoom(this.canvas.getZoom() * 1.1);
        this.updateZoomDisplay();
    }

    zoomOut() {
        this.canvas.setZoom(this.canvas.getZoom() / 1.1);
        this.updateZoomDisplay();
    }

    zoomFit() {
        const bounds = this.canvas.getObjects().reduce((acc, obj) => {
            const b = obj.getBoundingRect(true);
            return {
                left: Math.min(acc.left, b.left),
                top: Math.min(acc.top, b.top),
                right: Math.max(acc.right, b.left + b.width),
                bottom: Math.max(acc.bottom, b.top + b.height)
            };
        }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
        const zoom = Math.min(
            this.canvas.width / (bounds.right - bounds.left),
            this.canvas.height / (bounds.bottom - bounds.top)
        ) * 0.9;
        this.canvas.setZoom(zoom);
        this.canvas.absolutePan({ x: bounds.left, y: bounds.top });
        this.updateZoomDisplay();
    }

    zoom100() {
        this.canvas.setZoom(1);
        this.canvas.absolutePan({ x: 0, y: 0 });
        this.updateZoomDisplay();
    }

    // ========================================
    // Propriétés
    // ========================================
    
    updateProperties() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        const strokeColor = document.getElementById('strokeColor').value;
        const fillColor = document.getElementById('fillColor').value;
        const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
        const fontSize = parseInt(document.getElementById('fontSize').value);

        if (activeObject.type === 'textbox') {
            activeObject.set({ fill: strokeColor, fontSize: fontSize });
        } else {
            activeObject.set({
                stroke: strokeColor,
                fill: fillColor,
                strokeWidth: strokeWidth
            });
        }
        activeObject.setCoords();
        this.canvas.renderAll();
        this.saveState();
    }

    updateOpacity() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        const opacity = parseFloat(document.getElementById('opacity').value);
        activeObject.set('opacity', opacity);
        document.getElementById('opacityValue').textContent = `${Math.round(opacity * 100)}%`;
        this.canvas.renderAll();
        this.saveState();
    }

    updateRotation() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        const angle = parseInt(document.getElementById('rotation').value);
        activeObject.set('angle', angle);
        activeObject.setCoords();
        this.canvas.renderAll();
        this.saveState();
    }

    // ========================================
    // Menu contextuel
    // ========================================
    
    showContextMenu(e) {
        e.preventDefault();
        const menu = document.getElementById('contextMenu');
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        menu.style.display = 'block';
    }

    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }

    handleContextMenuAction(action) {
        const activeObject = this.canvas.getActiveObject();
        switch (action) {
            case 'cut':
                if (activeObject) {
                    this.copy();
                    this.canvas.remove(activeObject);
                    this.saveState();
                }
                break;
            case 'copy':
                this.copy();
                break;
            case 'paste':
                this.paste();
                break;
            case 'duplicate':
                this.duplicate();
                break;
            case 'delete':
                if (activeObject) {
                    this.canvas.remove(activeObject);
                    this.saveState();
                    this.showToast('Objet supprimé', 'info');
                }
                break;
            case 'bring-forward':
                if (activeObject) {
                    activeObject.bringForward();
                    this.canvas.renderAll();
                    this.saveState();
                }
                break;
            case 'send-backward':
                if (activeObject) {
                    activeObject.sendBackwards();
                    this.canvas.renderAll();
                    this.saveState();
                }
                break;
            case 'bring-to-front':
                if (activeObject) {
                    activeObject.bringToFront();
                    this.canvas.renderAll();
                    this.saveState();
                }
                break;
            case 'send-to-back':
                if (activeObject) {
                    activeObject.sendToBack();
                    this.canvas.renderAll();
                    this.saveState();
                }
                break;
            case 'properties':
                // Peut être implémenté pour ouvrir une modale de propriétés
                break;
        }
        this.hideContextMenu();
    }

    // ========================================
    // Copier/Coller/Dupliquer
    // ========================================
    
    copy() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone(cloned => {
                this.clipboard = cloned;
                this.showToast('Objet copié', 'info');
            });
        }
    }

    paste() {
        if (this.clipboard) {
            this.clipboard.clone(cloned => {
                this.canvas.discardActiveObject();
                cloned.set({
                    left: cloned.left + 20,
                    top: cloned.top + 20,
                    layer: this.currentLayer
                });
                this.canvas.add(cloned);
                this.layers[this.currentLayer].objects.push(cloned);
                this.canvas.setActiveObject(cloned);
                this.canvas.renderAll();
                this.saveState();
                this.showToast('Objet collé', 'info');
            });
        }
    }

    duplicate() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone(cloned => {
                this.canvas.discardActiveObject();
                cloned.set({
                    left: cloned.left + 20,
                    top: cloned.top + 20,
                    layer: this.currentLayer
                });
                this.canvas.add(cloned);
                this.layers[this.currentLayer].objects.push(cloned);
                this.canvas.setActiveObject(cloned);
                this.canvas.renderAll();
                this.saveState();
                this.showToast('Objet dupliqué', 'info');
            });
        }
    }

    // ========================================
    // Gestion du thème
    // ========================================
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme');
        document.getElementById('themeToggle').textContent = this.theme === 'light' ? '🌙' : '☀️';
        this.showToast(`Thème ${this.theme}`, 'info');
    }

    loadTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }

    // ========================================
    // Gestion des guides et accrochage
    // ========================================
    
    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    showGuides(x, y) {
        // Implémenter si nécessaire
    }

    updateGuides(x, y) {
        // Implémenter si nécessaire
    }

    hideGuides() {
        // Implémenter si nécessaire
    }

    showPreview(x1, y1, x2, y2) {
        // Implémenter si nécessaire
    }

    clearPreview() {
        // Implémenter si nécessaire
    }

    showDistanceWhileDrawing(x1, y1, x2, y2) {
        // Implémenter si nécessaire
    }

    hideDistanceTooltip() {
        // Implémenter si nécessaire
    }

    // ========================================
    // Gestion des événements
    // ========================================
    
    onSelectionCreated(e) {
        this.updateSelectionInfo();
    }

    onSelectionUpdated(e) {
        this.updateSelectionInfo();
    }

    onSelectionCleared(e) {
        document.getElementById('selectionInfo').textContent = '';
        document.getElementById('selectedCount').textContent = '';
    }

    updateSelectionInfo() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const count = activeObject.type === 'activeSelection' ? activeObject.getObjects().length : 1;
            document.getElementById('selectedCount').textContent = `Sélectionnés: ${count}`;
        }
    }

    onObjectAdded(e) {
        this.updateObjectCount();
        this.saveState();
    }

    onObjectRemoved(e) {
        this.updateObjectCount();
        this.updateLayers();
        this.saveState();
    }

    onObjectModified(e) {
        this.saveState();
    }

    onObjectRotating(e) {
        document.getElementById('rotation').value = Math.round(e.target.angle);
    }

    onObjectScaling(e) {
        // Peut être utilisé pour mettre à jour les propriétés
    }

    onObjectMoving(e) {
        if (this.snapEnabled) {
            e.target.set({
                left: this.snapToGrid(e.target.left),
                top: this.snapToGrid(e.target.top)
            });
            e.target.setCoords();
        }
    }

    handleKeyboard(e) {
        switch (e.code) {
            case 'KeyZ':
                if (e.ctrlKey) this.undo();
                break;
            case 'KeyY':
                if (e.ctrlKey) this.redo();
                break;
            case 'KeyC':
                if (e.ctrlKey) this.copy();
                break;
            case 'KeyV':
                if (e.ctrlKey) this.paste();
                break;
            case 'KeyS':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveProject();
                }
                break;
            case 'KeyG':
                if (e.ctrlKey) {
                    if (e.shiftKey) {
                        this.ungroupObjects();
                    } else {
                        this.groupObjects();
                    }
                }
                break;
            case 'Delete':
                const activeObject = this.canvas.getActiveObject();
                if (activeObject) {
                    this.canvas.remove(activeObject);
                    this.saveState();
                }
                break;
            case 'Space':
                if (this.currentTool !== 'pan') {
                    this.selectTool('pan');
                    e.preventDefault();
                }
                break;
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space' && this.currentTool === 'pan') {
            this.selectTool('select');
        }
    }

    handleResize() {
        this.canvas.setDimensions({
            width: document.querySelector('.canvas-wrapper').clientWidth,
            height: document.querySelector('.canvas-wrapper').clientHeight
        });
        this.canvas.renderAll();
    }

    handleBeforeUnload(e) {
        if (this.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous quitter ?';
        }
    }

    // ========================================
    // Notifications
    // ========================================
    
    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // ========================================
    // Gestion du loader
    // ========================================
    
    showLoader() {
        document.getElementById('loader').style.display = 'flex';
    }

    hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }

    // ========================================
    // Gestion des vues
    // ========================================
    
    switchView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        // Implémenter la logique pour 2D/3D/vue divisée si nécessaire
        this.showToast(`Vue ${view} activée`, 'info');
    }

    // ========================================
    // Gestion des unités
    // ========================================
    
    convertToUnit(pixels) {
        return pixels / this.pixelsPerUnit[this.unitSystem];
    }

    // ========================================
    // Gestion de l'autosave
    // ========================================
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveProject();
                document.getElementById('autoSaveIndicator').textContent = '🔄 Sauvegarde auto effectuée';
                setTimeout(() => {
                    document.getElementById('autoSaveIndicator').textContent = '🔄 Sauvegarde auto';
                }, 10000);
            }
        }, 100000);
    }

    toggleMobileMenu() {
        const toolbar = document.getElementById('toolbar');
        toolbar.classList.toggle('mobile-open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ArchitectApp();
});