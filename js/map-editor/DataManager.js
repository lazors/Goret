/**
 * Data Manager Module
 * 
 * Handles loading, saving, importing, and exporting of island data.
 * Manages communication with the server and local storage.
 * 
 * @module DataManager
 */

export class DataManager {
    constructor(editor) {
        this.editor = editor;
        this.serverUrl = 'http://localhost:8001';
    }
    
    /**
     * Load islands from server
     */
    async loadFromServer() {
        try {
            console.log('📥 Loading islands from server...');
            const response = await fetch(`${this.serverUrl}/api/islands/load`);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            
            // Process loaded islands
            if (data.islands) {
                this.editor.islands = await this.processLoadedIslands(data.islands);
            } else {
                this.editor.islands = [];
            }
            
            console.log(`✅ Loaded ${this.editor.islands.length} islands from server`);
            this.editor.uiManager.updateIslandsList();
            this.editor.viewportController.fitWorld();
            
        } catch (error) {
            console.log(`❌ Failed to load from server: ${error.message}`);
            // Load default data as fallback
            this.loadDefaultData();
        }
    }
    
    /**
     * Process loaded islands data
     * @private
     * @param {Array} islands - Raw island data
     * @returns {Array} Processed islands
     */
    async processLoadedIslands(islands) {
        return await Promise.all(islands.map(async (island) => {
            // Convert old polygon collision to Multi-Circle if needed
            if (!island.collisionCircles && island.collision) {
                island.collisionCircles = this.editor.collisionManager.convertPolygonToCircles(island);
                delete island.collision;
            }
            
            // Load island image if specified
            if (island.imageFilename) {
                island.image = this.editor.pngAssetManager.getLoadedImage(island.imageFilename);
            }
            
            return island;
        }));
    }
    
    /**
     * Save islands to server
     */
    async saveToServer() {
        try {
            console.log('💾 Saving islands to server...');
            
            // Prepare islands data (exclude image objects for serialization)
            const islandsData = this.prepareIslandsForSave();
            
            const data = {
                islands: islandsData,
                worldWidth: this.editor.worldWidth,
                worldHeight: this.editor.worldHeight
            };
            
            const response = await fetch(`${this.serverUrl}/api/islands/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ Successfully saved ${this.editor.islands.length} islands to server`);
            alert('Islands saved successfully!');
            
        } catch (error) {
            console.log(`❌ Failed to save to server: ${error.message}`);
            // Fallback to local JSON export
            this.exportJSON();
        }
    }
    
