/**
 * Module de gestion des outils de dessin
 */

class ToolsManager {
    /**
     * Initialisation du gestionnaire d'outils
     */
    constructor(app) {
        this.app = app;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.snapEnabled = true;
        this.autoSelectAfterDraw = true;
        this.creatingObject = false;
        
        // Propriétés spécifiques pour la gomme
        this.eraserSize = 20;
        this.throttledErase = null;
        
        // Propriétés pour d'autres outils
        this.polygonPoints = null;
        this.isDrawingPolygon = false;
        this.isMeasuring = false;
        this.measureStart = null;
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
        
        // Nettoyer les états spéciaux
        if (this.polygonPoints) {
            this.removePolygonPreview();
            this.polygonPoints = null;
            this.isDrawingPolygon = false;
        }
        
        if (this.isMeasuring) {
            this.removeMeasurePreview();
            this.isMeasuring = false;
        }
        
        // Mettre à jour l'interface
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        this.currentTool = tool;

        // Configurer le canvas
        this.app.canvasManager.configureCanvasForTool(tool);

        // Configuration spéciale pour la gomme
        if (tool === 'eraser') {
            this.app.canvas.hoverCursor = 'none'; // Masquer le curseur par défaut
            this.app.canvas.moveCursor = 'none';
            
            // Throttler la gomme pour améliorer les performances
            if (!this.throttledErase) {
                this.throttledErase = throttle((pointer) => {
                    if (this.isDrawing && this.currentTool === 'eraser') {
                        this.eraseAtPosition(pointer.x, pointer.y);
                    }
                }, 50); // 50ms de throttle
            }
        } else {
            this.app.canvas.hoverCursor = 'move';
            this.app.canvas.moveCursor = 'move';
        }

        // Messages d'état pour chaque outil
        this.updateToolMessage(tool);

        console.log(`Outil sélectionné: ${tool}`);
    }

