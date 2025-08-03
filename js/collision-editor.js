/**
 * Pirate Game - Interactive Map Editor
 * Visual editor for islands, collision boundaries, and map assets
 */

class MapEditor {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.selectedIsland = null;
        this.selectedPointIndex = -1;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.hoverPointIndex = -1;
        this.hoverIslandId = null;
        
        // Island selection and transformation
        this.islandTransform = {
            scale: 1,
            rotation: 0,
            originalRadius: 0
        };
        this.controlPointDrag = {
            active: false,
            type: null, // 'resize' or 'rotate'
            startPos: { x: 0, y: 0 },
            startValue: 0
        };
        
        // UI elements
        this.editorPanel = null;
        this.pointsList = null;
        this.codeOutput = null;
        this.imageInput = null;
        
        // Mouse interaction
        this.mousePos = { x: 0, y: 0 };
        this.worldMousePos = { x: 0, y: 0 };
        
        // Editor settings
        this.pointRadius = 8;
        this.hoverRadius = 12;
        this.snapDistance = 10;
        this.controlPointRadius = 10;
        
        this.setupEventListeners();
        this.createEditorUI();
        
        console.log('🗺️ Map Editor initialized');
    }
    
    setupEventListeners() {
        // Mouse events for dragging collision points
        this.game.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.game.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.game.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.game.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE' && e.ctrlKey) {
                e.preventDefault();
                this.toggleEditor();
            }
            if (e.code === 'KeyS' && e.ctrlKey && this.isActive) {
                e.preventDefault();
                this.saveCurrentIsland();
            }
            if (e.code === 'Delete' && this.selectedPointIndex >= 0) {
                e.preventDefault();
                this.deleteSelectedPoint();
            }
            if (e.code === 'KeyA' && this.selectedIsland && e.shiftKey) {
                e.preventDefault();
                this.addPointAtMouse();
            }
        });
    }
    
    createEditorUI() {
        // Create editor panel
        this.editorPanel = document.createElement('div');
        this.editorPanel.id = 'mapEditor';
        this.editorPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 380px;
            max-height: 85vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 1000;
            display: none;
            overflow-y: auto;
        `;
        
        this.editorPanel.innerHTML = `
            <div style="border-bottom: 1px solid #3498db; padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #3498db;">🗺️ Map Editor</h3>
                <p style="margin: 5px 0; font-size: 11px; color: #bdc3c7;">
                    <strong>Controls:</strong> Ctrl+E: Toggle | Shift+A: Add Point | Del: Delete Point | Ctrl+S: Save
                </p>
                <p style="margin: 5px 0; font-size: 11px; color: #bdc3c7;">
                    <strong>Mouse:</strong> Ctrl+Click: Select Island | Drag: Move Points/Resize/Rotate | Right-click: Add Point
                </p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1; font-weight: bold;">🏝️ Island Management:</label>
                <div style="margin-bottom: 10px;">
                    <input type="file" id="imageInput" accept="image/*" style="display: none;">
                    <button id="addIslandBtn" style="width: 31%; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1.5%;">📍 Add Island</button>
                    <button id="importImageBtn" style="width: 31%; padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1.5%;">🖼️ Import</button>
                    <button id="deleteIslandBtn" style="width: 31%; padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Delete</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="placeOnMapBtn" style="width: 48%; padding: 8px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4%; display: none;">📍 Place on Map</button>
                    <button id="saveToAssetsBtn" style="width: 48%; padding: 8px; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">💾 Save to Assets</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="importSettingsBtn" style="width: 100%; padding: 8px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">⚙️ Import Island to Project</button>
                </div>
                <div id="placementInstructions" style="display: none; background: #2c3e50; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
                    <p style="margin: 0; font-size: 11px; color: #f39c12;">📍 Click on the map to place the island at that location</p>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1;">Select Island:</label>
                <select id="islandSelector" style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #3498db;">
                    <option value="">-- Select Island --</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;" id="islandPropertiesSection" style="display: none;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1;">Island Properties:</label>
                <div style="background: #2c3e50; border: 1px solid #34495e; padding: 8px; border-radius: 4px;">
                    <label style="display: block; margin: 5px 0; font-size: 11px;">Name:</label>
                    <input type="text" id="islandNameInput" style="width: 100%; padding: 4px; background: #34495e; color: white; border: 1px solid #3498db; border-radius: 3px;">
                    <label style="display: block; margin: 5px 0; font-size: 11px;">Position:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="number" id="islandXInput" placeholder="X" style="width: 50%; padding: 4px; background: #34495e; color: white; border: 1px solid #3498db; border-radius: 3px;">
                        <input type="number" id="islandYInput" placeholder="Y" style="width: 50%; padding: 4px; background: #34495e; color: white; border: 1px solid #3498db; border-radius: 3px;">
                    </div>
                    <label style="display: block; margin: 5px 0; font-size: 11px;">Radius:</label>
                    <input type="number" id="islandRadiusInput" style="width: 100%; padding: 4px; background: #34495e; color: white; border: 1px solid #3498db; border-radius: 3px;">
                    <button id="updateIslandBtn" style="width: 100%; padding: 6px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px;">Update Island</button>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1;">Collision Points:</label>
                <div id="pointsList" style="max-height: 180px; overflow-y: auto; background: #2c3e50; border: 1px solid #34495e; padding: 8px;">
                    <p style="color: #7f8c8d; margin: 0;">Select an island to edit points</p>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="addPointBtn" style="width: 48%; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4%;">Add Point</button>
                <button id="resetBtn" style="width: 48%; padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="optimizeBtn" style="width: 48%; padding: 8px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4%;">Optimize</button>
                <button id="validateBtn" style="width: 48%; padding: 8px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer;">Validate</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1;">Generated Code:</label>
                <textarea id="codeOutput" style="width: 100%; height: 120px; background: #2c3e50; color: #2ecc71; border: 1px solid #34495e; padding: 8px; font-family: 'Courier New', monospace; font-size: 11px; resize: vertical;" readonly placeholder="Select an island to generate code..."></textarea>
            </div>
            
            <div style="margin-bottom: 10px;">
                <button id="copyCodeBtn" style="width: 19%; padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1%;">Copy Code</button>
                <button id="exportAllBtn" style="width: 19%; padding: 8px; background: #16a085; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1%;">Export All</button>
                <button id="saveToFileBtn" style="width: 19%; padding: 8px; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1%;">💾 Save to JS</button>
                <button id="saveToProjectBtn" style="width: 19%; padding: 8px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1%;">⚙️ To Project</button>
                <button id="closeEditorBtn" style="width: 19%; padding: 8px; background: #34495e; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        document.body.appendChild(this.editorPanel);
        
        // Get references to UI elements
        this.islandSelector = document.getElementById('islandSelector');
        this.pointsList = document.getElementById('pointsList');
        this.codeOutput = document.getElementById('codeOutput');
        this.imageInput = document.getElementById('imageInput');
        this.islandNameInput = document.getElementById('islandNameInput');
        this.islandXInput = document.getElementById('islandXInput');
        this.islandYInput = document.getElementById('islandYInput');
        this.islandRadiusInput = document.getElementById('islandRadiusInput');
        this.islandPropertiesSection = document.getElementById('islandPropertiesSection');
        this.placeOnMapBtn = document.getElementById('placeOnMapBtn');
        this.saveToAssetsBtn = document.getElementById('saveToAssetsBtn');
        this.importSettingsBtn = document.getElementById('importSettingsBtn');
        this.placementInstructions = document.getElementById('placementInstructions');
        
        // Island placement state
        this.placementMode = false;
        this.pendingIslandImage = null;
        this.pendingIslandName = '';
        
        // Setup UI event listeners
        this.setupUIEventListeners();
    }
    
    setupUIEventListeners() {
        // Island selector
        this.islandSelector.addEventListener('change', (e) => {
            this.selectIsland(e.target.value);
        });
        
        // Island management buttons
        document.getElementById('addIslandBtn').addEventListener('click', () => {
            this.addNewIsland();
        });
        
        document.getElementById('importImageBtn').addEventListener('click', () => {
            this.imageInput.click();
        });
        
        document.getElementById('deleteIslandBtn').addEventListener('click', () => {
            this.deleteSelectedIsland();
        });
        
        // Image input handler
        this.imageInput.addEventListener('change', (e) => {
            this.handleImageImport(e);
        });
        
        // Island placement buttons
        document.getElementById('placeOnMapBtn').addEventListener('click', () => {
            this.enablePlacementMode();
        });
        
        document.getElementById('saveToAssetsBtn').addEventListener('click', () => {
            this.saveIslandToAssets();
        });
        
        document.getElementById('importSettingsBtn').addEventListener('click', () => {
            this.importIslandToProject();
        });
        
        // Island properties
        document.getElementById('updateIslandBtn').addEventListener('click', () => {
            this.updateIslandProperties();
        });
        
        this.islandNameInput.addEventListener('change', () => {
            this.updateIslandName();
        });
        
        // Point editing buttons
        document.getElementById('addPointBtn').addEventListener('click', () => {
            this.addPointAtMouse();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetCurrentIsland();
        });
        
        document.getElementById('optimizeBtn').addEventListener('click', () => {
            this.optimizeSelectedIsland();
        });
        
        document.getElementById('validateBtn').addEventListener('click', () => {
            this.validateCurrentIsland();
        });
        
        // Code export buttons
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyCodeToClipboard();
        });
        
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportAllIslandsCode();
        });
        
        document.getElementById('saveToFileBtn').addEventListener('click', () => {
            this.saveCollisionToFile();
        });
        
        document.getElementById('saveToProjectBtn').addEventListener('click', () => {
            this.saveCollisionToProject();
        });
        
        document.getElementById('closeEditorBtn').addEventListener('click', () => {
            this.toggleEditor();
        });
        
        // Drag and drop for images
        this.editorPanel.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editorPanel.style.borderColor = '#27ae60';
        });
        
        this.editorPanel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editorPanel.style.borderColor = '#3498db';
        });
        
        this.editorPanel.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editorPanel.style.borderColor = '#3498db';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageFile(files[0]);
            }
        });
    }
    
    toggleEditor() {
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            this.editorPanel.style.display = 'block';
            this.populateIslandSelector();
            this.showEditorHint();
            console.log('🎨 Collision Editor activated - Ctrl+E to toggle');
        } else {
            this.editorPanel.style.display = 'none';
            this.selectedIsland = null;
            this.selectedPointIndex = -1;
            this.isDragging = false;
            this.hideEditorHint();
            console.log('🎨 Collision Editor deactivated');
        }
    }
    
    showEditorHint() {
        // Create a status indicator
        if (!document.getElementById('editorHint')) {
            const hint = document.createElement('div');
            hint.id = 'editorHint';
            hint.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(52, 152, 219, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                font-weight: bold;
                z-index: 999;
                pointer-events: none;
            `;
            hint.textContent = '🗺️ MAP EDITOR ACTIVE';
            document.body.appendChild(hint);
        }
    }
    
    hideEditorHint() {
        const hint = document.getElementById('editorHint');
        if (hint) {
            hint.remove();
        }
    }
    
    populateIslandSelector() {
        this.islandSelector.innerHTML = '<option value="">-- Select Island --</option>';
        
        if (this.game.map && this.game.map.islands) {
            this.game.map.islands.forEach((island, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${island.name || 'Island ' + (index + 1)} (${island.outline?.points?.length || 0} points)`;
                this.islandSelector.appendChild(option);
            });
        }
    }
    
    selectIsland(islandIndex) {
        if (islandIndex === '') {
            this.selectedIsland = null;
            this.selectedPointIndex = -1;
            this.islandPropertiesSection.style.display = 'none';
            this.updatePointsList();
            this.updateCodeOutput();
            return;
        }
        
        const index = parseInt(islandIndex);
        if (this.game.map && this.game.map.islands[index]) {
            this.selectedIsland = this.game.map.islands[index];
            this.selectedPointIndex = -1;
            this.islandPropertiesSection.style.display = 'block';
            this.updateIslandPropertiesUI();
            this.updatePointsList();
            this.updateCodeOutput();
            console.log('🏝️ Selected island:', this.selectedIsland.name);
        }
    }
    
    updateIslandPropertiesUI() {
        if (!this.selectedIsland) return;
        
        this.islandNameInput.value = this.selectedIsland.name || '';
        this.islandXInput.value = this.selectedIsland.x || 0;
        this.islandYInput.value = this.selectedIsland.y || 0;
        this.islandRadiusInput.value = this.selectedIsland.radius || 100;
    }
    
    updatePointsList() {
        if (!this.selectedIsland || !this.selectedIsland.outline || !this.selectedIsland.outline.points) {
            this.pointsList.innerHTML = '<p style="color: #7f8c8d; margin: 0;">No points available</p>';
            return;
        }
        
        const points = this.selectedIsland.outline.points;
        let html = '';
        
        points.forEach((point, index) => {
            const isSelected = index === this.selectedPointIndex;
            const bgColor = isSelected ? '#3498db' : '#34495e';
            
            html += `
                <div style="background: ${bgColor}; padding: 4px 8px; margin: 2px 0; border-radius: 3px; cursor: pointer; font-size: 11px;" 
                     onclick="window.game.mapEditor.selectPoint(${index})">
                    Point ${index}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})
                </div>
            `;
        });
        
        this.pointsList.innerHTML = html;
    }
    
    selectPoint(index) {
        this.selectedPointIndex = index;
        this.updatePointsList();
    }
    
    updateCodeOutput() {
        if (!this.selectedIsland || !this.selectedIsland.outline || !this.selectedIsland.outline.points) {
            this.codeOutput.value = '// Select an island to generate code';
            return;
        }
        
        const points = this.selectedIsland.outline.points;
        const islandName = this.selectedIsland.name || 'Island';
        
        let code = `// ${islandName} - ${points.length} collision points\n`;
        code += `const ${this.camelCase(islandName)}Points = [\n`;
        
        points.forEach((point, index) => {
            const comma = index < points.length - 1 ? ',' : '';
            code += `    { x: ${point.x.toFixed(1)}, y: ${point.y.toFixed(1)} }${comma}\n`;
        });
        
        code += `];\n\n`;
        code += `// Usage in generateCustomOutline():\n`;
        code += `return {\n`;
        code += `    points: ${this.camelCase(islandName)}Points,\n`;
        code += `    bounds: this.calculateOutlineBounds(${this.camelCase(islandName)}Points)\n`;
        code += `};`;
        
        this.codeOutput.value = code;
    }
    
    camelCase(str) {
        return str.toLowerCase()
                  .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
                  .replace(/^[^a-zA-Z]/, '');
    }
    
    handleMouseDown(e) {
        if (!this.isActive) return false;
        
        // Handle island placement mode
        if (this.placementMode && this.pendingIslandImage) {
            this.placeIslandAtMouse(e);
            return true;
        }
        
        this.updateMousePosition(e);
        
        // Check for Ctrl+Click island selection
        if (e.ctrlKey) {
            const clickedIsland = this.getIslandAtMouse();
            if (clickedIsland) {
                this.selectIslandDirectly(clickedIsland);
                e.preventDefault();
                e.stopPropagation();
                return true;
            }
        }
        
        if (!this.selectedIsland) return false;
        
        // Check if clicking on a control point (resize/rotate handles)
        const controlPoint = this.getControlPointAtMouse();
        if (controlPoint) {
            this.startControlPointDrag(controlPoint, e);
            e.preventDefault();
            e.stopPropagation();
            return true;
        }
        
        // Check if clicking on a collision point
        const pointIndex = this.getPointAtMouse();
        if (pointIndex >= 0) {
            this.selectedPointIndex = pointIndex;
            this.isDragging = true;
            
            const point = this.selectedIsland.outline.points[pointIndex];
            const worldPoint = this.localToWorld(point, this.selectedIsland);
            
            this.dragOffset.x = this.worldMousePos.x - worldPoint.x;
            this.dragOffset.y = this.worldMousePos.y - worldPoint.y;
            
            this.updatePointsList();
            e.preventDefault();
            e.stopPropagation();
            return true; // Indicate that the event was handled
        }
        
        return false; // Event not handled, let it bubble
    }
    
    handleMouseMove(e) {
        if (!this.isActive) return false;
        
        this.updateMousePosition(e);
        
        // Handle control point dragging (resize/rotate)
        if (this.controlPointDrag.active && this.selectedIsland) {
            this.updateControlPointDrag();
            e.preventDefault();
            e.stopPropagation();
            return true;
        }
        
        if (this.isDragging && this.selectedPointIndex >= 0 && this.selectedIsland) {
            // Update point position
            const newWorldPos = {
                x: this.worldMousePos.x - this.dragOffset.x,
                y: this.worldMousePos.y - this.dragOffset.y
            };
            
            const newLocalPos = this.worldToLocal(newWorldPos, this.selectedIsland);
            this.selectedIsland.outline.points[this.selectedPointIndex] = newLocalPos;
            
            // Update bounds
            this.selectedIsland.outline.bounds = this.game.map.calculateOutlineBounds(this.selectedIsland.outline.points);
            
            this.updatePointsList();
            this.updateCodeOutput();
            
            e.preventDefault();
            e.stopPropagation();
            return true;
        } else {
            // Update hover state
            this.hoverPointIndex = this.getPointAtMouse();
        }
        
        return false;
    }
    
    handleMouseUp(e) {
        if (this.controlPointDrag.active) {
            this.controlPointDrag.active = false;
            this.controlPointDrag.type = null;
            console.log('🎛️ Control point drag ended');
            e.preventDefault();
            e.stopPropagation();
            return true;
        }
        
        if (this.isDragging) {
            this.isDragging = false;
            console.log('🎯 Point updated:', this.selectedPointIndex);
            e.preventDefault();
            e.stopPropagation();
            return true;
        }
        return false;
    }
    
    handleRightClick(e) {
        if (!this.isActive || !this.selectedIsland) return false;
        
        e.preventDefault();
        e.stopPropagation();
        this.updateMousePosition(e);
        this.addPointAtMouse();
        return true;
    }
    
    updateMousePosition(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        // Convert to world coordinates
        this.worldMousePos = this.screenToWorld(this.mousePos);
    }
    
    screenToWorld(screenPos) {
        // Account for canvas transformations (zoom and camera)
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        
        // Reverse the transformations applied in render()
        const worldX = ((screenPos.x - centerX) / this.game.zoom) + this.game.cameraX;
        const worldY = ((screenPos.y - centerY) / this.game.zoom) + this.game.cameraY;
        
        return { x: worldX, y: worldY };
    }
    
    localToWorld(localPos, island) {
        return {
            x: island.x + localPos.x,
            y: island.y + localPos.y
        };
    }
    
    worldToLocal(worldPos, island) {
        return {
            x: worldPos.x - island.x,
            y: worldPos.y - island.y
        };
    }
    
    // New methods for island selection and control points
    getIslandAtMouse() {
        if (!this.game.map || !this.game.map.islands) return null;
        
        for (let island of this.game.map.islands) {
            const distance = Math.sqrt(
                Math.pow(this.worldMousePos.x - island.x, 2) +
                Math.pow(this.worldMousePos.y - island.y, 2)
            );
            
            // Check if mouse is within island radius
            if (distance <= island.radius) {
                return island;
            }
        }
        
        return null;
    }
    
    selectIslandDirectly(island) {
        this.selectedIsland = island;
        this.selectedPointIndex = -1;
        
        // Initialize transform data
        this.islandTransform.scale = 1;
        this.islandTransform.rotation = 0;
        this.islandTransform.originalRadius = island.radius;
        
        // Update UI
        const islandIndex = this.game.map.islands.indexOf(island);
        this.islandSelector.value = islandIndex;
        this.islandPropertiesSection.style.display = 'block';
        this.updateIslandPropertiesUI();
        this.updatePointsList();
        this.updateCodeOutput();
        
        console.log('🏝️ Selected island via Ctrl+Click:', island.name);
    }
    
    getControlPointAtMouse() {
        if (!this.selectedIsland) return null;
        
        const island = this.selectedIsland;
        const checkRadius = this.controlPointRadius / this.game.zoom;
        
        // Get control point positions
        const controlPoints = this.getControlPointPositions(island);
        
        for (let controlPoint of controlPoints) {
            const distance = Math.sqrt(
                Math.pow(this.worldMousePos.x - controlPoint.x, 2) +
                Math.pow(this.worldMousePos.y - controlPoint.y, 2)
            );
            
            if (distance <= checkRadius) {
                return controlPoint;
            }
        }
        
        return null;
    }
    
    getControlPointPositions(island) {
        const radius = island.radius * this.islandTransform.scale;
        const controlPoints = [];
        
        // Resize control points at corners of bounding box
        const corners = [
            { x: island.x - radius, y: island.y - radius, type: 'resize', corner: 'nw' },
            { x: island.x + radius, y: island.y - radius, type: 'resize', corner: 'ne' },
            { x: island.x + radius, y: island.y + radius, type: 'resize', corner: 'se' },
            { x: island.x - radius, y: island.y + radius, type: 'resize', corner: 'sw' }
        ];
        
        // Rotation control point at top center
        const rotatePoint = {
            x: island.x,
            y: island.y - radius - 30,
            type: 'rotate'
        };
        
        return [...corners, rotatePoint];
    }
    
    startControlPointDrag(controlPoint, e) {
        this.controlPointDrag.active = true;
        this.controlPointDrag.type = controlPoint.type;
        this.controlPointDrag.startPos = { x: this.worldMousePos.x, y: this.worldMousePos.y };
        
        if (controlPoint.type === 'resize') {
            this.controlPointDrag.startValue = this.islandTransform.scale;
        } else if (controlPoint.type === 'rotate') {
            this.controlPointDrag.startValue = this.islandTransform.rotation;
        }
        
        console.log('🎛️ Started control point drag:', controlPoint.type);
    }
    
    updateControlPointDrag() {
        if (!this.controlPointDrag.active || !this.selectedIsland) return;
        
        const island = this.selectedIsland;
        const deltaX = this.worldMousePos.x - this.controlPointDrag.startPos.x;
        const deltaY = this.worldMousePos.y - this.controlPointDrag.startPos.y;
        
        if (this.controlPointDrag.type === 'resize') {
            // Calculate distance from island center to mouse for scaling
            const currentDistance = Math.sqrt(
                Math.pow(this.worldMousePos.x - island.x, 2) +
                Math.pow(this.worldMousePos.y - island.y, 2)
            );
            const originalDistance = this.islandTransform.originalRadius;
            
            // Update scale
            this.islandTransform.scale = Math.max(0.1, currentDistance / originalDistance);
            
            // Update island radius
            island.radius = this.islandTransform.originalRadius * this.islandTransform.scale;
            
            // Update UI
            this.updateIslandPropertiesUI();
            
        } else if (this.controlPointDrag.type === 'rotate') {
            // Calculate rotation angle
            const angle1 = Math.atan2(
                this.controlPointDrag.startPos.y - island.y,
                this.controlPointDrag.startPos.x - island.x
            );
            const angle2 = Math.atan2(
                this.worldMousePos.y - island.y,
                this.worldMousePos.x - island.x
            );
            
            this.islandTransform.rotation = this.controlPointDrag.startValue + (angle2 - angle1);
            
            // Apply rotation to collision points if they exist
            if (island.outline && island.outline.points) {
                this.rotateIslandPoints(island, angle2 - angle1);
            }
        }
    }
    
    rotateIslandPoints(island, rotationDelta) {
        if (!island.outline || !island.outline.points) return;
        
        const cos = Math.cos(rotationDelta);
        const sin = Math.sin(rotationDelta);
        
        // Rotate each collision point around island center
        island.outline.points = island.outline.points.map(point => {
            const rotatedX = point.x * cos - point.y * sin;
            const rotatedY = point.x * sin + point.y * cos;
            
            return { x: rotatedX, y: rotatedY };
        });
        
        // Update bounds
        island.outline.bounds = this.game.map.calculateOutlineBounds(island.outline.points);
        
        this.updatePointsList();
        this.updateCodeOutput();
    }
    
    getPointAtMouse() {
        if (!this.selectedIsland || !this.selectedIsland.outline || !this.selectedIsland.outline.points) {
            return -1;
        }
        
        const points = this.selectedIsland.outline.points;
        const checkRadius = this.pointRadius / this.game.zoom; // Account for zoom
        
        for (let i = 0; i < points.length; i++) {
            const worldPoint = this.localToWorld(points[i], this.selectedIsland);
            const distance = Math.sqrt(
                Math.pow(this.worldMousePos.x - worldPoint.x, 2) +
                Math.pow(this.worldMousePos.y - worldPoint.y, 2)
            );
            
            if (distance <= checkRadius) {
                return i;
            }
        }
        
        return -1;
    }
    
    addPointAtMouse() {
        if (!this.selectedIsland || !this.selectedIsland.outline) return;
        
        const localPos = this.worldToLocal(this.worldMousePos, this.selectedIsland);
        
        // Find the best position to insert the new point
        const points = this.selectedIsland.outline.points;
        let insertIndex = points.length;
        let minDistance = Infinity;
        
        // Find the closest edge to insert the point
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const p1 = points[i];
            const p2 = points[nextIndex];
            
            // Calculate distance from mouse to line segment
            const distance = this.distanceToLineSegment(localPos, p1, p2);
            
            if (distance < minDistance) {
                minDistance = distance;
                insertIndex = nextIndex;
            }
        }
        
        // Insert the new point
        points.splice(insertIndex, 0, localPos);
        
        // Update bounds
        this.selectedIsland.outline.bounds = this.game.map.calculateOutlineBounds(points);
        
        this.selectedPointIndex = insertIndex;
        this.updatePointsList();
        this.updateCodeOutput();
        
        console.log('➕ Added point at index:', insertIndex);
    }
    
    deleteSelectedPoint() {
        if (!this.selectedIsland || !this.selectedIsland.outline || this.selectedPointIndex < 0) return;
        
        const points = this.selectedIsland.outline.points;
        if (points.length <= 3) {
            alert('Cannot delete point: Island must have at least 3 points');
            return;
        }
        
        points.splice(this.selectedPointIndex, 1);
        
        // Update bounds
        this.selectedIsland.outline.bounds = this.game.map.calculateOutlineBounds(points);
        
        this.selectedPointIndex = -1;
        this.updatePointsList();
        this.updateCodeOutput();
        
        console.log('➖ Deleted point');
    }
    
    resetCurrentIsland() {
        if (!this.selectedIsland) return;
        
        if (confirm('Reset island collision points to original shape?')) {
            // Regenerate outline from image or use manual outline
            if (this.selectedIsland.image) {
                try {
                    this.selectedIsland.outline = this.game.map.generateOutlineFromImage(
                        this.selectedIsland.image, 
                        this.selectedIsland.radius
                    );
                } catch (error) {
                    this.selectedIsland.outline = this.game.map.generateManualOutline(this.selectedIsland.radius);
                }
            } else {
                this.selectedIsland.outline = this.game.map.generateManualOutline(this.selectedIsland.radius);
            }
            
            this.selectedPointIndex = -1;
            this.updatePointsList();
            this.updateCodeOutput();
            
            console.log('🔄 Reset island outline');
        }
    }
    
    addNewIsland() {
        const islandName = prompt('Enter island name:', 'New Island');
        if (!islandName) return;
        
        const x = parseFloat(prompt('Enter X position:', '0')) || 0;
        const y = parseFloat(prompt('Enter Y position:', '0')) || 0;
        const radius = parseFloat(prompt('Enter radius:', '150')) || 150;
        
        const newIsland = {
            name: islandName,
            x: x,
            y: y,
            radius: radius,
            outline: this.game.map.generateManualOutline(radius),
            image: null
        };
        
        this.game.map.islands.push(newIsland);
        this.populateIslandSelector();
        
        // Select the new island
        this.islandSelector.value = this.game.map.islands.length - 1;
        this.selectIsland(this.game.map.islands.length - 1);
        
        console.log('🏝️ Added new island:', islandName);
    }
    
    deleteSelectedIsland() {
        if (!this.selectedIsland) {
            alert('No island selected');
            return;
        }
        
        const islandName = this.selectedIsland.name || 'Island';
        if (confirm(`Delete "${islandName}"? This action cannot be undone.`)) {
            const islandIndex = this.game.map.islands.indexOf(this.selectedIsland);
            if (islandIndex >= 0) {
                this.game.map.islands.splice(islandIndex, 1);
                this.selectedIsland = null;
                this.selectedPointIndex = -1;
                this.islandPropertiesSection.style.display = 'none';
                this.populateIslandSelector();
                this.updatePointsList();
                this.updateCodeOutput();
                console.log('🗑️ Deleted island:', islandName);
            }
        }
    }
    
    handleImageImport(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleImageFile(file);
        }
    }
    
    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const islandName = prompt('Enter name for this island:', file.name.split('.')[0]);
                if (!islandName) return;
                
                // Store the image for manual placement
                this.pendingIslandImage = img;
                this.pendingIslandName = islandName;
                this.pendingIslandFile = file;
                
                // Show placement controls
                this.placeOnMapBtn.style.display = 'inline-block';
                this.saveToAssetsBtn.style.display = 'inline-block';
                this.importSettingsBtn.style.display = 'inline-block';
                
                alert(`Island "${islandName}" loaded!\n\nChoose:\n- "Place on Map" to manually position it\n- "Save to Assets" to download it to Islands folder`);
                
                console.log('🖼️ Island image loaded, ready for placement:', islandName);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    enablePlacementMode() {
        if (!this.pendingIslandImage) {
            alert('No island image loaded. Please import an image first.');
            return;
        }
        
        this.placementMode = true;
        this.placementInstructions.style.display = 'block';
        this.placeOnMapBtn.textContent = '🚫 Cancel Placement';
        this.placeOnMapBtn.style.background = '#e74c3c';
        
        // Change the button to cancel placement
        this.placeOnMapBtn.onclick = () => {
            this.disablePlacementMode();
        };
        
        console.log('📍 Placement mode enabled - click on map to place island');
    }
    
    disablePlacementMode() {
        this.placementMode = false;
        this.placementInstructions.style.display = 'none';
        this.placeOnMapBtn.textContent = '📍 Place on Map';
        this.placeOnMapBtn.style.background = '#3498db';
        
        // Reset the button to enable placement
        this.placeOnMapBtn.onclick = () => {
            this.enablePlacementMode();
        };
        
        console.log('📍 Placement mode disabled');
    }
    
    placeIslandAtMouse(event) {
        if (!this.pendingIslandImage) return;
        
        this.updateMousePosition(event);
        
        const x = this.worldMousePos.x;
        const y = this.worldMousePos.y;
        const radius = parseFloat(prompt('Enter island radius:', Math.max(this.pendingIslandImage.width, this.pendingIslandImage.height) / 4)) || 150;
        
        const newIsland = {
            name: this.pendingIslandName,
            x: x,
            y: y,
            radius: radius,
            image: this.pendingIslandImage,
            imageSrc: this.pendingIslandImage.src,
            outline: null
        };
        
        // Try to generate outline from image
        try {
            newIsland.outline = this.game.map.generateOutlineFromImage(this.pendingIslandImage, radius);
        } catch (error) {
            console.warn('Could not generate outline from image, using manual outline');
            newIsland.outline = this.game.map.generateManualOutline(radius);
        }
        
        this.game.map.islands.push(newIsland);
        this.populateIslandSelector();
        
        // Select the new island
        this.islandSelector.value = this.game.map.islands.length - 1;
        this.selectIsland(this.game.map.islands.length - 1);
        
        // Disable placement mode
        this.disablePlacementMode();
        
        // Clear pending island
        this.clearPendingIsland();
        
        console.log('🏝️ Island placed at:', x, y);
        alert(`Island "${this.pendingIslandName}" placed successfully!\n\nYou can now:\n- Edit collision points\n- Adjust properties\n- Save to code`);
    }
    
    saveIslandToAssets() {
        if (!this.pendingIslandFile || !this.pendingIslandName) {
            alert('No island file to save. Please import an image first.');
            return;
        }
        
        // Create a safe filename
        const safeFileName = this.pendingIslandName.replace(/[^a-zA-Z0-9-_]/g, '_') + '.png';
        
        // Convert the image to PNG format for consistency
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.pendingIslandImage.width;
        canvas.height = this.pendingIslandImage.height;
        
        ctx.drawImage(this.pendingIslandImage, 0, 0);
        
        // Create download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = safeFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Generate asset integration code
            this.generateAssetIntegrationCode(safeFileName);
            
            console.log('💾 Island saved to downloads:', safeFileName);
        }, 'image/png');
    }
    
    generateAssetIntegrationCode(fileName) {
        const code = `
// Add this to your asset loading in main.js loadAssets() method:
{ key: '${this.pendingIslandName.toLowerCase().replace(/\s+/g, '')}', type: 'image', src: 'assets/Islands/${fileName}' },

// Then use it in map.js by updating the islands array:
{
    name: '${this.pendingIslandName}',
    x: 0, // Set your desired X coordinate
    y: 0, // Set your desired Y coordinate
    radius: 150, // Set your desired radius
    image: this.assets['${this.pendingIslandName.toLowerCase().replace(/\s+/g, '')}'] || null
}

Instructions:
1. Move the downloaded file '${fileName}' to your assets/Islands/ folder
2. Add the asset loading code to main.js
3. Add the island configuration to map.js
4. Refresh your game to see the new island

Generated on: ${new Date().toLocaleString()}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
            alert(`✅ Island "${this.pendingIslandName}" saved as ${fileName}!\n\nIntegration code copied to clipboard.\n\nNext steps:\n1. Move ${fileName} to assets/Islands/ folder\n2. Paste the code into your project files\n3. Refresh the game`);
        }).catch(() => {
            // Show code in a new window if clipboard fails
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`<pre style="font-family: monospace; padding: 20px;">${code}</pre>`);
            alert(`✅ Island "${this.pendingIslandName}" saved as ${fileName}!\n\nIntegration code opened in new window.\n\nNext steps:\n1. Move ${fileName} to assets/Islands/ folder\n2. Copy the code into your project files\n3. Refresh the game`);
        });
    }
    
    importIslandToProject() {
        if (!this.pendingIslandFile || !this.pendingIslandName || !this.pendingIslandImage) {
            alert('No island to import. Please load an image first.');
            return;
        }
        
        // Get island dimensions and properties
        const islandData = this.collectIslandSettings();
        if (!islandData) return;
        
        // Generate all necessary code and files
        this.generateProjectIntegration(islandData);
    }
    
    collectIslandSettings() {
        // Get current island dimensions
        const width = this.pendingIslandImage.width;
        const height = this.pendingIslandImage.height;
        
        // Prompt for island placement coordinates
        const x = prompt(`Enter X coordinate for ${this.pendingIslandName}:`, '0');
        if (x === null) return null;
        
        const y = prompt(`Enter Y coordinate for ${this.pendingIslandName}:`, '0');
        if (y === null) return null;
        
        const radius = prompt(`Enter collision radius for ${this.pendingIslandName}:`, Math.max(width, height) / 2);
        if (radius === null) return null;
        
        return {
            name: this.pendingIslandName,
            fileName: this.pendingIslandName.replace(/[^a-zA-Z0-9-_]/g, '_') + '.png',
            x: parseFloat(x) || 0,
            y: parseFloat(y) || 0,
            radius: parseFloat(radius) || 150,
            width: width,
            height: height,
            key: this.pendingIslandName.toLowerCase().replace(/\s+/g, '')
        };
    }
    
    generateProjectIntegration(islandData) {
        // Create safe filename
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.pendingIslandImage.width;
        canvas.height = this.pendingIslandImage.height;
        
        ctx.drawImage(this.pendingIslandImage, 0, 0);
        
        // Save the PNG file
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = islandData.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Generate complete project integration
            this.generateCompleteIntegration(islandData);
            
        }, 'image/png');
    }
    
    generateCompleteIntegration(islandData) {
        // Create comprehensive integration instructions
        const integrationCode = `/*
COMPLETE ISLAND INTEGRATION FOR ${islandData.name.toUpperCase()}

STEP 1: Move File
Move "${islandData.fileName}" to: assets/Islands/

STEP 2: Update main.js - Add to loadAssets() method
Find the assets array and add this line:
*/
{ key: '${islandData.key}', type: 'image', src: 'assets/Islands/${islandData.fileName}' },

/*
STEP 3: Update map.js - Add to islands array
Find the islands array in the Map constructor and add:
*/
{
    name: '${islandData.name}',
    x: ${islandData.x},
    y: ${islandData.y},
    radius: ${islandData.radius},
    image: null  // Will be loaded from assets
},

/*
STEP 4: Update map.js - Add asset assignment
In the Map constructor, after the islands array, add:
*/
// Assign loaded assets to islands
this.islands.forEach(island => {
    if (island.name === '${islandData.name}') {
        island.image = this.assets['${islandData.key}'] || null;
    }
});

/*
ISLAND PROPERTIES:
- Name: ${islandData.name}
- Position: ${islandData.x}, ${islandData.y}
- Radius: ${islandData.radius}
- Dimensions: ${islandData.width}×${islandData.height}
- File: ${islandData.fileName}
- Asset Key: ${islandData.key}

STEP 5: Test Integration
1. Save all files
2. Refresh your game
3. The island should appear at coordinates (${islandData.x}, ${islandData.y})

Generated on: ${new Date().toLocaleString()}
*/`;

        // Save integration instructions as a file
        const instructionsBlob = new Blob([integrationCode], { type: 'text/plain' });
        const instructionsUrl = URL.createObjectURL(instructionsBlob);
        const instructionsLink = document.createElement('a');
        instructionsLink.href = instructionsUrl;
        instructionsLink.download = `${islandData.name}_integration_instructions.txt`;
        document.body.appendChild(instructionsLink);
        instructionsLink.click();
        document.body.removeChild(instructionsLink);
        URL.revokeObjectURL(instructionsUrl);
        
        // Copy to clipboard
        navigator.clipboard.writeText(integrationCode).then(() => {
            alert(`🎯 COMPLETE INTEGRATION PACKAGE CREATED!

✅ Island File: ${islandData.fileName} (downloaded)
✅ Instructions: ${islandData.name}_integration_instructions.txt (downloaded)
✅ Code: Copied to clipboard

Next Steps:
1. Move PNG file to assets/Islands/ folder
2. Follow the downloaded integration instructions
3. Refresh your game to see the new island

Island will appear at coordinates (${islandData.x}, ${islandData.y}) with radius ${islandData.radius}.`);
        }).catch(() => {
            alert(`🎯 INTEGRATION PACKAGE CREATED!

✅ Island File: ${islandData.fileName} (downloaded)
✅ Instructions: ${islandData.name}_integration_instructions.txt (downloaded)

The integration code is in the downloaded instructions file.
Follow the steps to add the island to your project.`);
        });
        
        console.log('🎯 Complete project integration generated for:', islandData.name);
    }
    
    clearPendingIsland() {
        this.pendingIslandImage = null;
        this.pendingIslandName = '';
        this.pendingIslandFile = null;
        this.placeOnMapBtn.style.display = 'none';
        this.saveToAssetsBtn.style.display = 'none';
        this.importSettingsBtn.style.display = 'none';
        this.placementInstructions.style.display = 'none';
        this.disablePlacementMode();
    }
    
    updateIslandProperties() {
        if (!this.selectedIsland) return;
        
        const newName = this.islandNameInput.value.trim();
        const newX = parseFloat(this.islandXInput.value) || 0;
        const newY = parseFloat(this.islandYInput.value) || 0;
        const newRadius = parseFloat(this.islandRadiusInput.value) || 100;
        
        this.selectedIsland.name = newName;
        this.selectedIsland.x = newX;
        this.selectedIsland.y = newY;
        this.selectedIsland.radius = newRadius;
        
        this.populateIslandSelector();
        this.updateCodeOutput();
        
        console.log('📝 Updated island properties:', newName);
    }
    
    updateIslandName() {
        if (!this.selectedIsland) return;
        
        const newName = this.islandNameInput.value.trim();
        this.selectedIsland.name = newName;
        this.populateIslandSelector();
        this.updateCodeOutput();
    }
    
    validateCurrentIsland() {
        if (!this.selectedIsland) {
            alert('No island selected');
            return;
        }
        
        const validation = this.validateIslandOutline(this.selectedIsland);
        
        if (validation.valid) {
            const points = this.selectedIsland.outline.points;
            alert(`✅ Island outline is valid!\n\n` +
                  `Points: ${points.length}\n` +
                  `Bounds: ${JSON.stringify(this.selectedIsland.outline.bounds, null, 2)}`);
        } else {
            alert(`❌ Island outline validation failed:\n\n${validation.error}`);
        }
    }
    
    saveCurrentIsland() {
        if (!this.selectedIsland) return;
        
        console.log('💾 Saved island configuration:', this.selectedIsland.name);
        alert('Island configuration saved! Copy the generated code to preserve changes.');
    }
    
    copyCodeToClipboard() {
        if (this.codeOutput.value) {
            navigator.clipboard.writeText(this.codeOutput.value).then(() => {
                console.log('📋 Code copied to clipboard');
                alert('Code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy code:', err);
                // Fallback: select the text
                this.codeOutput.select();
                this.codeOutput.setSelectionRange(0, 99999);
            });
        }
    }
    
    exportAllIslandsCode() {
        const allIslands = this.exportAllIslands();
        
        if (allIslands.length === 0) {
            alert('No islands to export');
            return;
        }
        
        let code = '// All Islands Collision Data\n';
        code += '// Generated by Collision Editor\n\n';
        
        allIslands.forEach((island, index) => {
            const varName = this.camelCase(island.name || `island${index + 1}`);
            
            code += `// ${island.name || `Island ${index + 1}`} - ${island.points.length} collision points\n`;
            code += `const ${varName}Points = [\n`;
            
            island.points.forEach((point, pointIndex) => {
                const comma = pointIndex < island.points.length - 1 ? ',' : '';
                code += `    { x: ${point.x}, y: ${point.y} }${comma}\n`;
            });
            
            code += `];\n\n`;
            code += `const ${varName}Data = {\n`;
            code += `    name: '${island.name || `Island ${index + 1}`}',\n`;
            code += `    x: ${island.x},\n`;
            code += `    y: ${island.y},\n`;
            code += `    radius: ${island.radius},\n`;
            code += `    points: ${varName}Points,\n`;
            code += `    bounds: ${JSON.stringify(island.bounds, null, 4)}\n`;
            code += `};\n\n`;
        });
        
        code += `// All islands array\n`;
        code += `const allIslandsData = [\n`;
        allIslands.forEach((island, index) => {
            const varName = this.camelCase(island.name || `island${index + 1}`);
            const comma = index < allIslands.length - 1 ? ',' : '';
            code += `    ${varName}Data${comma}\n`;
        });
        code += `];\n\n`;
        
        code += `// Usage example:\n`;
        code += `// allIslandsData.forEach(islandData => {\n`;
        code += `//     const island = { ...islandData };\n`;
        code += `//     island.outline = {\n`;
        code += `//         points: island.points,\n`;
        code += `//         bounds: island.bounds\n`;
        code += `//     };\n`;
        code += `//     this.islands.push(island);\n`;
        code += `// });`;
        
        navigator.clipboard.writeText(code).then(() => {
            console.log('📋 All islands code copied to clipboard');
            alert(`All ${allIslands.length} islands exported to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy code:', err);
            // Show in a new window as fallback
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`<pre>${code}</pre>`);
        });
    }
    
    saveCollisionToFile() {
        if (!this.selectedIsland || !this.selectedIsland.outline || !this.selectedIsland.outline.points) {
            alert('Please select an island with collision points first');
            return;
        }
        
        const points = this.selectedIsland.outline.points;
        const islandName = this.selectedIsland.name || 'Saint Kitts';
        
        // Generate the new collision points code
        let newCode = `        // ${islandName} Island - ${points.length} collision points\n`;
        newCode += `        const saintKittsIslandPoints = [\n`;
        
        points.forEach((point, index) => {
            const comma = index < points.length - 1 ? ',' : '';
            newCode += `            { x: ${point.x.toFixed(1)}, y: ${point.y.toFixed(1)} }${comma}\n`;
        });
        
        newCode += `        ];\n\n`;
        newCode += `        // Usage in generateCustomOutline():\n`;
        newCode += `        return {\n`;
        newCode += `            points: saintKittsIslandPoints,\n`;
        newCode += `            bounds: this.calculateOutlineBounds(saintKittsIslandPoints)\n`;
        newCode += `        };`;
        
        // Create a download link for the user to save the updated map.js
        const downloadContent = `/*
UPDATED COLLISION POINTS FOR ${islandName.toUpperCase()} ISLAND

Replace the generateCustomOutline() method in map.js with this code:

generateCustomOutline(island) {
    // MANUAL COLLISION OUTLINE CONFIGURATION
    // ${islandName} Island - ${points.length} collision points (updated with collision editor)
    
${newCode}
}

Instructions:
1. Copy the entire generateCustomOutline() method above
2. Open js/map.js in your editor
3. Find the existing generateCustomOutline() method (around line 125)
4. Replace it with the code above
5. Save the file and refresh your game

Generated on: ${new Date().toLocaleString()}
*/`;

        // Create and trigger download
        const blob = new Blob([downloadContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${islandName.toLowerCase().replace(/\s+/g, '-')}-collision-update.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Also copy to clipboard
        navigator.clipboard.writeText(newCode).then(() => {
            console.log('💾 Collision points saved and copied to clipboard');
            alert(`✅ ${islandName} collision points saved to file and copied to clipboard!\n\nA text file with instructions has been downloaded.\nThe collision code is also in your clipboard ready to paste into map.js`);
        }).catch(err => {
            console.error('Failed to copy code:', err);
            alert(`✅ ${islandName} collision points saved to file!\n\nA text file with instructions has been downloaded.`);
        });
    }
    
    saveCollisionToProject() {
        if (!this.selectedIsland || !this.selectedIsland.outline || !this.selectedIsland.outline.points) {
            alert('Please select an island with collision points first');
            return;
        }
        
        const points = this.selectedIsland.outline.points;
        const islandName = this.selectedIsland.name || 'Saint Kitts';
        
        // Collect island properties for project integration
        const islandData = this.collectCollisionIslandData(islandName, points);
        if (!islandData) return;
        
        // Generate complete project integration package
        this.generateCollisionProjectIntegration(islandData);
    }
    
    collectCollisionIslandData(islandName, points) {
        // Get current island position and radius
        const currentX = this.selectedIsland.x || 0;
        const currentY = this.selectedIsland.y || 0;
        const currentRadius = this.selectedIsland.radius || 150;
        
        // Prompt for confirmation or modification of island properties
        const confirmUpdate = confirm(`Update ${islandName} collision in project?\n\nCurrent settings:\n- Position: ${currentX}, ${currentY}\n- Radius: ${currentRadius}\n- Collision Points: ${points.length}\n\nClick OK to use current settings, or Cancel to modify them.`);
        
        if (!confirmUpdate) {
            // Allow user to modify settings
            const newX = prompt(`Enter X coordinate for ${islandName}:`, currentX);
            if (newX === null) return null;
            
            const newY = prompt(`Enter Y coordinate for ${islandName}:`, currentY);
            if (newY === null) return null;
            
            const newRadius = prompt(`Enter collision radius for ${islandName}:`, currentRadius);
            if (newRadius === null) return null;
            
            return {
                name: islandName,
                x: parseFloat(newX) || currentX,
                y: parseFloat(newY) || currentY,
                radius: parseFloat(newRadius) || currentRadius,
                points: points,
                key: islandName.toLowerCase().replace(/\s+/g, '')
            };
        }
        
        return {
            name: islandName,
            x: currentX,
            y: currentY,
            radius: currentRadius,
            points: points,
            key: islandName.toLowerCase().replace(/\s+/g, '')
        };
    }
    
    generateCollisionProjectIntegration(islandData) {
        // Generate the collision points code
        let collisionCode = `        // ${islandData.name} Island - ${islandData.points.length} collision points\n`;
        collisionCode += `        const saintKittsIslandPoints = [\n`;
        
        islandData.points.forEach((point, index) => {
            const comma = index < islandData.points.length - 1 ? ',' : '';
            collisionCode += `            { x: ${point.x.toFixed(1)}, y: ${point.y.toFixed(1)} }${comma}\n`;
        });
        
        collisionCode += `        ];\n\n`;
        collisionCode += `        // Usage in generateCustomOutline():\n`;
        collisionCode += `        return {\n`;
        collisionCode += `            points: saintKittsIslandPoints,\n`;
        collisionCode += `            bounds: this.calculateOutlineBounds(saintKittsIslandPoints)\n`;
        collisionCode += `        };`;
        
        // Create comprehensive project integration instructions
        const projectIntegration = `/*
COMPLETE COLLISION UPDATE FOR ${islandData.name.toUpperCase()} ISLAND

=== PROJECT INTEGRATION PACKAGE ===

STEP 1: Update map.js - Replace generateCustomOutline() method
Find the generateCustomOutline() method in map.js (around line 125) and replace it with:

generateCustomOutline(island) {
    // MANUAL COLLISION OUTLINE CONFIGURATION
    // ${islandData.name} Island - ${islandData.points.length} collision points (updated with collision editor)
    
${collisionCode}
}

STEP 2: Update Island Configuration (if needed)
If you need to update the island position or radius, find the islands array in map.js and update:

{
    name: '${islandData.name}',
    x: ${islandData.x},
    y: ${islandData.y},
    radius: ${islandData.radius},
    image: this.assets['${islandData.key}'] || null
},

=== COLLISION SUMMARY ===
- Island: ${islandData.name}
- Position: (${islandData.x}, ${islandData.y})
- Radius: ${islandData.radius}
- Collision Points: ${islandData.points.length}
- Generated: ${new Date().toLocaleString()}

=== INTEGRATION STEPS ===
1. Open js/map.js in your code editor
2. Find and replace the generateCustomOutline() method
3. (Optional) Update island position/radius in islands array
4. Save the file
5. Refresh your game to test the new collision boundaries

=== TESTING ===
- Sail around the island to test collision detection
- Verify the ship properly bounces off the island boundaries
- Check that the collision feels natural and responsive

Generated by Map Editor - Collision Integration System
*/`;

        // Save project integration file
        const integrationBlob = new Blob([projectIntegration], { type: 'text/plain' });
        const integrationUrl = URL.createObjectURL(integrationBlob);
        const integrationLink = document.createElement('a');
        integrationLink.href = integrationUrl;
        integrationLink.download = `${islandData.name.toLowerCase().replace(/\s+/g, '-')}-project-collision-update.txt`;
        document.body.appendChild(integrationLink);
        integrationLink.click();
        document.body.removeChild(integrationLink);
        URL.revokeObjectURL(integrationUrl);
        
        // Copy collision code to clipboard
        navigator.clipboard.writeText(collisionCode).then(() => {
            alert(`🎯 COLLISION PROJECT INTEGRATION COMPLETE!

✅ Collision Code: Copied to clipboard
✅ Integration Instructions: Downloaded as ${islandData.name.toLowerCase().replace(/\s+/g, '-')}-project-collision-update.txt

Island Details:
- Name: ${islandData.name}
- Position: (${islandData.x}, ${islandData.y})
- Radius: ${islandData.radius}
- Collision Points: ${islandData.points.length}

Next Steps:
1. Open js/map.js
2. Replace generateCustomOutline() method with clipboard code
3. Save and refresh your game
4. Test the updated collision boundaries

The collision code is ready to paste into your map.js file!`);
        }).catch(() => {
            alert(`🎯 COLLISION PROJECT INTEGRATION COMPLETE!

✅ Integration Instructions: Downloaded
✅ Ready for immediate project integration

The downloaded file contains all necessary code and instructions.
Follow the steps to update your project with the new collision boundaries.`);
        });
        
        console.log('🎯 Collision project integration generated for:', islandData.name);
    }
    
    distanceToLineSegment(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Render collision editor visuals
    drawEditorOverlay(ctx) {
        if (!this.isActive) return;
        
        // Draw placement preview if in placement mode
        if (this.placementMode && this.pendingIslandImage) {
            this.drawPlacementPreview(ctx);
        }
        
        // If no island is selected, show all island outlines subtly
        if (!this.selectedIsland && this.game.map && this.game.map.islands) {
            this.drawAllIslandOutlines(ctx);
            return;
        }
        
        if (!this.selectedIsland) return;
        
        // Draw selection frame and control points first
        this.drawSelectionFrame(ctx, this.selectedIsland);
        
        if (!this.selectedIsland.outline) return;
        
        const points = this.selectedIsland.outline.points;
        
        // Draw collision points
        points.forEach((point, index) => {
            const worldPoint = this.localToWorld(point, this.selectedIsland);
            const isSelected = index === this.selectedPointIndex;
            const isHovered = index === this.hoverPointIndex;
            
            // Point circle with size based on zoom for better visibility
            const pointSize = Math.max(this.pointRadius / this.game.zoom, 4);
            
            ctx.fillStyle = isSelected ? '#e74c3c' : (isHovered ? '#f39c12' : '#3498db');
            ctx.beginPath();
            ctx.arc(worldPoint.x, worldPoint.y, pointSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Point border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = Math.max(2 / this.game.zoom, 1);
            ctx.stroke();
            
            // Point number (scale with zoom)
            ctx.fillStyle = 'white';
            ctx.font = `${Math.max(12 / this.game.zoom, 8)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(index.toString(), worldPoint.x, worldPoint.y + pointSize * 0.3);
        });
        
        // Draw connection lines between points
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
        ctx.lineWidth = Math.max(2 / this.game.zoom, 1);
        ctx.setLineDash([5 / this.game.zoom, 5 / this.game.zoom]);
        ctx.beginPath();
        
        points.forEach((point, index) => {
            const worldPoint = this.localToWorld(point, this.selectedIsland);
            if (index === 0) {
                ctx.moveTo(worldPoint.x, worldPoint.y);
            } else {
                ctx.lineTo(worldPoint.x, worldPoint.y);
            }
        });
        
        // Close the polygon
        if (points.length > 0) {
            const firstPoint = this.localToWorld(points[0], this.selectedIsland);
            ctx.lineTo(firstPoint.x, firstPoint.y);
        }
        
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        // Draw island center point for reference
        ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.beginPath();
        const centerSize = Math.max(6 / this.game.zoom, 3);
        ctx.arc(this.selectedIsland.x, this.selectedIsland.y, centerSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw island name (scale with zoom)
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(14 / this.game.zoom, 10)}px Arial`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(3 / this.game.zoom, 1);
        const nameOffset = Math.max(15 / this.game.zoom, 10);
        ctx.strokeText(this.selectedIsland.name || 'Island', this.selectedIsland.x, this.selectedIsland.y - nameOffset);
        ctx.fillText(this.selectedIsland.name || 'Island', this.selectedIsland.x, this.selectedIsland.y - nameOffset);
        
        // Draw cursor position and instructions when in editor mode
        if (this.hoverPointIndex === -1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.worldMousePos.x + 10, this.worldMousePos.y - 25, 200, 20);
            ctx.fillStyle = 'white';
            ctx.font = `${Math.max(12 / this.game.zoom, 8)}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText('Shift+A: Add Point | Del: Delete', this.worldMousePos.x + 15, this.worldMousePos.y - 10);
        }
    }
    
    drawPlacementPreview(ctx) {
        if (!this.pendingIslandImage) return;
        
        // Get current mouse position in world coordinates
        const mouseWorld = this.screenToWorld(this.mousePos);
        
        // Draw semi-transparent preview of the island image
        ctx.save();
        ctx.globalAlpha = 0.7;
        
        const size = Math.max(this.pendingIslandImage.width, this.pendingIslandImage.height) / 4;
        ctx.drawImage(
            this.pendingIslandImage,
            mouseWorld.x - size / 2,
            mouseWorld.y - size / 2,
            size,
            size
        );
        
        // Draw placement indicator
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(mouseWorld.x, mouseWorld.y, size / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw crosshairs at mouse position
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        const crossSize = 20;
        ctx.beginPath();
        ctx.moveTo(mouseWorld.x - crossSize, mouseWorld.y);
        ctx.lineTo(mouseWorld.x + crossSize, mouseWorld.y);
        ctx.moveTo(mouseWorld.x, mouseWorld.y - crossSize);
        ctx.lineTo(mouseWorld.x, mouseWorld.y + crossSize);
        ctx.stroke();
        
        // Draw instruction text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(mouseWorld.x + 30, mouseWorld.y - 40, 180, 30);
        ctx.fillStyle = '#f39c12';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Click to place "${this.pendingIslandName}"`, mouseWorld.x + 35, mouseWorld.y - 20);
        
        ctx.restore();
    }
    
    // Draw all island outlines when no specific island is selected
    drawAllIslandOutlines(ctx) {
        this.game.map.islands.forEach((island, index) => {
            if (!island.outline || !island.outline.points) return;
            
            const points = island.outline.points;
            
            // Draw subtle outline
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.lineWidth = Math.max(1 / this.game.zoom, 0.5);
            ctx.setLineDash([3 / this.game.zoom, 3 / this.game.zoom]);
            ctx.beginPath();
            
            points.forEach((point, pointIndex) => {
                const worldPoint = this.localToWorld(point, island);
                if (pointIndex === 0) {
                    ctx.moveTo(worldPoint.x, worldPoint.y);
                } else {
                    ctx.lineTo(worldPoint.x, worldPoint.y);
                }
            });
            
            // Close the polygon
            if (points.length > 0) {
                const firstPoint = this.localToWorld(points[0], island);
                ctx.lineTo(firstPoint.x, firstPoint.y);
            }
            
            ctx.stroke();
            
            // Draw island name
            ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
            ctx.font = `${Math.max(12 / this.game.zoom, 8)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
                `${island.name || `Island ${index + 1}`} (${points.length} pts)`, 
                island.x, 
                island.y - Math.max(10 / this.game.zoom, 6)
            );
        });
        
        ctx.setLineDash([]); // Reset line dash
    }
    
    // Draw selection frame with control points
    drawSelectionFrame(ctx, island) {
        const radius = island.radius * this.islandTransform.scale;
        
        // Draw selection frame (bounding box)
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = Math.max(3 / this.game.zoom, 2);
        ctx.setLineDash([8 / this.game.zoom, 4 / this.game.zoom]);
        ctx.beginPath();
        ctx.rect(
            island.x - radius,
            island.y - radius,
            radius * 2,
            radius * 2
        );
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw control points
        const controlPoints = this.getControlPointPositions(island);
        
        controlPoints.forEach(controlPoint => {
            const size = Math.max(this.controlPointRadius / this.game.zoom, 6);
            
            // Different colors for different control point types
            if (controlPoint.type === 'resize') {
                ctx.fillStyle = '#27ae60';
                ctx.strokeStyle = 'white';
            } else if (controlPoint.type === 'rotate') {
                ctx.fillStyle = '#9b59b6';
                ctx.strokeStyle = 'white';
            }
            
            ctx.lineWidth = Math.max(2 / this.game.zoom, 1);
            
            if (controlPoint.type === 'rotate') {
                // Draw rotation handle as a diamond
                ctx.save();
                ctx.translate(controlPoint.x, controlPoint.y);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-size, -size, size * 2, size * 2);
                ctx.strokeRect(-size, -size, size * 2, size * 2);
                ctx.restore();
                
                // Draw line from island center to rotation handle
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = Math.max(2 / this.game.zoom, 1);
                ctx.setLineDash([4 / this.game.zoom, 4 / this.game.zoom]);
                ctx.beginPath();
                ctx.moveTo(island.x, island.y);
                ctx.lineTo(controlPoint.x, controlPoint.y);
                ctx.stroke();
                ctx.setLineDash([]);
                
            } else {
                // Draw resize handles as circles
                ctx.beginPath();
                ctx.arc(controlPoint.x, controlPoint.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Draw corner indicator
                ctx.fillStyle = 'white';
                ctx.font = `${Math.max(10 / this.game.zoom, 6)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('↗', controlPoint.x, controlPoint.y + size * 0.3);
            }
        });
        
        // Draw island name with selection indicator
        ctx.fillStyle = '#f39c12';
        ctx.strokeStyle = 'black';
        ctx.font = `bold ${Math.max(16 / this.game.zoom, 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.lineWidth = Math.max(3 / this.game.zoom, 1);
        const nameOffset = Math.max(20 / this.game.zoom, 15);
        const selectionText = `${island.name || 'Island'} [SELECTED]`;
        ctx.strokeText(selectionText, island.x, island.y - radius - nameOffset);
        ctx.fillText(selectionText, island.x, island.y - radius - nameOffset);
        
        // Draw transformation info
        if (this.islandTransform.scale !== 1 || this.islandTransform.rotation !== 0) {
            const infoText = `Scale: ${this.islandTransform.scale.toFixed(2)} | Rotation: ${(this.islandTransform.rotation * 180 / Math.PI).toFixed(1)}°`;
            ctx.fillStyle = 'rgba(243, 156, 18, 0.8)';
            ctx.font = `${Math.max(12 / this.game.zoom, 8)}px Arial`;
            ctx.fillText(infoText, island.x, island.y + radius + nameOffset);
        }
    }
    
    // Export island data for code generation
    exportIslandData(island) {
        if (!island || !island.outline || !island.outline.points) {
            return null;
        }
        
        return {
            name: island.name,
            x: island.x,
            y: island.y,
            radius: island.radius,
            points: island.outline.points.map(p => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })),
            bounds: island.outline.bounds
        };
    }
    
    // Import island data from code
    importIslandData(islandData) {
        if (!this.selectedIsland) return;
        
        this.selectedIsland.outline = {
            points: islandData.points.map(p => ({ x: p.x, y: p.y })),
            bounds: islandData.bounds || this.game.map.calculateOutlineBounds(islandData.points)
        };
        
        this.updatePointsList();
        this.updateCodeOutput();
        console.log('📥 Imported island data for:', islandData.name);
    }
    
    // Get all islands data for batch export
    exportAllIslands() {
        if (!this.game.map || !this.game.map.islands) return [];
        
        return this.game.map.islands.map(island => this.exportIslandData(island)).filter(data => data !== null);
    }
    
    // Validate island outline
    validateIslandOutline(island) {
        if (!island || !island.outline || !island.outline.points) {
            return { valid: false, error: 'No outline data' };
        }
        
        const points = island.outline.points;
        
        if (points.length < 3) {
            return { valid: false, error: 'Need at least 3 points' };
        }
        
        // Check for duplicate points
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dx = points[i].x - points[j].x;
                const dy = points[i].y - points[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 1) {
                    return { valid: false, error: `Duplicate points at index ${i} and ${j}` };
                }
            }
        }
        
        return { valid: true };
    }
    
    // Auto-optimize island outline
    optimizeSelectedIsland() {
        if (!this.selectedIsland || !this.selectedIsland.outline) return;
        
        const points = this.selectedIsland.outline.points;
        
        // Remove points that are too close together
        const optimized = [];
        const minDistance = 5; // Minimum distance between points
        
        for (let i = 0; i < points.length; i++) {
            const current = points[i];
            const next = points[(i + 1) % points.length];
            
            const dx = current.x - next.x;
            const dy = current.y - next.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance >= minDistance) {
                optimized.push(current);
            }
        }
        
        if (optimized.length >= 3) {
            this.selectedIsland.outline.points = optimized;
            this.selectedIsland.outline.bounds = this.game.map.calculateOutlineBounds(optimized);
            
            this.updatePointsList();
            this.updateCodeOutput();
            
            console.log('🔧 Optimized island outline:', points.length, '->', optimized.length, 'points');
        }
    }
}

// Global reference for easy access from UI elements
window.MapEditor = MapEditor;