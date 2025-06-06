/**
 * Module de gestion des calques
 */

class LayerManager {
    constructor(app) {
        this.app = app;
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerId = 1;
    }

    /**
     * Initialisation du gestionnaire de calques
     */
    init() {
        this.createDefaultLayer();
        this.setupEventListeners();
        this.updateLayerPanel();
    }

    /**
     * Crée le calque par défaut
     */
    createDefaultLayer() {
        const defaultLayer = {
            id: this.nextLayerId++,
            name: 'Calque 1',
            visible: true,
            locked: false,
            opacity: 1,
            color: '#000000',
            objects: []
        };
        
        this.layers.push(defaultLayer);
        this.activeLayerId = defaultLayer.id;
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton gestion des calques
        const layerBtn = document.getElementById('layerBtn');
        if (layerBtn) {
            layerBtn.addEventListener('click', () => {
                this.showLayerPanel();
            });
        }

        // Boutons d'action des calques
        document.getElementById('addLayerBtn')?.addEventListener('click', () => {
            this.addLayer();
        });

        document.getElementById('deleteLayerBtn')?.addEventListener('click', () => {
            this.deleteActiveLayer();
        });

        // Fermeture du panneau
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.hideLayerPanel();
        });

        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.hideLayerPanel();
            }
        });

        // Écouter les ajouts/suppressions d'objets
        this.app.canvas.on('object:added', (e) => {
            this.assignObjectToActiveLayer(e.target);
        });

        this.app.canvas.on('object:removed', (e) => {
            this.removeObjectFromLayers(e.target);
        });
    }

    /**
     * Affiche le panneau de gestion des calques
     */
    showLayerPanel() {
        this.updateLayerPanel();
        document.getElementById('modalOverlay').style.display = 'flex';
    }

    /**
     * Cache le panneau de gestion des calques
     */
    hideLayerPanel() {
        document.getElementById('modalOverlay').style.display = 'none';
    }

    /**
     * Met à jour le panneau des calques
     */
    updateLayerPanel() {
        const layerList = document.getElementById('layerList');
        if (!layerList) return;

        layerList.innerHTML = '';

        this.layers.forEach((layer, index) => {
            const layerItem = this.createLayerItem(layer, index);
            layerList.appendChild(layerItem);
        });
    }

    /**
     * Crée un élément de calque pour l'interface
     * @param {Object} layer - Données du calque
     * @param {number} index - Index du calque
     * @returns {HTMLElement} Élément HTML du calque
     */
    createLayerItem(layer, index) {
        const item = document.createElement('div');
        item.className = `layer-item ${layer.id === this.activeLayerId ? 'active' : ''}`;
        item.dataset.layerId = layer.id;

        item.innerHTML = `
            <div class="layer-controls">
                <button class="layer-visibility ${layer.visible ? 'visible' : 'hidden'}" 
                        data-action="toggle-visibility" title="Visibilité">
                    ${layer.visible ? '👁️' : '🙈'}
                </button>
                <button class="layer-lock ${layer.locked ? 'locked' : 'unlocked'}" 
                        data-action="toggle-lock" title="Verrouillage">
                    ${layer.locked ? '🔒' : '🔓'}
                </button>
            </div>
            <div class="layer-info">
                <input type="text" class="layer-name" value="${layer.name}" 
                       data-action="rename" placeholder="Nom du calque">
                <div class="layer-stats">${layer.objects.length} objets</div>
            </div>
            <div class="layer-actions">
                <input type="color" class="layer-color" value="${layer.color}" 
                       data-action="change-color" title="Couleur">
                <input type="range" class="layer-opacity" min="0" max="1" step="0.1" 
                       value="${layer.opacity}" data-action="change-opacity" title="Opacité">
            </div>
            <div class="layer-order">
                <button class="move-up" data-action="move-up" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="move-down" data-action="move-down" ${index === this.layers.length - 1 ? 'disabled' : ''}>↓</button>
            </div>
        `;

        // Événements pour ce calque
        this.setupLayerItemEvents(item, layer);

        return item;
    }

    /**
     * Configure les événements pour un élément de calque
     * @param {HTMLElement} item - Élément HTML
     * @param {Object} layer - Données du calque
     */
    setupLayerItemEvents(item, layer) {
        // Sélection du calque
        item.addEventListener('click', (e) => {
            if (!e.target.matches('button, input')) {
                this.setActiveLayer(layer.id);
            }
        });

        // Actions spécifiques
        item.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action) return;

            switch (action) {
                case 'toggle-visibility':
                    this.toggleLayerVisibility(layer.id);
                    break;
                case 'toggle-lock':
                    this.toggleLayerLock(layer.id);
                    break;
                case 'move-up':
                    this.moveLayerUp(layer.id);
                    break;
                case 'move-down':
                    this.moveLayerDown(layer.id);
                    break;
            }
        });

        // Changement de nom
        const nameInput = item.querySelector('.layer-name');
        nameInput.addEventListener('change', (e) => {
            this.renameLayer(layer.id, e.target.value);
        });

        // Changement de couleur
        const colorInput = item.querySelector('.layer-color');
        colorInput.addEventListener('change', (e) => {
            this.changeLayerColor(layer.id, e.target.value);
        });

        // Changement d'opacité
        const opacityInput = item.querySelector('.layer-opacity');
        opacityInput.addEventListener('input', (e) => {
            this.changeLayerOpacity(layer.id, parseFloat(e.target.value));
        });
    }

    /**
     * Ajoute un nouveau calque
     */
    addLayer() {
        const newLayer = {
            id: this.nextLayerId++,
            name: `Calque ${this.layers.length + 1}`,
            visible: true,
            locked: false,
            opacity: 1,
            color: '#000000',
            objects: []
        };

        this.layers.unshift(newLayer); // Ajouter en haut
        this.setActiveLayer(newLayer.id);
        this.updateLayerPanel();
    }

    /**
     * Supprime le calque actif
     */
    deleteActiveLayer() {
        if (this.layers.length <= 1) {
            alert('Impossible de supprimer le dernier calque');
            return;
        }

        const layerIndex = this.layers.findIndex(l => l.id === this.activeLayerId);
        if (layerIndex === -1) return;

        const layer = this.layers[layerIndex];
        
        if (layer.objects.length > 0) {
            if (!confirm(`Le calque "${layer.name}" contient ${layer.objects.length} objets. Supprimer ?`)) {
                return;
            }
            
            // Supprimer tous les objets du calque
            layer.objects.forEach(objId => {
                const obj = this.app.canvas.getObjects().find(o => o.id === objId);
                if (obj) {
                    this.app.canvas.remove(obj);
                }
            });
        }

        this.layers.splice(layerIndex, 1);
        
        // Sélectionner un autre calque
        const nextActiveIndex = Math.min(layerIndex, this.layers.length - 1);
        this.setActiveLayer(this.layers[nextActiveIndex].id);
        
        this.updateLayerPanel();
        this.app.historyManager.saveState();
    }

    /**
     * Définit le calque actif
     * @param {number} layerId - ID du calque
     */
    setActiveLayer(layerId) {
        this.activeLayerId = layerId;
        this.updateLayerPanel();
        
        // Mettre à jour l'interface
        const layer = this.getLayer(layerId);
        if (layer) {
            this.app.uiManager.showStatusMessage(`Calque actif: ${layer.name}`);
        }
    }

    /**
     * Bascule la visibilité d'un calque
     * @param {number} layerId - ID du calque
     */
    toggleLayerVisibility(layerId) {
        const layer = this.getLayer(layerId);
        if (!layer) return;

        layer.visible = !layer.visible;
        
        // Appliquer la visibilité aux objets
        layer.objects.forEach(objId => {
            const obj = this.app.canvas.getObjects().find(o => o.id === objId);
            if (obj) {
                obj.visible = layer.visible;
            }
        });

        this.app.canvas.renderAll();
        this.updateLayerPanel();
    }

    /**
     * Bascule le verrouillage d'un calque
     * @param {number} layerId - ID du calque
     */
    toggleLayerLock(layerId) {
        const layer = this.getLayer(layerId);
        if (!layer) return;

        layer.locked = !layer.locked;
        
        // Appliquer le verrouillage aux objets
        layer.objects.forEach(objId => {
            const obj = this.app.canvas.getObjects().find(o => o.id === objId);
            if (obj) {
                obj.selectable = !layer.locked;
                obj.evented = !layer.locked;
            }
        });

        this.app.canvas.renderAll();
        this.updateLayerPanel();
    }

    /**
     * Renomme un calque
     * @param {number} layerId - ID du calque
     * @param {string} newName - Nouveau nom
     */
    renameLayer(layerId, newName) {
        const layer = this.getLayer(layerId);
        if (layer && newName.trim()) {
            layer.name = newName.trim();
        }
    }

    /**
     * Change la couleur d'un calque
     * @param {number} layerId - ID du calque
     * @param {string} color - Nouvelle couleur
     */
    changeLayerColor(layerId, color) {
        const layer = this.getLayer(layerId);
        if (!layer) return;

        layer.color = color;
        
        // Optionnel: appliquer la couleur aux objets du calque
        // Cette fonctionnalité peut être activée/désactivée
    }

    /**
     * Change l'opacité d'un calque
     * @param {number} layerId - ID du calque
     * @param {number} opacity - Nouvelle opacité (0-1)
     */
    changeLayerOpacity(layerId, opacity) {
        const layer = this.getLayer(layerId);
        if (!layer) return;

        layer.opacity = opacity;
        
        // Appliquer l'opacité aux objets
        layer.objects.forEach(objId => {
            const obj = this.app.canvas.getObjects().find(o => o.id === objId);
            if (obj) {
                obj.opacity = opacity;
            }
        });

        this.app.canvas.renderAll();
    }

    /**
     * Déplace un calque vers le haut
     * @param {number} layerId - ID du calque
     */
    moveLayerUp(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index > 0) {
            [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
            this.updateLayerPanel();
            this.updateObjectOrder();
        }
    }

    /**
     * Déplace un calque vers le bas
     * @param {number} layerId - ID du calque
     */
    moveLayerDown(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index < this.layers.length - 1) {
            [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
            this.updateLayerPanel();
            this.updateObjectOrder();
        }
    }

    /**
     * Met à jour l'ordre des objets selon l'ordre des calques
     */
    updateObjectOrder() {
        // Réorganiser les objets sur le canvas selon l'ordre des calques
        this.layers.reverse().forEach(layer => {
            layer.objects.forEach(objId => {
                const obj = this.app.canvas.getObjects().find(o => o.id === objId);
                if (obj) {
                    this.app.canvas.bringToFront(obj);
                }
            });
        });
        
        this.app.canvas.renderAll();
    }

    /**
     * Assigne un objet au calque actif
     * @param {fabric.Object} obj - Objet à assigner
     */
    assignObjectToActiveLayer(obj) {
        if (obj.isGrid || obj.isPreview || obj.isEraserIndicator) return;

        const activeLayer = this.getActiveLayer();
        if (activeLayer) {
            // Générer un ID pour l'objet s'il n'en a pas
            if (!obj.id) {
                obj.id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Ajouter à la liste des objets du calque
            if (!activeLayer.objects.includes(obj.id)) {
                activeLayer.objects.push(obj.id);
            }
            
            // Assigner les propriétés du calque
            obj.layerId = activeLayer.id;
            obj.visible = activeLayer.visible;
            obj.opacity = activeLayer.opacity;
            
            if (activeLayer.locked) {
                obj.selectable = false;
                obj.evented = false;
            }
        }
    }

    /**
     * Retire un objet de tous les calques
     * @param {fabric.Object} obj - Objet à retirer
     */
    removeObjectFromLayers(obj) {
        if (!obj.id) return;

        this.layers.forEach(layer => {
            const index = layer.objects.indexOf(obj.id);
            if (index > -1) {
                layer.objects.splice(index, 1);
            }
        });
        
        this.updateLayerPanel();
    }

    /**
     * Obtient un calque par son ID
     * @param {number} layerId - ID du calque
     * @returns {Object|null} Calque trouvé
     */
    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }

    /**
     * Obtient le calque actif
     * @returns {Object|null} Calque actif
     */
    getActiveLayer() {
        return this.getLayer(this.activeLayerId);
    }

    /**
     * Exporte les données des calques
     * @returns {Array} Données des calques
     */
    exportLayers() {
        return this.layers.map(layer => ({
            ...layer,
            objects: [...layer.objects] // Copie du tableau
        }));
    }

    /**
     * Importe les données des calques
     * @param {Array} layersData - Données des calques
     */
    importLayers(layersData) {
        this.layers = layersData.map(layer => ({
            ...layer,
            objects: [...layer.objects] // Copie du tableau
        }));
        
        if (this.layers.length > 0) {
            this.activeLayerId = this.layers[0].id;
            this.nextLayerId = Math.max(...this.layers.map(l => l.id)) + 1;
        } else {
            this.createDefaultLayer();
        }
        
        this.updateLayerPanel();
    }

    /**
     * Réinitialise tous les calques
     */
    resetLayers() {
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerId = 1;
        this.createDefaultLayer();
        this.updateLayerPanel();
    }
}