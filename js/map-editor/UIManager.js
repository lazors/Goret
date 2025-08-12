/**
 * UI Manager Module
 * 
 * Manages all UI updates including status bar, island lists,
 * property panels, and collision circle lists.
 * 
 * @module UIManager
 */

export class UIManager {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Update all UI elements
     */
    updateAll() {
        this.updateStatusBar();
        this.updateIslandsList();
        this.updateCollisionCirclesList();
    }
    
    /**
     * Update status bar information
     */
    updateStatusBar() {
        const mouse = this.editor.mouse;
        
        // Update mouse position info
        document.getElementById('mouseInfo').textContent = 
            `Mouse: (${Math.round(mouse.x)}, ${Math.round(mouse.y)}) | ` +
            `World: (${Math.round(mouse.worldX)}, ${Math.round(mouse.worldY)})`;
        
        // Update tool info
        document.getElementById('toolInfo').textContent = 
            `Tool: ${this.editor.currentTool} | Mode: ${this.editor.debugMode ? 'Debug' : 'Normal'}`;
        
        // Update performance info
        const totalCircles = this.editor.islands.reduce(
            (sum, i) => sum + (i.collisionCircles?.length || 0), 0
        );
        
        document.getElementById('performanceInfo').textContent = 
            `FPS: ${this.editor.fps} | Islands: ${this.editor.islands.length} | Circles: ${totalCircles}`;
    }
    
