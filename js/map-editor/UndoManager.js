/**
 * GORET Map Editor - Undo Manager
 * 
 * Manages undo/redo history for map editor actions.
 * Tracks state changes and allows reverting to previous states.
 * 
 * @module UndoManager
 * @version 1.0.0
 */

export class UndoManager {
    constructor(mapEditor) {
        this.mapEditor = mapEditor;
        
        // History stack for undo operations
        this.undoStack = [];
        this.maxHistorySize = 50; // Limit history to prevent memory issues
        
        // Current state snapshot
        this.currentState = null;
        
        // Flag to prevent recursive history tracking
        this.isUndoing = false;
        
        console.log('✅ UndoManager initialized');
    }
    
    /**
     * Save the current state before making changes
     * @param {string} actionType - Type of action being performed
     */
    saveState(actionType = 'unknown') {
        if (this.isUndoing) return; // Don't save state during undo operations
        
        const state = {
            timestamp: Date.now(),
            actionType: actionType,
            islands: this.serializeIslands(),
            selectedIslandId: this.mapEditor.selectedIsland?.name || null,
            selectedCircleIndex: this.getSelectedCircleIndex(),
            viewport: {
                zoom: this.mapEditor.zoom,
                offsetX: this.mapEditor.offsetX,
                offsetY: this.mapEditor.offsetY
            }
        };
        
        // Add to undo stack
        this.undoStack.push(state);
        
        // Limit stack size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift(); // Remove oldest state
        }
        
        console.log(`📝 State saved: ${actionType} (Stack size: ${this.undoStack.length})`);
    }
    
    /**
     * Serialize current islands state
     */
    serializeIslands() {
        return this.mapEditor.islands.map(island => {
            const serialized = {
                name: island.name,
                x: island.x,
                y: island.y,
                radius: island.radius,
                scale: island.scale || 1,
                rotation: island.rotation || 0,
                imageFilename: island.imageFilename || null,
                hasImage: !!island.image,  // Track if image was present
                collisionCircles: island.collisionCircles ? 
                    island.collisionCircles.map(circle => ({
                        x: circle.x,
                        y: circle.y,
                        radius: circle.radius
                    })) : [],
                townArea: island.townArea ? {
                    x: island.townArea.x,
                    y: island.townArea.y,
                    radius: island.townArea.radius
                } : null
            };
            
            // Log serialization for debugging
            if (island.image && !island.imageFilename) {
                console.warn(`⚠️ Island ${island.name} has image but no imageFilename!`);
            }
            
            return serialized;
        });
    }
    
    /**
     * Get selected circle index if any
     */
    getSelectedCircleIndex() {
        if (!this.mapEditor.selectedCircle || !this.mapEditor.selectedIsland) {
            return null;
        }
        
        const circles = this.mapEditor.selectedIsland.collisionCircles;
        if (!circles) return null;
        
        return circles.indexOf(this.mapEditor.selectedCircle);
    }
    
    /**
     * Undo the last action
     */
    undo() {
        if (this.undoStack.length === 0) {
            console.log('⚠️ Nothing to undo');
            return false;
        }
        
        // Get previous state
        const previousState = this.undoStack.pop();
        
        // Set flag to prevent recursive history tracking
        this.isUndoing = true;
        
        try {
            // Restore islands
            this.restoreIslands(previousState.islands);
            
            // Restore selection
            this.restoreSelection(previousState.selectedIslandId, previousState.selectedCircleIndex);
            
            // Optionally restore viewport (can be disabled if unwanted)
            // this.restoreViewport(previousState.viewport);
            
            // Update UI
            this.mapEditor.uiManager.updateAll();
            
            // Force re-render
            this.mapEditor.renderEngine.render();
            
            console.log(`↩️ Undid action: ${previousState.actionType}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error during undo:', error);
            return false;
        } finally {
            this.isUndoing = false;
        }
    }
    
    /**
     * Restore islands from saved state
     */
    restoreIslands(savedIslands) {
        // Clear current islands
        this.mapEditor.islands = [];
        
        // Restore each island
        savedIslands.forEach(savedIsland => {
            const island = {
                name: savedIsland.name,
                x: savedIsland.x,
                y: savedIsland.y,
                radius: savedIsland.radius,
                scale: savedIsland.scale || 1,
                rotation: savedIsland.rotation || 0,
                imageFilename: savedIsland.imageFilename,
                collisionCircles: [],
                townArea: savedIsland.townArea || null
            };
            
            // Restore collision circles
            if (savedIsland.collisionCircles) {
                island.collisionCircles = savedIsland.collisionCircles.map(circle => ({
                    x: circle.x,
                    y: circle.y,
                    radius: circle.radius
                }));
            }
            
            // Try to restore image reference if available
            if (island.imageFilename) {
                // Get the image from the PNGAssetManager's loaded images
                const loadedImage = this.mapEditor.pngAssetManager.getLoadedImage(island.imageFilename);
                if (loadedImage) {
                    island.image = loadedImage;
                    console.log(`✅ Restored image for ${island.name}: ${island.imageFilename}`);
                } else {
                    // If not found in loaded images, try to find in available PNGs
                    const pngAsset = this.mapEditor.pngAssetManager.availablePNGs.find(
                        png => png.filename === island.imageFilename
                    );
                    if (pngAsset && pngAsset.image) {
                        island.image = pngAsset.image;
                        console.log(`✅ Restored image from available PNGs for ${island.name}: ${island.imageFilename}`);
                    } else {
                        console.warn(`⚠️ Could not restore image for ${island.name}: ${island.imageFilename}`);
                    }
                }
            }
            
            this.mapEditor.islands.push(island);
        });
        
        // Update island list UI
        this.mapEditor.uiManager.updateIslandsList();
    }
    
    /**
     * Restore selection state
     */
    restoreSelection(islandName, circleIndex) {
        this.mapEditor.selectedIsland = null;
        this.mapEditor.selectedCircle = null;
        
        if (islandName) {
            const island = this.mapEditor.islands.find(i => i.name === islandName);
            if (island) {
                this.mapEditor.selectIsland(island);
                
                if (circleIndex !== null && island.collisionCircles) {
                    const circle = island.collisionCircles[circleIndex];
                    if (circle) {
                        this.mapEditor.selectCircle(circle);
                    }
                }
            }
        }
    }
    
    /**
     * Restore viewport position and zoom
     */
    restoreViewport(viewport) {
        if (viewport) {
            this.mapEditor.zoom = viewport.zoom;
            this.mapEditor.offsetX = viewport.offsetX;
            this.mapEditor.offsetY = viewport.offsetY;
        }
    }
    
    /**
     * Clear undo history
     */
    clearHistory() {
        this.undoStack = [];
        console.log('🗑️ Undo history cleared');
    }
    
    /**
     * Get current history size
     */
    getHistorySize() {
        return this.undoStack.length;
    }
    
    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
}