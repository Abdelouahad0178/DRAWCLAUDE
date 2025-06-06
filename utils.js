/**
 * Fonctions utilitaires pour ArchiDesign
 */

/**
 * Alignement à la grille
 * @param {number} value - Valeur à aligner
 * @param {number} gridSize - Taille de la grille
 * @param {boolean} snapEnabled - Accrochage activé
 * @returns {number} Valeur alignée
 */
function snapToGrid(value, gridSize, snapEnabled) {
    return snapEnabled ? Math.round(value / gridSize) * gridSize : value;
}

/**
 * Conversion RGB vers hexadécimal
 * @param {string} rgb - Couleur au format RGB
 * @returns {string} Couleur au format hexadécimal
 */
function rgbToHex(rgb) {
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
 * Vérifie si un point est proche d'un objet
 * @param {number} x - Coordonnée X du point
 * @param {number} y - Coordonnée Y du point
 * @param {Object} obj - Objet Fabric.js
 * @param {number} tolerance - Tolérance en pixels
 * @returns {boolean} Vrai si le point est proche
 */
function isPointNearObject(x, y, obj, tolerance) {
    const objBounds = obj.getBoundingRect();
    return (x >= objBounds.left - tolerance && 
            x <= objBounds.left + objBounds.width + tolerance &&
            y >= objBounds.top - tolerance && 
            y <= objBounds.top + objBounds.height + tolerance);
}

/**
 * Calcule la distance entre deux points
 * @param {number} x1 - X du premier point
 * @param {number} y1 - Y du premier point
 * @param {number} x2 - X du deuxième point
 * @param {number} y2 - Y du deuxième point
 * @returns {number} Distance
 */
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Obtient les propriétés actuelles depuis l'interface
 * @returns {Object} Propriétés actuelles
 */
function getCurrentProperties() {
    const strokeColorInput = document.getElementById('strokeColor');
    const fillColorInput = document.getElementById('fillColor');
    const strokeWidthInput = document.getElementById('strokeWidth');
    const opacityInput = document.getElementById('opacity');

    return {
        strokeColor: strokeColorInput?.value || '#333333',
        fillColor: fillColorInput?.value || '#ffffff',
        strokeWidth: parseInt(strokeWidthInput?.value || '2'),
        opacity: parseFloat(opacityInput?.value || '1')
    };
}

/**
 * Met à jour les éléments d'affichage des valeurs
 * @param {string} elementId - ID de l'élément
 * @param {string} value - Valeur à afficher
 */
function updateDisplayValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Sécurise les données d'objet pour la sérialisation
 * @param {Object} obj - Objet Fabric.js
 * @returns {Object} Données sécurisées
 */
function sanitizeObjectData(obj) {
    try {
        const objData = obj.toObject([
            'type', 'customType', 'left', 'top', 'width', 'height', 
            'fill', 'stroke', 'strokeWidth', 'opacity', 'angle', 
            'scaleX', 'scaleY', 'x1', 'y1', 'x2', 'y2', 'radius', 
            'text', 'fontSize', 'fontFamily'
        ]);
        
        // Nettoyer les propriétés non désirées
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
}

/**
 * Filtre les objets du canvas (exclut grille, preview, etc.)
 * @param {Array} objects - Liste des objets
 * @returns {Array} Objets filtrés
 */
function filterCanvasObjects(objects) {
    return objects.filter(obj => 
        !obj.isGrid && !obj.isPreview && !obj.isEraserIndicator
    );
}

/**
 * Génère un nom de fichier sécurisé
 * @param {string} name - Nom original
 * @param {string} extension - Extension du fichier
 * @returns {string} Nom de fichier sécurisé
 */
function generateSafeFileName(name, extension) {
    const safeName = (name || 'Mon_Plan').replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '');
    return `${safeName}.${extension}`;
}

/**
 * Throttle une fonction
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Limite en ms
 * @returns {Function} Fonction throttlée
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce une fonction (version améliorée)
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @param {boolean} immediate - Exécution immédiate
 * @returns {Function} Fonction debouncée
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}