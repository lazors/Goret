/**
 * PNG Asset Manager Module
 * 
 * Manages loading, caching, and retrieval of PNG island assets.
 * Handles communication with the server for available PNG files.
 * 
 * @module PNGAssetManager
 */

export class PNGAssetManager {
    constructor(editor) {
        this.editor = editor;
        this.availablePNGs = [];
        this.loadedImages = new Map();
        this.selectedPNG = null;
        this.serverUrl = 'http://localhost:8001';
    }
    
    /**
     * Load all available PNG assets from server
     */
    async loadAvailablePNGs() {
        try {
            // Skip PNG loading if running from file:// protocol
            if (window.location.protocol === 'file:') {
                console.warn('⚠️ Running from file:// protocol - PNG loading skipped');
                this.availablePNGs = [];
                return;
            }
            
            console.log('📥 Loading available PNG assets...');
            const response = await fetch(`${this.serverUrl}/api/list-island-images`);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            this.availablePNGs = data.images || [];
            
            // Load images into memory
            await this.preloadImages();
            
            // Update UI dropdowns
            this.updatePNGSelectors();
            
            console.log(`✅ Loaded ${this.availablePNGs.length} PNG assets`);
            
        } catch (error) {
            console.log(`❌ Failed to load PNG assets: ${error.message}`);
            // Continue without PNG assets
            this.availablePNGs = [];
        }
    }
    
    /**
     * Preload all PNG images into memory
     * @private
     */
    async preloadImages() {
        for (let pngInfo of this.availablePNGs) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    this.loadedImages.set(pngInfo.filename, img);
                    console.log(`✅ Loaded PNG: ${pngInfo.filename}`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`⚠️ Failed to load PNG: ${pngInfo.filename}`);
                    resolve(); // Continue with other images
                };
                
                // Use HTTP URL if available, fallback to relative path
                img.src = window.location.protocol !== 'file:' 
                    ? `http://localhost:8000/${pngInfo.path}`
                    : pngInfo.path;
            });
        }
    }
    
    /**
     * Get loaded image by filename
     * @param {string} filename - PNG filename
     * @returns {Image|null} Loaded image or null
     */
    getLoadedImage(filename) {
        return this.loadedImages.get(filename) || null;
    }
    
    /**
     * Update PNG selector dropdowns in UI
     */
    updatePNGSelectors() {
        const pngSelector = document.getElementById('pngSelector');
        const islandImageSelector = document.getElementById('islandImageSelector');
        
        // Clear existing options
        pngSelector.innerHTML = '<option value="">-- Select PNG --</option>';
        islandImageSelector.innerHTML = '<option value="">-- No Image --</option>';
        
        // Add PNG options
        this.availablePNGs.forEach((pngInfo, index) => {
            const displayName = pngInfo.filename.replace('.png', '').replace('_', ' ');
            
            // Main PNG selector
            const option1 = document.createElement('option');
            option1.value = pngInfo.filename;
            option1.textContent = displayName;
            pngSelector.appendChild(option1);
            
            // Island image selector
            const option2 = document.createElement('option');
            option2.value = pngInfo.filename;
            option2.textContent = displayName;
            islandImageSelector.appendChild(option2);
        });
    }
    
    /**
     * Preview selected PNG
     * @param {string} filename - PNG filename to preview
     */
    previewPNG(filename) {
        const previewDiv = document.getElementById('pngPreview');
        const previewImg = document.getElementById('previewImage');
        
        if (!filename) {
            previewDiv.style.display = 'none';
            this.selectedPNG = null;
            return;
        }
        
        this.selectedPNG = filename;
        const pngInfo = this.availablePNGs.find(p => p.filename === filename);
        
        if (pngInfo) {
            previewImg.src = window.location.protocol !== 'file:' 
                ? `http://localhost:8000/${pngInfo.path}`
                : pngInfo.path;
            previewDiv.style.display = 'block';
        }
    }
    
    /**
     * Add island from selected PNG
     */
    addIslandFromPNG() {
        if (!this.selectedPNG) {
            alert('Please select a PNG first');
            return;
        }
        
        const island = this.editor.islandManager.addIslandFromPNG(this.selectedPNG);
        if (island) {
            this.editor.selectIsland(island);
            this.editor.uiManager.updateIslandsList();
            this.editor.render();
        }
    }
    
    /**
     * Auto-generate collision circles from PNG for selected island
     */
    async generateCirclesFromPNG() {
        if (!this.editor.selectedIsland || !this.editor.selectedIsland.image) {
            alert('Please select an island with a PNG image first');
            return;
        }
        
        const loadingDiv = document.getElementById('collisionCirclesList');
        loadingDiv.innerHTML = '<div class="loading-indicator">🔄 Analyzing PNG shape...</div>';
        
        // Small delay to show loading indicator
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.editor.collisionManager.generateCirclesForIsland(this.editor.selectedIsland);
        this.editor.uiManager.updateCollisionCirclesList();
        this.editor.render();
        
        console.log(`Auto-generated ${this.editor.selectedIsland.collisionCircles.length} collision circles from PNG`);
    }
    
    /**
     * Get PNG info by filename
     * @param {string} filename - PNG filename
     * @returns {Object|null} PNG info object or null
     */
    getPNGInfo(filename) {
        return this.availablePNGs.find(p => p.filename === filename) || null;
    }
    
    /**
     * Check if PNG assets are available
     * @returns {boolean} True if PNG assets are loaded
     */
    hasAssets() {
        return this.availablePNGs.length > 0;
    }
    
    /**
     * Get list of available PNG filenames
     * @returns {Array} Array of PNG filenames
     */
    getAvailableFilenames() {
        return this.availablePNGs.map(p => p.filename);
    }
}