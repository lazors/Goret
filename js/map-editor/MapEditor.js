/**
 * GORET Map Editor - Main Editor Class
 * 
 * This is the main class that manages the map editor functionality.
 * It handles the canvas, viewport, tools, and coordinates all other modules.
 * 
 * @module MapEditor
 * @version 3.1.0
 */

import { IslandManager } from './IslandManager.js';
import { CollisionCircleManager } from './CollisionCircleManager.js';
import { ToolManager } from './ToolManager.js';
import { RenderEngine } from './RenderEngine.js';
import { DataManager } from './DataManager.js';
import { UIManager } from './UIManager.js';
import { PNGAssetManager } from './PNGAssetManager.js';
import { ViewportController } from './ViewportController.js';
import { InputHandler } from './InputHandler.js';

export class MapEditor {
    constructor() {
        // Version info
        this.version = '3.1.0';
        
        // Get canvas reference
        this.canvas = document.getElementById('worldCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // World configuration
        this.worldWidth = 10240;
        this.worldHeight = 7680;
        this.gridSize = 100;
        this.showGrid = true;
        this.debugMode = false;
        
        // Game map instance for ocean rendering
        this.gameMap = null;
        this.oceanCanvas = document.createElement('canvas');
        this.oceanCtx = this.oceanCanvas.getContext('2d');
        this.oceanCanvas.width = this.worldWidth;
        this.oceanCanvas.height = this.worldHeight;
        
        // Viewport settings - match game initial zoom
        this.zoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minZoom = 0.02;
        this.maxZoom = 3.0;
        
        // Editor state
        this.islands = [];
        this.selectedIsland = null;
        this.selectedCircle = null;
        this.currentTool = 'select';
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        
        // Mouse state
        this.mouse = {
            x: 0, y: 0,
            worldX: 0, worldY: 0,
            isDown: false,
            isDragging: false,
            lastX: 0, lastY: 0
        };
        
        // Initialize sub-modules
        this.initializeModules();
        
        // Initialize editor
        this.init();
    }
    
    /**
     * Initialize all sub-modules
     */
    initializeModules() {
        // Core modules
        this.islandManager = new IslandManager(this);
        this.collisionManager = new CollisionCircleManager(this);
        this.toolManager = new ToolManager(this);
        this.renderEngine = new RenderEngine(this);
        this.dataManager = new DataManager(this);
        this.uiManager = new UIManager(this);
        this.pngAssetManager = new PNGAssetManager(this);
        this.viewportController = new ViewportController(this);
        this.inputHandler = new InputHandler(this);
    }
    
    /**
     * Initialize the map editor
     */
    async init() {
        console.log('🌊 GORET Map Editor v' + this.version + ' (PNG-Based Multi-Circle) initializing...');
        
        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.error('⚠️ Map editor accessed via file:// protocol - PNG loading will fail!');
            document.getElementById('protocolWarning').style.display = 'block';
        }
        
        // Initialize game map for ocean rendering
        try {
            const minimalAssets = {
                island: new Image() // Placeholder
            };
            this.gameMap = new GameMap(this.oceanCanvas, minimalAssets);
            console.log('✅ Game map initialized for ocean rendering');
        } catch (error) {
            console.warn('⚠️ Could not initialize game map:', error);
        }
        
        // Setup components
        this.setupCanvas();
        this.inputHandler.setupEventListeners();
        this.renderEngine.startRenderLoop();
        
        // Load assets and data
        await this.pngAssetManager.loadAvailablePNGs();
        this.dataManager.loadExistingIslands();
        
        // Update UI
        this.uiManager.updateAll();
        
        // Center on ship starting position to match game view
        this.centerOnShipStartPosition();
        
        console.log('✅ Map Editor ready!');
    }
    
    /**
     * Setup canvas and handle resizing
     */
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.renderEngine.render();
    }
    
    /**
     * Get mouse world coordinates
     */
    updateWorldMouse() {
        this.mouse.worldX = (this.mouse.x / this.zoom) + this.offsetX;
        this.mouse.worldY = (this.mouse.y / this.zoom) + this.offsetY;
    }
    
    /**
     * Select an island
     * @param {Object} island - Island to select
     */
    selectIsland(island) {
        this.selectedIsland = island;
        this.islandManager.onIslandSelected(island);
        this.uiManager.updateIslandProperties(island);
        this.renderEngine.render();
    }
    
    /**
     * Select a collision circle
     * @param {Object} circle - Circle to select
     */
    selectCircle(circle) {
        this.selectedCircle = circle;
        this.collisionManager.onCircleSelected(circle);
        this.uiManager.updateCircleProperties(circle);
    }
    
    /**
     * Center viewport on ship starting position to match game initial view
     */
    centerOnShipStartPosition() {
        const shipStartX = 1000; // Ship starts at (1000, 1000) in game
        const shipStartY = 1000;
        
        this.viewportController.centerOn(shipStartX, shipStartY);
    }
    
    /**
     * Main render method - delegates to render engine
     */
    render() {
        this.renderEngine.render();
    }
}

// Create global instance
window.mapEditor = new MapEditor();