    /**
     * Met à jour le message d'état pour l'outil
     * @param {string} tool - Outil sélectionné
     */
    updateToolMessage(tool) {
        const toolNames = {
            'select': 'Mode sélection actif',
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
        
        updateDisplayValue('selection', toolNames[tool] || `Outil ${tool} actif`);
    }

    /**
     * Gestion de l'événement mouse:down
     * @param {Object} e - Événement Fabric.js
     */
    handleMouseDown(e) {
        if (this.currentTool === 'select') return;
        
        const pointer = this.app.canvas.getPointer(e.e);
        this.startX = this.snapEnabled ? snapToGrid(pointer.x, this.app.canvasManager.gridSize, this.snapEnabled) : pointer.x;
        this.startY = this.snapEnabled ? snapToGrid(pointer.y, this.app.canvasManager.gridSize, this.snapEnabled) : pointer.y;
        this.isDrawing = true;

        // Outil gomme - logique spéciale
        if (this.currentTool === 'eraser') {
            this.handleEraserStart(pointer);
            return;
        }

        // Pour les outils qui créent des objets au clic
        if (['door', 'window', 'text', 'elevator', 'tech-space'].includes(this.currentTool)) {
            this.createObject(this.startX, this.startY, this.startX, this.startY);
            this.isDrawing = false;
            this.app.historyManager.saveState();
            
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
        
        const pointer = this.app.canvas.getPointer(e.e);
        
        // Outil gomme
        if (this.currentTool === 'eraser') {
            this.handleEraserMove(pointer);
            return;
        }
        
        // Prévisualisation pour les outils glisser-déposer
        if (['wall', 'line', 'rectangle', 'circle', 'voile', 'stairs', 'gaine'].includes(this.currentTool)) {
            const endX = this.snapEnabled ? snapToGrid(pointer.x, this.app.canvasManager.gridSize, this.snapEnabled) : pointer.x;
            const endY = this.snapEnabled ? snapToGrid(pointer.y, this.app.canvasManager.gridSize, this.snapEnabled) : pointer.y;
            
            this.removePreview();
            
            const distance = calculateDistance(this.startX, this.startY, endX, endY);
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
            this.handleEraserEnd();
            return;
        }
        
        const pointer = this.app.canvas.getPointer(e.e);
        const endX = this.snapEnabled ? snapToGrid(pointer.x, this.app.canvasManager.gridSize, this.snapEnabled) : pointer.x;
        const endY = this.snapEnabled ? snapToGrid(pointer.y, this.app.canvasManager.gridSize, this.snapEnabled) : pointer.y;
        
        this.removePreview();
        
        // Créer l'objet pour les outils glisser-déposer
        if (['wall', 'line', 'rectangle', 'circle', 'voile', 'stairs', 'gaine'].includes(this.currentTool)) {
            const distance = calculateDistance(this.startX, this.startY, endX, endY);
            
            if (distance > 5) {
                this.createObject(this.startX, this.startY, endX, endY);
                this.app.historyManager.saveState();
                
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
            const properties = getCurrentProperties();
            let preview = null;

            switch(this.currentTool) {
                case 'wall':
                case 'line':
                    preview = new fabric.Line([x1, y1, x2, y2], {
                        stroke: properties.strokeColor,
                        strokeWidth: properties.strokeWidth,
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
                            stroke: properties.strokeColor,
                            strokeWidth: properties.strokeWidth * 2,
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
                            stroke: properties.strokeColor,
                            strokeWidth: properties.strokeWidth,
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
                            stroke: properties.strokeColor,
                            strokeWidth: properties.strokeWidth,
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
                            stroke: properties.strokeColor,
                            strokeWidth: properties.strokeWidth,
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
                            stroke: properties.strokeColor,
                            strokeWidth: properties.strokeWidth,
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
                this.app.canvas.add(preview);
                this.app.canvas.renderAll();
            }
        } catch (error) {
            console.error(`Erreur lors de la prévisualisation de ${this.currentTool}:`, error);
        }
    }

    /**
     * Suppression des objets de prévisualisation
     */
    removePreview() {
        const objects = this.app.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isPreview) {
                this.app.canvas.remove(obj);
            }
        });
        this.app.canvas.renderAll();
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
            const properties = getCurrentProperties();
            let obj = null;

            // Objets architecturaux complexes
            if (['door', 'window', 'stairs', 'elevator', 'voile', 'gaine', 'tech-space'].includes(this.currentTool)) {
                obj = this.createArchitecturalObject(x1, y1, x2, y2, properties);
            } else {
                // Objets simples
                obj = ArchitecturalObjects.createSimpleObject(this.currentTool, x1, y1, x2, y2, properties);
            }

            if (obj) {
                this.app.canvas.add(obj);
                this.app.canvas.renderAll();
                console.log(`Objet créé: ${this.currentTool}`, obj);
            }
        } catch (error) {
            console.error(`Erreur lors de la création de l'objet ${this.currentTool}:`, error);
        } finally {
            this.creatingObject = false;
        }
    }

    /**
     * Création d'objets architecturaux
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {Object} properties - Propriétés de l'objet
     * @returns {fabric.Object} Objet créé
     */
    createArchitecturalObject(x1, y1, x2, y2, properties) {
        switch(this.currentTool) {
            case 'door':
                return ArchitecturalObjects.createDoor(x1, y1, properties.opacity);
            case 'window':
                return ArchitecturalObjects.createWindow(x1, y1, properties.opacity);
            case 'stairs':
                return ArchitecturalObjects.createStairs(x1, y1, x2, y2, properties.opacity);
            case 'elevator':
                return ArchitecturalObjects.createElevator(x1, y1, properties.opacity);
            case 'voile':
                return ArchitecturalObjects.createVoile(x1, y1, x2, y2, properties.strokeColor, properties.strokeWidth, properties.opacity);
            case 'gaine':
                return ArchitecturalObjects.createGaine(x1, y1, x2, y2, properties.strokeColor, properties.strokeWidth, properties.opacity);
            case 'tech-space':
                return ArchitecturalObjects.createTechSpace(x1, y1, properties.opacity);
            case 'column':
                return ArchitecturalObjects.createColumn(x1, y1, properties.opacity);
            case 'beam':
                return ArchitecturalObjects.createBeam(x1, y1, x2, y2, properties.opacity);
            case 'french-door':
                return ArchitecturalObjects.createFrenchDoor(x1, y1, properties.opacity);
            case 'bay-window':
                return ArchitecturalObjects.createBayWindow(x1, y1, properties.opacity);
            case 'ramp':
                return ArchitecturalObjects.createRamp(x1, y1, x2, y2, properties.opacity);
            case 'balcony':
                return ArchitecturalObjects.createBalcony(x1, y1, properties.opacity);
            case 'hvac':
                return ArchitecturalObjects.createHVAC(x1, y1, properties.opacity);
            case 'electrical':
                return ArchitecturalObjects.createElectrical(x1, y1, properties.opacity);
            case 'dimension':
                return this.createDimension(x1, y1, x2, y2, properties);
            case 'arrow':
                return ArchitecturalObjects.createArrow(x1, y1, x2, y2, properties);
            case 'label':
                const text = prompt('Texte de l\'étiquette:') || 'Étiquette';
                return ArchitecturalObjects.createLabel(x1, y1, text, properties);
            default:
                return null;
        }
    }

    /**
     * Gestion des outils spéciaux
     */

    /**
     * Gestion de l'outil main (déplacement de vue)
     * @param {Object} e - Événement Fabric.js
     */
    handleHandTool(e) {
        if (this.currentTool !== 'hand') return;

        const pointer = this.app.canvas.getPointer(e.e);
        
        if (e.e.type === 'mousedown') {
            this.app.canvas.isDragging = true;
            this.app.canvas.selection = false;
            this.app.canvas.lastPosX = pointer.x;
            this.app.canvas.lastPosY = pointer.y;
        } else if (e.e.type === 'mousemove' && this.app.canvas.isDragging) {
            const vpt = this.app.canvas.viewportTransform;
            vpt[4] += pointer.x - this.app.canvas.lastPosX;
            vpt[5] += pointer.y - this.app.canvas.lastPosY;
            this.app.canvas.requestRenderAll();
            this.app.canvas.lastPosX = pointer.x;
            this.app.canvas.lastPosY = pointer.y;
        } else if (e.e.type === 'mouseup') {
            this.app.canvas.isDragging = false;
            this.app.canvas.selection = true;
        }
    }

    /**
     * Gestion de l'outil mesure
     */
    handleMeasureTool(e) {
        if (this.currentTool !== 'measure') return;

        const pointer = this.app.canvas.getPointer(e.e);
        
        if (e.e.type === 'mousedown') {
            this.measureStart = { x: pointer.x, y: pointer.y };
            this.isMeasuring = true;
        } else if (e.e.type === 'mousemove' && this.isMeasuring) {
            this.showMeasurePreview(this.measureStart, pointer);
        } else if (e.e.type === 'mouseup' && this.isMeasuring) {
            const distance = this.app.measureDistance(this.measureStart, pointer);
            this.showMeasureResult(distance);
            this.isMeasuring = false;
            this.removeMeasurePreview();
        }
    }

    /**
     * Affiche l'aperçu de mesure
     * @param {Object} start - Point de départ
     * @param {Object} end - Point de fin
     */
    showMeasurePreview(start, end) {
        this.removeMeasurePreview();
        
        const distance = this.app.measureDistance(start, end);
        
        // Ligne de mesure
        const line = new fabric.Line([start.x, start.y, end.x, end.y], {
            stroke: '#ff6600',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            isMeasurePreview: true
        });
        
        // Texte de distance
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const text = new fabric.Text(`${distance.cm.toFixed(1)} cm`, {
            left: midX,
            top: midY - 15,
            fontSize: 12,
            fill: '#ff6600',
            fontFamily: 'Arial',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            isMeasurePreview: true,
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
        });
        
        this.app.canvas.add(line, text);
        this.app.canvas.renderAll();
    }

    /**
     * Supprime l'aperçu de mesure
     */
    removeMeasurePreview() {
        const objects = this.app.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isMeasurePreview) {
                this.app.canvas.remove(obj);
            }
        });
    }

    /**
     * Affiche le résultat de mesure
     * @param {Object} distance - Données de distance
     */
    showMeasureResult(distance) {
        const message = `Distance mesurée:\n${distance.cm.toFixed(1)} cm\n${distance.m.toFixed(2)} m\n${distance.pixels.toFixed(0)} pixels`;
        alert(message);
    }

    /**
     * Création d'une cotation
     * @param {number} x1 - X de départ
     * @param {number} y1 - Y de départ
     * @param {number} x2 - X de fin
     * @param {number} y2 - Y de fin
     * @param {Object} properties - Propriétés
     * @returns {fabric.Group} Cotation
     */
    createDimension(x1, y1, x2, y2, properties) {
        const distance = this.app.measureDistance({ x: x1, y: y1 }, { x: x2, y: y2 });
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // Ligne principale
        const mainLine = new fabric.Line([x1, y1, x2, y2], {
            stroke: properties.strokeColor,
            strokeWidth: 1,
            opacity: properties.opacity
        });
        
        // Lignes d'extension
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const perpAngle = angle + Math.PI / 2;
        const extLength = 10;
        
        const ext1Start = {
            x: x1 + Math.cos(perpAngle) * extLength,
            y: y1 + Math.sin(perpAngle) * extLength
        };
        const ext1End = {
            x: x1 - Math.cos(perpAngle) * extLength,
            y: y1 - Math.sin(perpAngle) * extLength
        };
        
        const ext2Start = {
            x: x2 + Math.cos(perpAngle) * extLength,
            y: y2 + Math.sin(perpAngle) * extLength
        };
        const ext2End = {
            x: x2 - Math.cos(perpAngle) * extLength,
            y: y2 - Math.sin(perpAngle) * extLength
        };
        
        const extLine1 = new fabric.Line([ext1Start.x, ext1Start.y, ext1End.x, ext1End.y], {
            stroke: properties.strokeColor,
            strokeWidth: 1,
            opacity: properties.opacity
        });
        
        const extLine2 = new fabric.Line([ext2Start.x, ext2Start.y, ext2End.x, ext2End.y], {
            stroke: properties.strokeColor,
            strokeWidth: 1,
            opacity: properties.opacity
        });
        
        // Texte de cotation
        const text = new fabric.Text(`${distance.cm.toFixed(1)}`, {
            left: midX,
            top: midY - 8,
            fontSize: 11,
            fill: properties.strokeColor,
            fontFamily: 'Arial',
            originX: 'center',
            originY: 'center',
            backgroundColor: 'white'
        });
        
        const group = new fabric.Group([mainLine, extLine1, extLine2, text]);
        group.type = 'dimension';
        group.customType = 'dimension';
        return group;
    }

    /**
     * Gestion de l'outil polygone
     */
    handlePolygonTool(e) {
        if (this.currentTool !== 'polygon') return;

        const pointer = this.app.canvas.getPointer(e.e);
        
        if (e.e.type === 'mousedown') {
            if (!this.polygonPoints) {
                this.polygonPoints = [];
                this.isDrawingPolygon = true;
            }
            
            this.polygonPoints.push({ x: pointer.x, y: pointer.y });
            this.updatePolygonPreview();
        } else if (e.e.type === 'dblclick' && this.isDrawingPolygon) {
            this.finishPolygon();
        }
    }

    /**
     * Met à jour l'aperçu du polygone
     */
    updatePolygonPreview() {
        this.removePolygonPreview();
        
        if (this.polygonPoints.length < 2) return;
        
        const properties = getCurrentProperties();
        const preview = ArchitecturalObjects.createPolygon(this.polygonPoints, {
            ...properties,
            opacity: 0.5
        });
        
        if (preview) {
            preview.isPreview = true;
            preview.selectable = false;
            preview.evented = false;
            preview.strokeDashArray = [5, 5];
            this.app.canvas.add(preview);
            this.app.canvas.renderAll();
        }
    }

    /**
     * Supprime l'aperçu du polygone
     */
    removePolygonPreview() {
        const objects = this.app.canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isPreview && obj.type === 'polygon') {
                this.app.canvas.remove(obj);
            }
        });
    }

    /**
     * Termine la création du polygone
     */
    finishPolygon() {
        if (this.polygonPoints && this.polygonPoints.length >= 3) {
            this.removePolygonPreview();
            
            const properties = getCurrentProperties();
            const polygon = ArchitecturalObjects.createPolygon(this.polygonPoints, properties);
            
            if (polygon) {
                this.app.canvas.add(polygon);
                this.app.canvas.renderAll();
                this.app.historyManager.saveState();
            }
        }
        
        this.polygonPoints = null;
        this.isDrawingPolygon = false;
        
        if (this.autoSelectAfterDraw) {
            this.selectTool('select');
        }
    }

    /**
     * Gestion des outils avancés dans mouse events
     */
    handleAdvancedMouseDown(e) {
        // Gestion des outils spéciaux
        if (this.currentTool === 'hand') {
            this.handleHandTool(e);
            return;
        }
        
        if (this.currentTool === 'measure') {
            this.handleMeasureTool(e);
            return;
        }
        
        if (this.currentTool === 'polygon') {
            this.handlePolygonTool(e);
            return;
        }
        
        // Gestion normale pour les autres outils
        this.handleMouseDown(e);
    }

    /**
     * Mise à jour des nouveaux outils dans la sélection
     */
    updateToolMessage(tool) {
        const toolNames = {
            'select': 'Mode sélection actif',
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
            'eraser': 'Effacer des éléments (maintenir le clic)',
            'hand': 'Déplacer la vue (glisser)',
            'measure': 'Mesurer des distances (clic-glisser)',
            'column': 'Placer des poteaux',
            'beam': 'Dessiner des poutres',
            'french-door': 'Placer des portes-fenêtres',
            'bay-window': 'Placer des baies vitrées',
            'ramp': 'Dessiner des rampes',
            'balcony': 'Placer des balcons',
            'hvac': 'Placer des équipements CVC',
            'electrical': 'Placer des équipements électriques',
            'polygon': 'Dessiner des polygones (clic multiple, double-clic pour terminer)',
            'dimension': 'Ajouter des cotations',
            'arrow': 'Dessiner des flèches',
            'label': 'Ajouter des étiquettes'
        };
        
        updateDisplayValue('selection', toolNames[tool] || `Outil ${tool} actif`);
        updateDisplayValue('toolInfo', `Outil: ${toolNames[tool] || tool}`);
    }

    /**
     * Gestion de l'outil gomme - début
     * @param {Object} pointer - Coordonnées du pointeur
     */
    handleEraserStart(pointer) {
        this.eraserSize = 20;
        this.showEraserIndicator(pointer.x, pointer.y, this.eraserSize);
        this.eraseAtPosition(pointer.x, pointer.y);
    }

    /**
     * Gestion de l'outil gomme - mouvement
     * @param {Object} pointer - Coordonnées du pointeur
     */
    handleEraserMove(pointer) {
        this.showEraserIndicator(pointer.x, pointer.y, this.eraserSize);
        this.eraseAtPosition(pointer.x, pointer.y);
    }

    /**
     * Gestion de l'outil gomme - fin
     */
    handleEraserEnd() {
        this.hideEraserIndicator();
        this.app.historyManager.saveState();
        this.isDrawing = false;
    }

    /**
     * Effacement à une position donnée
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    eraseAtPosition(x, y) {
        const eraserSize = this.eraserSize || 20;
        
        // Obtenir tous les objets effaçables
        const objectsToCheck = this.app.canvas.getObjects().filter(obj => 
            !obj.isGrid && 
            !obj.isPreview && 
            !obj.isEraserIndicator && 
            obj.selectable !== false &&
            !obj.isDimension
        );

        const objectsToRemove = [];

        objectsToCheck.forEach(obj => {
            if (this.isObjectInEraserRange(x, y, obj, eraserSize)) {
                if (obj.type === 'line' || obj.type === 'wall') {
                    // Pour les lignes, on peut les diviser ou les supprimer
                    this.eraseFromLine(obj, x, y, eraserSize);
                } else {
                    // Pour les autres objets, suppression complète
                    objectsToRemove.push(obj);
                }
            }
        });

        // Supprimer les objets marqués pour suppression
        objectsToRemove.forEach(obj => {
            this.app.canvas.remove(obj);
        });
        
        if (objectsToRemove.length > 0) {
            this.app.canvas.renderAll();
        }
    }

    /**
     * Vérifie si un objet est dans la zone de la gomme
     * @param {number} x - Position X de la gomme
     * @param {number} y - Position Y de la gomme
     * @param {Object} obj - Objet à vérifier
     * @param {number} eraserSize - Taille de la gomme
     * @returns {boolean} Vrai si l'objet est dans la zone
     */
    isObjectInEraserRange(x, y, obj, eraserSize) {
        try {
            // Pour les objets avec des coordonnées simples (cercles, rectangles, groupes)
            if (obj.left !== undefined && obj.top !== undefined) {
                const objCenterX = obj.left + (obj.width || 0) / 2;
                const objCenterY = obj.top + (obj.height || 0) / 2;
                const distance = Math.sqrt((x - objCenterX) ** 2 + (y - objCenterY) ** 2);
                return distance <= eraserSize;
            }
            
            // Pour les lignes
            if (obj.type === 'line' && obj.x1 !== undefined) {
                return this.isPointNearLine(x, y, obj, eraserSize);
            }
            
            // Méthode alternative : utiliser getBoundingRect
            const bounds = obj.getBoundingRect();
            return (x >= bounds.left - eraserSize && 
                    x <= bounds.left + bounds.width + eraserSize &&
                    y >= bounds.top - eraserSize && 
                    y <= bounds.top + bounds.height + eraserSize);
                    
        } catch (error) {
            console.warn('Erreur lors de la vérification de l\'objet:', error);
            return false;
        }
    }

    /**
     * Vérifie si un point est proche d'une ligne
     * @param {number} x - Position X du point
     * @param {number} y - Position Y du point
     * @param {Object} lineObj - Objet ligne
     * @param {number} tolerance - Tolérance
     * @returns {boolean} Vrai si le point est proche
     */
    isPointNearLine(x, y, lineObj, tolerance) {
        const x1 = lineObj.x1 + lineObj.left;
        const y1 = lineObj.y1 + lineObj.top;
        const x2 = lineObj.x2 + lineObj.left;
        const y2 = lineObj.y2 + lineObj.top;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B) <= tolerance;

        const param = Math.max(0, Math.min(1, dot / lenSq));
        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const distance = Math.sqrt((x - xx) * (x - xx) + (y - yy) * (y - yy));
        return distance <= tolerance;
    }

    /**
     * Affichage de l'indicateur de gomme
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} size - Taille de l'indicateur
     */
    showEraserIndicator(x, y, size) {
        // Supprimer l'ancien indicateur
        const oldIndicator = this.app.canvas.getObjects().find(obj => obj.isEraserIndicator);
        if (oldIndicator) {
            this.app.canvas.remove(oldIndicator);
        }

        // Créer le nouvel indicateur
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
            opacity: 0.7,
            excludeFromExport: true
        });

        this.app.canvas.add(indicator);
        // Ne pas appeler renderAll ici pour éviter les ralentissements
    }

    /**
     * Masquer l'indicateur de gomme
     */
    hideEraserIndicator() {
        const indicators = this.app.canvas.getObjects().filter(obj => obj.isEraserIndicator);
        indicators.forEach(indicator => {
            this.app.canvas.remove(indicator);
        });
        this.app.canvas.renderAll();
    }

    /**
     * Efface ou divise une ligne (version améliorée)
     * @param {Object} lineObj - Objet ligne Fabric.js
     * @param {number} x - Position X du pointeur
     * @param {number} y - Position Y du pointeur
     * @param {number} tolerance - Tolérance en pixels
     * @returns {boolean} Vrai si la ligne a été modifiée
     */
    eraseFromLine(lineObj, x, y, tolerance) {
        if (lineObj.type !== 'line' && lineObj.type !== 'wall') return false;

        try {
            const x1 = (lineObj.x1 || 0) + (lineObj.left || 0);
            const y1 = (lineObj.y1 || 0) + (lineObj.top || 0);
            const x2 = (lineObj.x2 || 0) + (lineObj.left || 0);
            const y2 = (lineObj.y2 || 0) + (lineObj.top || 0);

            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            
            if (lenSq === 0) {
                // Ligne de longueur nulle, la supprimer
                this.app.canvas.remove(lineObj);
                return true;
            }

            const param = dot / lenSq;

            // Si le point est en dehors de la ligne, ne rien faire
            if (param < 0 || param > 1) return false;

            const xx = x1 + param * C;
            const yy = y1 + param * D;

            const distance = Math.sqrt((x - xx) * (x - xx) + (y - yy) * (y - yy));

            if (distance <= tolerance) {
                // Supprimer la ligne originale
                this.app.canvas.remove(lineObj);
                
                // Si le point de coupure n'est pas trop près des extrémités, créer deux segments
                if (param > 0.1 && param < 0.9) {
                    // Créer le premier segment
                    const segment1 = new fabric.Line([x1, y1, xx, yy], {
                        stroke: lineObj.stroke || '#000000',
                        strokeWidth: lineObj.strokeWidth || 2,
                        opacity: lineObj.opacity || 1,
                        selectable: true,
                        type: lineObj.type || 'line'
                    });
                    
                    // Créer le deuxième segment
                    const segment2 = new fabric.Line([xx, yy, x2, y2], {
                        stroke: lineObj.stroke || '#000000',
                        strokeWidth: lineObj.strokeWidth || 2,
                        opacity: lineObj.opacity || 1,
                        selectable: true,
                        type: lineObj.type || 'line'
                    });
                    
                    // Ajouter les nouveaux segments
                    this.app.canvas.add(segment1);
                    this.app.canvas.add(segment2);
                }
                // Si le point est près d'une extrémité, on supprime juste la ligne
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('Erreur lors de l\'effacement de ligne:', error);
            // En cas d'erreur, supprimer simplement la ligne
            this.app.canvas.remove(lineObj);
            return true;
        }
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
}