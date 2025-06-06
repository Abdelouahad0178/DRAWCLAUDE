/**
 * Module de création des objets architecturaux
 */

class ArchitecturalObjects {
    /**
     * Création d'une porte
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet porte
     */
    static createDoor(x, y, opacity) {
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
    static createWindow(x, y, opacity) {
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
    static createStairs(x1, y1, x2, y2, opacity) {
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
    static createElevator(x, y, opacity) {
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
    static createVoile(x1, y1, x2, y2, color, strokeWidth, opacity) {
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
    static createGaine(x1, y1, x2, y2, color, strokeWidth, opacity) {
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
    static createTechSpace(x, y, opacity) {
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
     * Création d'objets simples (rectangle, cercle, ligne, texte)
     * @param {string} type - Type d'objet
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {Object} properties - Propriétés de l'objet
     * @returns {fabric.Object} Objet créé
     */
    static createSimpleObject(type, x1, y1, x2, y2, properties) {
        const { strokeColor, fillColor, strokeWidth, opacity } = properties;
        
        switch(type) {
            case 'wall':
            case 'line':
                const distance = calculateDistance(x1, y1, x2, y2);
                if (distance > 5) {
                    const line = new fabric.Line([x1, y1, x2, y2], {
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        opacity: opacity,
                        selectable: true,
                        type: type
                    });
                    return line;
                }
                break;

            case 'rectangle':
                const width = Math.abs(x2 - x1);
                const height = Math.abs(y2 - y1);
                const rectWidth = width > 5 ? width : 50;
                const rectHeight = height > 5 ? height : 50;
                
                const rect = new fabric.Rect({
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
                return rect;

            case 'circle':
                const radiusCalc = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
                const radius = radiusCalc > 5 ? radiusCalc : 25;
                
                const circle = new fabric.Circle({
                    left: radiusCalc > 5 ? x1 - radius : x1 - 25,
                    top: radiusCalc > 5 ? y1 - radius : y1 - 25,
                    radius: radius,
                    fill: fillColor,
                    stroke: strokeColor,
                    strokeWidth: strokeWidth,
                    opacity: opacity,
                    type: 'circle'
                });
                return circle;

            case 'text':
                const text = prompt('Entrez le texte:');
                if (text && text.trim() !== '' && text.length <= 100) {
                    const textObj = new fabric.Text(text.trim(), {
                        left: x1,
                        top: y1,
                        fill: strokeColor,
                        fontSize: 16,
                        opacity: opacity,
                        fontFamily: 'Arial, sans-serif',
                        type: 'text'
                    });
                    return textObj;
                }
                break;
        }
        
        return null;
    }

    /**
     * Création d'objets architecturaux additionnels
     */

    /**
     * Création d'un poteau
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet poteau
     */
    static createColumn(x, y, opacity) {
        const column = new fabric.Rect({
            left: -15,
            top: -15,
            width: 30,
            height: 30,
            fill: '#C0C0C0',
            stroke: '#808080',
            strokeWidth: 3
        });

        const hatch1 = new fabric.Line([-15, -15, 15, 15], {
            stroke: '#808080',
            strokeWidth: 1
        });

        const hatch2 = new fabric.Line([-15, 15, 15, -15], {
            stroke: '#808080',
            strokeWidth: 1
        });

        const label = new fabric.Text('P', {
            left: 0,
            top: 0,
            fontSize: 16,
            fill: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([column, hatch1, hatch2, label], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'column';
        group.customType = 'column';
        return group;
    }

    /**
     * Création d'une poutre
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet poutre
     */
    static createBeam(x1, y1, x2, y2, opacity) {
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        const beam = new fabric.Rect({
            left: 0,
            top: -10,
            width: length,
            height: 20,
            fill: '#D3D3D3',
            stroke: '#808080',
            strokeWidth: 2
        });

        // Hachures pour indiquer qu'il s'agit d'une poutre
        const hatches = [];
        for (let i = 0; i < length; i += 20) {
            const hatch = new fabric.Line([i, -10, i + 10, 10], {
                stroke: '#808080',
                strokeWidth: 1
            });
            hatches.push(hatch);
        }

        const group = new fabric.Group([beam, ...hatches], {
            left: x1,
            top: y1,
            angle: angle,
            opacity: opacity
        });
        
        group.type = 'beam';
        group.customType = 'beam';
        return group;
    }

    /**
     * Création d'une porte-fenêtre
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet porte-fenêtre
     */
    static createFrenchDoor(x, y, opacity) {
        const frame = new fabric.Rect({
            left: -40,
            top: -5,
            width: 80,
            height: 10,
            fill: '#8B4513',
            stroke: '#654321',
            strokeWidth: 2
        });

        const glass1 = new fabric.Rect({
            left: -38,
            top: -3,
            width: 35,
            height: 6,
            fill: '#E6E6FA',
            stroke: '#4682B4',
            strokeWidth: 1
        });

        const glass2 = new fabric.Rect({
            left: 3,
            top: -3,
            width: 35,
            height: 6,
            fill: '#E6E6FA',
            stroke: '#4682B4',
            strokeWidth: 1
        });

        const divider = new fabric.Line([0, -5, 0, 5], {
            stroke: '#654321',
            strokeWidth: 2
        });

        const handle1 = new fabric.Circle({
            left: -10,
            top: 0,
            radius: 1.5,
            fill: '#FFD700'
        });

        const handle2 = new fabric.Circle({
            left: 10,
            top: 0,
            radius: 1.5,
            fill: '#FFD700'
        });

        const group = new fabric.Group([frame, glass1, glass2, divider, handle1, handle2], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'french-door';
        group.customType = 'french-door';
        return group;
    }

    /**
     * Création d'une baie vitrée
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet baie vitrée
     */
    static createBayWindow(x, y, opacity) {
        const frame = new fabric.Rect({
            left: -60,
            top: -5,
            width: 120,
            height: 10,
            fill: '#E6E6FA',
            stroke: '#4682B4',
            strokeWidth: 3
        });

        const divisions = [];
        for (let i = -40; i <= 40; i += 20) {
            const division = new fabric.Line([i, -5, i, 5], {
                stroke: '#4682B4',
                strokeWidth: 1
            });
            divisions.push(division);
        }

        const topLine = new fabric.Line([-60, -5, 60, -5], {
            stroke: '#4682B4',
            strokeWidth: 2
        });

        const bottomLine = new fabric.Line([-60, 5, 60, 5], {
            stroke: '#4682B4',
            strokeWidth: 2
        });

        const group = new fabric.Group([frame, ...divisions, topLine, bottomLine], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'bay-window';
        group.customType = 'bay-window';
        return group;
    }

    /**
     * Création d'une rampe
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet rampe
     */
    static createRamp(x1, y1, x2, y2, opacity) {
        const width = Math.abs(x2 - x1) || 100;
        const height = Math.abs(y2 - y1) || 60;
        
        const ramp = new fabric.Rect({
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: width,
            height: height,
            fill: '#F5F5DC',
            stroke: '#8B4513',
            strokeWidth: 2
        });

        // Lignes de direction pour indiquer la pente
        const lines = [];
        for (let i = 10; i < width; i += 15) {
            const line = new fabric.Line([i, 10, i + 10, height - 10], {
                stroke: '#8B4513',
                strokeWidth: 1,
                strokeDashArray: [3, 3]
            });
            lines.push(line);
        }

        const label = new fabric.Text('RAMPE', {
            left: width / 2,
            top: height / 2,
            fontSize: 12,
            fill: '#8B4513',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([ramp, ...lines, label], {
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            opacity: opacity
        });
        
        group.type = 'ramp';
        group.customType = 'ramp';
        return group;
    }

    /**
     * Création d'un balcon
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet balcon
     */
    static createBalcony(x, y, opacity) {
        const floor = new fabric.Rect({
            left: -50,
            top: -30,
            width: 100,
            height: 60,
            fill: '#F0F0F0',
            stroke: '#808080',
            strokeWidth: 2
        });

        const railing = new fabric.Rect({
            left: -50,
            top: -35,
            width: 100,
            height: 5,
            fill: 'transparent',
            stroke: '#666666',
            strokeWidth: 3
        });

        // Barreaux de garde-corps
        const balusters = [];
        for (let i = -40; i <= 40; i += 20) {
            const baluster = new fabric.Line([i, -35, i, -30], {
                stroke: '#666666',
                strokeWidth: 2
            });
            balusters.push(baluster);
        }

        const label = new fabric.Text('BALCON', {
            left: 0,
            top: 0,
            fontSize: 10,
            fill: '#666666',
            fontFamily: 'Arial, sans-serif',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([floor, railing, ...balusters, label], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'balcony';
        group.customType = 'balcony';
        return group;
    }

    /**
     * Création d'un système CVC
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet CVC
     */
    static createHVAC(x, y, opacity) {
        const unit = new fabric.Rect({
            left: -25,
            top: -20,
            width: 50,
            height: 40,
            fill: '#D3D3D3',
            stroke: '#808080',
            strokeWidth: 2
        });

        const fan = new fabric.Circle({
            left: 0,
            top: 0,
            radius: 12,
            fill: 'transparent',
            stroke: '#333333',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center'
        });

        const blades = [];
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180;
            const x1 = Math.cos(angle) * 8;
            const y1 = Math.sin(angle) * 8;
            const x2 = Math.cos(angle + Math.PI/2) * 4;
            const y2 = Math.sin(angle + Math.PI/2) * 4;
            
            const blade = new fabric.Line([x1, y1, x2, y2], {
                stroke: '#333333',
                strokeWidth: 2
            });
            blades.push(blade);
        }

        const label = new fabric.Text('CVC', {
            left: 0,
            top: 25,
            fontSize: 8,
            fill: '#333333',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([unit, fan, ...blades, label], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'hvac';
        group.customType = 'hvac';
        return group;
    }

    /**
     * Création d'un élément électrique
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} opacity - Opacité de l'objet
     * @returns {fabric.Group} Objet électrique
     */
    static createElectrical(x, y, opacity) {
        const box = new fabric.Rect({
            left: -15,
            top: -15,
            width: 30,
            height: 30,
            fill: '#FFFF99',
            stroke: '#FF6600',
            strokeWidth: 2
        });

        const lightning = new fabric.Text('⚡', {
            left: 0,
            top: 0,
            fontSize: 16,
            fill: '#FF6600',
            originX: 'center',
            originY: 'center'
        });

        const group = new fabric.Group([box, lightning], {
            left: x,
            top: y,
            opacity: opacity
        });
        
        group.type = 'electrical';
        group.customType = 'electrical';
        return group;
    }

    /**
     * Création d'un polygone
     * @param {Array} points - Points du polygone [{x, y}, ...]
     * @param {Object} properties - Propriétés de l'objet
     * @returns {fabric.Polygon} Objet polygone
     */
    static createPolygon(points, properties) {
        if (points.length < 3) return null;

        const polygon = new fabric.Polygon(points, {
            fill: properties.fillColor,
            stroke: properties.strokeColor,
            strokeWidth: properties.strokeWidth,
            opacity: properties.opacity,
            type: 'polygon'
        });
        
        return polygon;
    }

    /**
     * Création d'une flèche
     * @param {number} x1 - Coordonnée X de départ
     * @param {number} y1 - Coordonnée Y de départ
     * @param {number} x2 - Coordonnée X de fin
     * @param {number} y2 - Coordonnée Y de fin
     * @param {Object} properties - Propriétés de l'objet
     * @returns {fabric.Group} Objet flèche
     */
    static createArrow(x1, y1, x2, y2, properties) {
        const line = new fabric.Line([x1, y1, x2, y2], {
            stroke: properties.strokeColor,
            strokeWidth: properties.strokeWidth,
            opacity: properties.opacity
        });

        // Calcul de l'angle de la flèche
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 15;
        const headAngle = Math.PI / 6;

        // Pointe de la flèche
        const arrowHead = new fabric.Polygon([
            { x: x2, y: y2 },
            { 
                x: x2 - headLength * Math.cos(angle - headAngle), 
                y: y2 - headLength * Math.sin(angle - headAngle) 
            },
            { 
                x: x2 - headLength * Math.cos(angle + headAngle), 
                y: y2 - headLength * Math.sin(angle + headAngle) 
            }
        ], {
            fill: properties.strokeColor,
            stroke: properties.strokeColor,
            strokeWidth: 1,
            opacity: properties.opacity
        });

        const group = new fabric.Group([line, arrowHead]);
        group.type = 'arrow';
        group.customType = 'arrow';
        return group;
    }

    /**
     * Création d'une étiquette
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {string} text - Texte de l'étiquette
     * @param {Object} properties - Propriétés de l'objet
     * @returns {fabric.Group} Objet étiquette
     */
    static createLabel(x, y, text, properties) {
        const padding = 5;
        const textObj = new fabric.Text(text, {
            fontSize: 14,
            fill: properties.strokeColor,
            fontFamily: 'Arial, sans-serif'
        });

        const background = new fabric.Rect({
            left: -padding,
            top: -padding,
            width: textObj.width + padding * 2,
            height: textObj.height + padding * 2,
            fill: properties.fillColor,
            stroke: properties.strokeColor,
            strokeWidth: properties.strokeWidth,
            opacity: properties.opacity,
            rx: 3,
            ry: 3
        });

        const group = new fabric.Group([background, textObj], {
            left: x,
            top: y
        });
        
        group.type = 'label';
        group.customType = 'label';
        return group;
    }

    /**
     * Mise à jour de la méthode recreateComplexObject pour inclure les nouveaux objets
     */
    static recreateComplexObject(objData) {
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
                case 'column':
                    return this.createColumn(left, top, opacity);
                case 'beam':
                    const beamWidth = objData.width || 100;
                    return this.createBeam(left, top, left + beamWidth, top, opacity);
                case 'french-door':
                    return this.createFrenchDoor(left, top, opacity);
                case 'bay-window':
                    return this.createBayWindow(left, top, opacity);
                case 'ramp':
                    const rampWidth = objData.width || 100;
                    const rampHeight = objData.height || 60;
                    return this.createRamp(left, top, left + rampWidth, top + rampHeight, opacity);
                case 'balcony':
                    return this.createBalcony(left, top, opacity);
                case 'hvac':
                    return this.createHVAC(left, top, opacity);
                case 'electrical':
                    return this.createElectrical(left, top, opacity);
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
}