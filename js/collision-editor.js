/**
 * Pirate Game - Interactive Collision Editor
 * Visual editor for island collision boundaries in debug mode
 */

class CollisionEditor {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.selectedIsland = null;
        this.selectedPointIndex = -1;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.hoverPointIndex = -1;
        this.hoverIslandId = null;
        
        // UI elements
        this.editorPanel = null;
        this.pointsList = null;
        this.codeOutput = null;
        
        // Mouse interaction
        this.mousePos = { x: 0, y: 0 };
        this.worldMousePos = { x: 0, y: 0 };
        
        // Editor settings
        this.pointRadius = 8;
        this.hoverRadius = 12;
        this.snapDistance = 10;
        
        this.setupEventListeners();
        this.createEditorUI();
        
        console.log('🎨 Collision Editor initialized');
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
        this.editorPanel.id = 'collisionEditor';
        this.editorPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 350px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
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
                <h3 style="margin: 0; color: #3498db;">🎨 Collision Editor</h3>
                <p style="margin: 5px 0; font-size: 11px; color: #bdc3c7;">
                    <strong>Controls:</strong> Ctrl+E: Toggle | Shift+A: Add Point | Del: Delete Point | Ctrl+S: Save
                </p>
                <p style="margin: 5px 0; font-size: 11px; color: #bdc3c7;">
                    <strong>Mouse:</strong> Click to select point | Drag to move | Right-click near edge to add point
                </p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1;">Select Island:</label>
                <select id="islandSelector" style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #3498db;">
                    <option value="">-- Select Island --</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ecf0f1;">Collision Points:</label>
                <div id="pointsList" style="max-height: 200px; overflow-y: auto; background: #2c3e50; border: 1px solid #34495e; padding: 8px;">
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
                <textarea id="codeOutput" style="width: 100%; height: 150px; background: #2c3e50; color: #2ecc71; border: 1px solid #34495e; padding: 8px; font-family: 'Courier New', monospace; font-size: 11px; resize: vertical;" readonly placeholder="Select an island to generate code..."></textarea>
            </div>
            
            <div>
                <button id="copyCodeBtn" style="width: 32%; padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 2%;">Copy Code</button>
                <button id="exportAllBtn" style="width: 32%; padding: 8px; background: #16a085; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 2%;">Export All</button>
                <button id="closeEditorBtn" style="width: 32%; padding: 8px; background: #34495e; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        document.body.appendChild(this.editorPanel);
        
        // Get references to UI elements
        this.islandSelector = document.getElementById('islandSelector');
        this.pointsList = document.getElementById('pointsList');
        this.codeOutput = document.getElementById('codeOutput');
        
        // Setup UI event listeners
        this.setupUIEventListeners();
    }
    
    setupUIEventListeners() {
        // Island selector
        this.islandSelector.addEventListener('change', (e) => {
            this.selectIsland(e.target.value);
        });
        
        // Buttons
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
        
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyCodeToClipboard();
        });
        
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportAllIslandsCode();
        });
        
        document.getElementById('closeEditorBtn').addEventListener('click', () => {
            this.toggleEditor();
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
            hint.textContent = '🎨 COLLISION EDITOR ACTIVE';
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
            this.updatePointsList();
            this.updateCodeOutput();
            return;
        }
        
        const index = parseInt(islandIndex);
        if (this.game.map && this.game.map.islands[index]) {
            this.selectedIsland = this.game.map.islands[index];
            this.selectedPointIndex = -1;
            this.updatePointsList();
            this.updateCodeOutput();
            console.log('🏝️ Selected island:', this.selectedIsland.name);
        }
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
                     onclick="window.game.collisionEditor.selectPoint(${index})">
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
        if (!this.isActive || !this.selectedIsland) return false;
        
        this.updateMousePosition(e);
        
        // Check if clicking on a point
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
        
        // If no island is selected, show all island outlines subtly
        if (!this.selectedIsland && this.game.map && this.game.map.islands) {
            this.drawAllIslandOutlines(ctx);
            return;
        }
        
        if (!this.selectedIsland || !this.selectedIsland.outline) return;
        
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
window.CollisionEditor = CollisionEditor;