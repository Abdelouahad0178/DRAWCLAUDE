/**
 * Module de gestion du canvas
 */

class CanvasManager {
    constructor(app) {
        this.app = app;
        this.canvas = null;
        this.gridSize = 20;
    }

    /**
     * Configuration du canvas Fabric.js
     */
    setupCanvas() {
        this.canvas = new fabric.Canvas('canvas', {
            backgroundColor: '#f8f9fa',
            selection: true
        });

        this.app.canvas = this.canvas;

        // Événements du canvas
        this.canvas.on('mouse:down', this.app.handleMouseDown.bind(this.app));
        this.canvas.on('mouse:move', this.app.handleMouseMove.bind(this.app));
        this.canvas.on('mouse:up', this.app.handleMouseUp.bind(this.app));
        this.canvas.on('selection:created', this.app.handleSelection.bind(this.app));
        this.canvas.on('selection:updated', this.app.handleSelection.bind(this.app));
        this.canvas.on('selection:cleared', this.app.handleSelectionClear.bind(this.app));
        this.canvas.on('object:added', this.app.updateObjectCount.bind(this.app));
        this.canvas.on('object:removed', this.app.updateObjectCount.bind(this.app));

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
     * Basculement de l'affichage de la grille
     */
    toggleGrid() {
        this.drawGrid();
    }

    /**
     * Mise à jour du niveau de zoom
     */
    updateZoom() {
        const zoomSlider = document.getElementById('zoomSlider');
        if (!zoomSlider) return;
        
        const zoom = parseFloat(zoomSlider.value);
        this.canvas.setZoom(zoom);
        
        updateDisplayValue('zoomValue', Math.round(zoom * 100) + '%');
        updateDisplayValue('zoomInfo', `Zoom: ${Math.round(zoom * 100)}%`);
        
        this.drawGrid();
    }

    /**
     * Effacement du canevas
     */
    clearCanvas() {
        if (confirm('Effacer tout le plan ?')) {
            this.canvas.clear();
            this.canvas.backgroundColor = '#f8f9fa';
            this.drawGrid();
            this.app.historyManager.saveState();
            this.app.updateObjectCount();
        }
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
            link.download = generateSafeFileName(projectName, 'png');
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
        const objects = filterCanvasObjects(this.canvas.getObjects());
        updateDisplayValue('objectCount', `Objets: ${objects.length}`);
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
                        obj = ArchitecturalObjects.recreateComplexObject(objData);
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
     * Configure le mode du canvas selon l'outil sélectionné
     * @param {string} tool - Outil sélectionné
     */
    configureCanvasForTool(tool) {
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
        }

        this.canvas.renderAll();
    }

    /**
     * Redimensionnement du canvas
     */
    handleResize() {
        if (this.canvas) {
            this.canvas.calcOffset();
        }
    }
}