    /**
     * Update islands list in UI
     */
    updateIslandsList() {
        const selector = document.getElementById('islandSelector');
        const list = document.getElementById('islandList');
        
        // Clear and update selector
        selector.innerHTML = '<option value="">-- Select Island --</option>';
        
        if (this.editor.islands.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">No islands loaded. Click "Load from Server" to begin.</div>';
            return;
        }
        
        // Build island list HTML
        let listHTML = '';
        
        this.editor.islands.forEach((island, index) => {
            // Add option to selector
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${island.name} (${island.collisionCircles?.length || 0} circles)`;
            selector.appendChild(option);
            
            // Build list item HTML
            const isSelected = island === this.editor.selectedIsland;
            const imageIcon = island.imageFilename ? '🖼️' : '⭕';
            
            listHTML += `
                <div class="island-item ${isSelected ? 'selected' : ''}" 
                     onclick="MapEditorUIBridge.selectIslandById('${index}')">
                    <div style="font-weight: bold;">${imageIcon} ${island.name}</div>
                    <div style="font-size: 10px; color: #7f8c8d;">
                        Position: (${Math.round(island.x)}, ${Math.round(island.y)}) | 
                        Circles: ${island.collisionCircles?.length || 0}
                        ${island.imageFilename ? `<br>PNG: ${island.imageFilename}` : ''}
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = listHTML;
        
        // Update selector to match selected island
        if (this.editor.selectedIsland) {
            const index = this.editor.islands.indexOf(this.editor.selectedIsland);
            if (index !== -1) {
                selector.value = index;
            }
        }
    }
    
    /**
     * Update collision circles list for selected island
     */
    updateCollisionCirclesList() {
        const list = document.getElementById('collisionCirclesList');
        
        if (!this.editor.selectedIsland || 
            !this.editor.selectedIsland.collisionCircles || 
            this.editor.selectedIsland.collisionCircles.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: #7f8c8d;">No collision circles defined</div>';
            return;
        }
        
        let listHTML = '';
        this.editor.selectedIsland.collisionCircles.forEach((circle, index) => {
            const isSelected = circle === this.editor.selectedCircle;
            listHTML += `
                <div class="circle-item ${isSelected ? 'selected' : ''}" 
                     onclick="window.mapEditor && window.mapEditor.selectCircle(window.mapEditor.selectedIsland.collisionCircles[${index}])">
                    <div>Circle ${index + 1}</div>
                    <div style="font-size: 10px; color: #7f8c8d;">
                        (${Math.round(circle.x)}, ${Math.round(circle.y)}) r:${Math.round(circle.radius)}
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = listHTML;
    }
    
    /**
     * Update island properties panel
     * @param {Object} island - Selected island
     */
    updateIslandProperties(island) {
        if (!island) {
            document.getElementById('islandPropsSection').style.display = 'none';
            document.getElementById('collisionSection').style.display = 'none';
            return;
        }
        
        // Show property panels
        document.getElementById('islandPropsSection').style.display = 'block';
        document.getElementById('collisionSection').style.display = 'block';
        
        // Update property fields
        document.getElementById('islandName').value = island.name || '';
        document.getElementById('islandX').value = Math.round(island.x);
        document.getElementById('islandY').value = Math.round(island.y);
        document.getElementById('islandScale').value = island.scale || 1.0;
        
        // Convert rotation from radians to degrees for display
        const rotationDegrees = ((island.rotation || 0) * 180 / Math.PI) % 360;
        document.getElementById('islandRotation').value = Math.round(rotationDegrees);
        
        // Update image selector
        const imageSelector = document.getElementById('islandImageSelector');
        imageSelector.value = island.imageFilename || '';
        
        // Update image preview
        this.updateIslandImagePreview(island);
    }
    
    /**
     * Update island image preview
     * @private
     * @param {Object} island - Island to show preview for
     */
    updateIslandImagePreview(island) {
        const previewDiv = document.getElementById('islandImagePreview');
        const previewImg = document.getElementById('islandPreviewImage');
        
        if (island.imageFilename) {
            const pngInfo = this.editor.pngAssetManager.getPNGInfo(island.imageFilename);
            
            if (pngInfo) {
                previewImg.src = window.location.protocol !== 'file:' 
                    ? `http://localhost:8000/${pngInfo.path}`
                    : pngInfo.path;
                previewDiv.style.display = 'block';
            } else {
                previewDiv.style.display = 'none';
            }
        } else {
            previewDiv.style.display = 'none';
        }
    }
    
    /**
     * Update circle properties panel
     * @param {Object} circle - Selected circle
     */
    updateCircleProperties(circle) {
        if (!circle) {
            document.getElementById('selectedCircleProps').style.display = 'none';
            return;
        }
        
        document.getElementById('selectedCircleProps').style.display = 'block';
        this.updateSelectedCircleUI();
    }
    
    /**
     * Update selected circle UI values
     */
    updateSelectedCircleUI() {
        const circle = this.editor.selectedCircle;
        if (!circle) return;
        
        document.getElementById('circleX').value = Math.round(circle.x);
        document.getElementById('circleY').value = Math.round(circle.y);
        document.getElementById('circleRadius').value = Math.round(circle.radius);
    }
    
    /**
     * Get island property values from UI
     * @returns {Object} Island properties
     */
    getIslandPropertiesFromUI() {
        // Convert rotation from degrees to radians
        const rotationDegrees = parseFloat(document.getElementById('islandRotation').value) || 0;
        const rotationRadians = rotationDegrees * Math.PI / 180;
        
        return {
            name: document.getElementById('islandName').value,
            x: document.getElementById('islandX').value,
            y: document.getElementById('islandY').value,
            scale: document.getElementById('islandScale').value,
            rotation: rotationRadians
        };
    }
    
    /**
     * Get circle property values from UI
     * @returns {Object} Circle properties
     */
    getCirclePropertiesFromUI() {
        return {
            x: document.getElementById('circleX').value,
            y: document.getElementById('circleY').value,
            radius: document.getElementById('circleRadius').value
        };
    }
    
    /**
     * Show loading indicator in collision circles list
     * @param {string} message - Loading message
     */
    showCollisionListLoading(message) {
        const list = document.getElementById('collisionCirclesList');
        list.innerHTML = `<div class="loading-indicator">${message}</div>`;
    }
    
    /**
     * Show protocol warning for file:// access
     */
    showProtocolWarning() {
        document.getElementById('protocolWarning').style.display = 'block';
    }
    
    /**
     * Hide protocol warning
     */
    hideProtocolWarning() {
        document.getElementById('protocolWarning').style.display = 'none';
    }
}