    /**
     * Save and apply changes to the game
     */
    async saveAndApplyToGame() {
        try {
            console.log('🎮 Saving and applying changes to game...');
            
            // First save to server to update js/islands-data.js
            await this.saveToServer();
            
            // Update the global ISLANDS_DATA variable that the game uses
            window.ISLANDS_DATA = this.prepareIslandsForGame();
            
            // If game map is loaded, update its islands directly
            if (this.editor.gameMap) {
                this.editor.gameMap.islands = this.editor.gameMap.convertMapEditorData(window.ISLANDS_DATA);
                console.log('✅ Game map islands updated directly');
            }
            
            // Notify parent window if in iframe
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'islands-updated',
                    islands: window.ISLANDS_DATA
                }, '*');
            }
            
            console.log('✅ Changes applied to game! Refresh the game window to see changes.');
            alert('Changes saved and applied! Refresh the game window to see the updates.');
            
        } catch (error) {
            console.error('❌ Failed to save and apply:', error);
            alert('Failed to apply changes to game: ' + error.message);
        }
    }
    
    /**
     * Prepare islands data for saving
     * @private
     * @returns {Array} Islands data ready for serialization
     */
    prepareIslandsForSave() {
        return this.editor.islands.map(island => ({
            name: island.name,
            x: island.x,
            y: island.y,
            scale: island.scale || 1.0,
            imageFilename: island.imageFilename || null,
            collisionCircles: island.collisionCircles || []
        }));
    }
    
    /**
     * Prepare islands data for game usage
     * @private
     * @returns {Array} Islands data for game
     */
    prepareIslandsForGame() {
        return this.editor.islands.map(island => ({
            name: island.name,
            x: island.x,
            y: island.y,
            radius: island.radius || this.editor.islandManager.calculateRadiusFromCircles(island),
            collisionCircles: island.collisionCircles || [],
            imageFilename: island.imageFilename || null
        }));
    }
    
    /**
     * Load existing islands from islands-data.js
     */
    loadExistingIslands() {
        // Try to load from existing islands-data.js file
        if (typeof ISLANDS_DATA !== 'undefined' && Array.isArray(ISLANDS_DATA) && ISLANDS_DATA.length > 0) {
            console.log('🏝️ Loading existing islands from islands-data.js...');
            
            this.editor.islands = ISLANDS_DATA.map(island => ({
                name: island.name,
                x: island.x,
                y: island.y,
                radius: island.radius || 400,
                scale: 1.0,
                imageFilename: island.imageFilename,
                image: null,
                collisionCircles: island.collisionCircles || [{ x: 0, y: 0, radius: island.radius || 400 }]
            }));
            
            console.log(`✅ Loaded ${this.editor.islands.length} islands: ${this.editor.islands.map(i => i.name).join(', ')}`);
            
            // Set image references for each island
            this.editor.islands.forEach(island => {
                if (island.imageFilename) {
                    island.image = this.editor.pngAssetManager.getLoadedImage(island.imageFilename);
                }
            });
            
            // Update UI with loaded islands
            this.editor.uiManager.updateIslandsList();
            this.editor.viewportController.fitWorld();
        } else {
            console.log('⚠️ No existing islands found in islands-data.js, trying server...');
            // Try loading from server as fallback
            this.loadFromServer();
        }
    }
    
    /**
     * Load default island data
     * @private
     */
    loadDefaultData() {
        // Load default Multi-Circle collision data with PNG references
        this.editor.islands = [
            {
                name: 'Saint Kitts',
                x: 1810,
                y: 1655,
                scale: 1.0,
                imageFilename: 'Saint_Kitts.png',
                image: this.editor.pngAssetManager.getLoadedImage('Saint_Kitts.png'),
                collisionCircles: [
                    { x: 0, y: 0, radius: 280 },
                    { x: -160, y: -155, radius: 120 },
                    { x: 140, y: 145, radius: 100 },
                    { x: -50, y: 100, radius: 80 }
                ]
            },
            {
                name: 'Nevis',
                x: 2500,
                y: 2800,
                scale: 1.0,
                imageFilename: 'Nevis.png',
                image: this.editor.pngAssetManager.getLoadedImage('Nevis.png'),
                collisionCircles: [
                    { x: 0, y: 0, radius: 180 },
                    { x: -80, y: -60, radius: 80 },
                    { x: 70, y: 50, radius: 60 }
                ]
            }
        ];
        
        console.log('📦 Loaded default Multi-Circle island data');
        this.editor.uiManager.updateIslandsList();
        this.editor.viewportController.fitWorld();
    }
    
    /**
     * Import islands from JSON file
     */
    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.editor.islands = data.islands || data || [];
                    
                    // Load images for imported islands
                    this.editor.islands.forEach(island => {
                        if (island.imageFilename) {
                            island.image = this.editor.pngAssetManager.getLoadedImage(island.imageFilename);
                        }
                    });
                    
                    this.editor.uiManager.updateIslandsList();
                    this.editor.viewportController.fitWorld();
                    console.log(`📂 Imported ${this.editor.islands.length} islands from JSON`);
                } catch (error) {
                    console.log(`❌ Failed to import JSON: ${error.message}`);
                    alert('❌ Failed to import JSON file. Please check the file format.');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    /**
     * Export islands to JSON file
     */
    exportJSON() {
        // Prepare data for export
        const exportData = {
            worldWidth: this.editor.worldWidth,
            worldHeight: this.editor.worldHeight,
            islands: this.prepareIslandsForSave(),
            exportedAt: new Date().toISOString(),
            version: this.editor.version,
            collisionSystem: 'PNG-Based-Multi-Circle'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `goret-world-png-multicircle-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📤 Exported world data to JSON (${this.editor.islands.length} islands)`);
    }
    
    /**
     * Validate world data for issues
     */
    validateWorld() {
        const issues = this.editor.islandManager.validateIslands();
        
        if (issues.length === 0) {
            alert('✅ World validation passed!\n\nNo issues detected.');
        } else {
            alert(`⚠️ World validation found ${issues.length} issues:\n\n` + 
                  issues.map(issue => `• ${issue}`).join('\n'));
        }
    }
}