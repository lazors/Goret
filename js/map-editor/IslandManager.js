/**
 * Island Manager Module
 * 
 * Handles all island-related operations including creation, selection,
 * deletion, property updates, and island data management.
 * 
 * @module IslandManager
 */

export class IslandManager {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Add a new island at specified position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Object} The newly created island
     */
    addIsland(x, y) {
        // Save state before adding island
        this.editor.undoManager.saveState('add island');
        
        const newIsland = {
            name: `Island ${this.editor.islands.length + 1}`,
            x: x,
            y: y,
            radius: 400,  // Default radius for new islands
            scale: 1.0,
            rotation: 0,
            imageFilename: null,
            image: null,
            collisionCircles: [
                { x: 0, y: 0, radius: 200 }
            ]
        };
        
        this.editor.islands.push(newIsland);
        console.log(`Added new island: ${newIsland.name} at (${Math.round(x)}, ${Math.round(y)})`);
        
        return newIsland;
    }
    
    /**
     * Add island from selected PNG asset
     * @param {string} pngFilename - Filename of the PNG asset
     * @returns {Object} The newly created island
     */
    addIslandFromPNG(pngFilename) {
        // Save state before adding island
        this.editor.undoManager.saveState('add island from PNG');
        
        const image = this.editor.pngAssetManager.getLoadedImage(pngFilename);
        if (!image) {
            alert('PNG image not loaded properly');
            return null;
        }
        
        const newIsland = {
            name: pngFilename.replace('.png', '').replace('_', ' '),
            x: this.editor.worldWidth / 2,
            y: this.editor.worldHeight / 2,
            radius: Math.max(image.width, image.height) / 2,  // Calculate radius from image size
            scale: 1.0,
            rotation: 0,
            imageFilename: pngFilename,
            image: image,
            collisionCircles: []
        };
        
        // Auto-generate collision circles
        this.editor.collisionManager.generateCirclesForIsland(newIsland);
        
        this.editor.islands.push(newIsland);
        console.log(`Added island from PNG: ${pngFilename}`);
        
        return newIsland;
    }
    
    /**
     * Delete specified island
     * @param {Object} island - Island to delete
     */
    deleteIsland(island) {
        // Save state before deleting island
        this.editor.undoManager.saveState('delete island');
        
        const index = this.editor.islands.indexOf(island);
        if (index > -1) {
            const islandName = island.name;
            this.editor.islands.splice(index, 1);
            console.log(`Deleted island: ${islandName}`);
            
            // Clear selection if deleted island was selected
            if (this.editor.selectedIsland === island) {
                this.editor.selectIsland(null);
            }
        }
    }
    
    /**
     * Update island properties from UI inputs
     * @param {Object} island - Island to update
     * @param {Object} properties - Properties to update
     */
    updateIslandProperties(island, properties) {
        if (!island) return;
        
        // Save state before updating properties
        this.editor.undoManager.saveState('update island properties');
        
        // Update properties
        if (properties.name !== undefined) island.name = properties.name;
        if (properties.x !== undefined) island.x = parseFloat(properties.x) || 0;
        if (properties.y !== undefined) island.y = parseFloat(properties.y) || 0;
        if (properties.scale !== undefined) island.scale = parseFloat(properties.scale) || 1.0;
        if (properties.rotation !== undefined) island.rotation = properties.rotation;
        
        console.log(`Updated island: ${island.name}`);
    }
    
    /**
     * Change island's PNG image
     * @param {Object} island - Island to update
     * @param {string} filename - New PNG filename
     */
    changeIslandImage(island, filename) {
        if (!island) return;
        
        if (!filename) {
            island.imageFilename = null;
            island.image = null;
        } else {
            island.imageFilename = filename;
            island.image = this.editor.pngAssetManager.getLoadedImage(filename);
        }
    }
    
    /**
     * Find island at specified world coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Object|null} Island at position or null
     */
    getIslandAt(x, y) {
        for (let island of this.editor.islands) {
            if (island.image) {
                // Check against image bounds
                const scale = island.scale || 1.0;
                const halfWidth = (island.image.width * scale) / 2;
                const halfHeight = (island.image.height * scale) / 2;
                
                if (x >= island.x - halfWidth &&
                    x <= island.x + halfWidth &&
                    y >= island.y - halfHeight &&
                    y <= island.y + halfHeight) {
                    return island;
                }
            } else {
                // Fallback to circle collision
                const dx = x - island.x;
                const dy = y - island.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= 200) { // Default radius
                    return island;
                }
            }
        }
        return null;
    }
    
    /**
     * Get island by index
     * @param {number} index - Island index
     * @returns {Object|null} Island or null
     */
    getIslandByIndex(index) {
        return this.editor.islands[index] || null;
    }
    
    /**
     * Calculate effective radius from collision circles
     * @param {Object} island - Island to calculate radius for
     * @returns {number} Calculated radius
     */
    calculateRadiusFromCircles(island) {
        if (!island.collisionCircles || island.collisionCircles.length === 0) {
            return 400; // Default radius
        }
        
        let maxRadius = 0;
        island.collisionCircles.forEach(circle => {
            const distance = Math.sqrt(circle.x * circle.x + circle.y * circle.y) + circle.radius;
            maxRadius = Math.max(maxRadius, distance);
        });
        
        return maxRadius;
    }
    
    /**
     * Handle island selection
     * @param {Object} island - Selected island
     */
    onIslandSelected(island) {
        if (island) {
            document.getElementById('islandPropsSection').style.display = 'block';
            document.getElementById('collisionSection').style.display = 'block';
            console.log(`Selected island: ${island.name}`);
        } else {
            document.getElementById('islandPropsSection').style.display = 'none';
            document.getElementById('collisionSection').style.display = 'none';
        }
        
        this.editor.uiManager.updateIslandsList();
        this.editor.uiManager.updateCollisionCirclesList();
    }
    
    /**
     * Validate all islands for issues
     * @returns {Array} Array of validation issues
     */
    validateIslands() {
        const issues = [];
        
        this.editor.islands.forEach(island => {
            // Check for missing collision circles
            if (!island.collisionCircles || island.collisionCircles.length === 0) {
                issues.push(`Island "${island.name}" has no collision circles`);
            }
            
            // Check for islands outside world bounds
            if (island.x < 0 || island.x > this.editor.worldWidth || 
                island.y < 0 || island.y > this.editor.worldHeight) {
                issues.push(`Island "${island.name}" is outside world bounds`);
            }
        });
        
        return issues;
    }
}