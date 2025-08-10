/**
 * Tool Manager Module
 * 
 * Manages editor tools and their interactions including select, add island,
 * add circle, and delete tools. Handles tool switching and cursor updates.
 * 
 * @module ToolManager
 */

export class ToolManager {
    constructor(editor) {
        this.editor = editor;
        
        // Available tools
        this.tools = {
            select: {
                name: 'Select',
                icon: '🎯',
                cursor: 'default'
            },
            addIsland: {
                name: 'Add Island',
                icon: '🏝️',
                cursor: 'crosshair'
            },
            addCircle: {
                name: 'Add Circle',
                icon: '⭕',
                cursor: 'crosshair'
            },
            delete: {
                name: 'Delete',
                icon: '🗑️',
                cursor: 'not-allowed'
            }
        };
    }
    
    /**
     * Set the active tool
     * @param {string} toolName - Name of the tool to activate
     */
    setTool(toolName) {
        if (!this.tools[toolName]) {
            console.error(`Unknown tool: ${toolName}`);
            return;
        }
        
        this.editor.currentTool = toolName;
        
        // Update UI button states
        this.updateToolButtons(toolName);
        
        // Update cursor
        this.updateCursor(toolName);
        
        // Update status bar
        this.editor.uiManager.updateStatusBar();
        
        console.log(`Tool changed to: ${toolName}`);
    }
    
    /**
     * Update tool button states in UI
     * @private
     * @param {string} activeTool - Name of active tool
     */
    updateToolButtons(activeTool) {
        // Remove active class from all tool buttons
        document.querySelectorAll('.tool-palette .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tool button
        const toolButton = document.getElementById(activeTool + 'Tool');
        if (toolButton) {
            toolButton.classList.add('active');
        }
    }
    
    /**
     * Update cursor based on active tool
     * @private
     * @param {string} toolName - Name of active tool
     */
    updateCursor(toolName) {
        const tool = this.tools[toolName];
        this.editor.canvas.style.cursor = tool ? tool.cursor : 'default';
    }
    
    /**
     * Handle click action for select tool
     */
    handleSelectClick() {
        const mouse = this.editor.mouse;
        
        // Check if clicking on a collision circle
        const circleResult = this.editor.collisionManager.getCircleAt(mouse.worldX, mouse.worldY);
        if (circleResult) {
            this.editor.selectIsland(circleResult.island);
            this.editor.selectCircle(circleResult.circle);
            return;
        }
        
        // Check if clicking on an island
        const island = this.editor.islandManager.getIslandAt(mouse.worldX, mouse.worldY);
        if (island) {
            this.editor.selectIsland(island);
            this.editor.selectCircle(null);
        } else {
            // Deselect if clicking on empty space
            this.editor.selectIsland(null);
            this.editor.selectCircle(null);
        }
    }
    
    /**
     * Handle click action for add island tool
     */
    handleAddIslandClick() {
        const mouse = this.editor.mouse;
        const newIsland = this.editor.islandManager.addIsland(mouse.worldX, mouse.worldY);
        
        // Select the newly created island
        this.editor.selectIsland(newIsland);
        this.editor.uiManager.updateIslandsList();
    }
    
    /**
     * Handle click action for add circle tool
     */
    handleAddCircleClick() {
        if (!this.editor.selectedIsland) {
            alert('Please select an island first');
            return;
        }
        
        const mouse = this.editor.mouse;
        const offsetX = mouse.worldX - this.editor.selectedIsland.x;
        const offsetY = mouse.worldY - this.editor.selectedIsland.y;
        
        const newCircle = this.editor.collisionManager.addCircle(
            this.editor.selectedIsland, 
            offsetX, 
            offsetY
        );
        
        // Select the newly created circle
        this.editor.selectCircle(newCircle);
        this.editor.uiManager.updateCollisionCirclesList();
    }
    
    /**
     * Handle click action for delete tool
     */
    handleDeleteClick() {
        const mouse = this.editor.mouse;
        
        // Check if clicking on a collision circle
        const circleResult = this.editor.collisionManager.getCircleAt(mouse.worldX, mouse.worldY);
        if (circleResult) {
            if (confirm(`Delete collision circle from ${circleResult.island.name}?`)) {
                this.editor.collisionManager.deleteCircle(circleResult.island, circleResult.circle);
                this.editor.selectCircle(null);
                this.editor.uiManager.updateCollisionCirclesList();
                this.editor.render();
            }
            return;
        }
        
        // Check if clicking on an island
        const island = this.editor.islandManager.getIslandAt(mouse.worldX, mouse.worldY);
        if (island) {
            if (confirm(`Delete island "${island.name}"?`)) {
                this.editor.islandManager.deleteIsland(island);
                this.editor.uiManager.updateIslandsList();
                this.editor.render();
            }
        }
    }
    
    /**
     * Process tool click based on current tool
     */
    processToolClick() {
        switch (this.editor.currentTool) {
            case 'select':
                this.handleSelectClick();
                break;
            case 'addIsland':
                this.handleAddIslandClick();
                break;
            case 'addCircle':
                this.handleAddCircleClick();
                break;
            case 'delete':
                this.handleDeleteClick();
                break;
        }
    }
    
    /**
     * Handle tool-specific drag operations
     * @returns {boolean} True if drag was handled by tool
     */
    handleToolDrag() {
        if (this.editor.currentTool === 'select' && 
            this.editor.selectedCircle && 
            this.editor.selectedIsland) {
            
            // Drag selected circle
            const mouse = this.editor.mouse;
            this.editor.selectedCircle.x = mouse.worldX - this.editor.selectedIsland.x;
            this.editor.selectedCircle.y = mouse.worldY - this.editor.selectedIsland.y;
            
            // Update UI to reflect changes
            this.editor.uiManager.updateSelectedCircleUI();
            this.editor.render();
            
            return true; // Drag was handled
        }
        
        return false; // Drag not handled by tool
    }
}