/**
 * Pirate Game - Main Module
 * Initialization, resource loading and game loop
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            throw new Error('Canvas element with id "gameCanvas" not found');
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.ctx) {
            console.error('❌ Canvas context not available!');
            throw new Error('Canvas 2D context not available');
        }
        
        console.log('✅ Canvas initialized:', this.canvas.width, 'x', this.canvas.height);
        
        // Game objects
        this.map = null;
        this.ship = null;
        
        // Game state
        this.gameState = 'loading'; // loading, playing, paused
        this.assets = {};
        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.keys = {};
        
        // Zoom system
        this.zoom = 1.0;
        this.minZoom = 0.3;
        this.maxZoom = 3.0;
        this.zoomSpeed = 0.1;
        this.targetZoom = 1.0;
        this.zoomSmoothness = 0.1;
        
        // Camera position (for future panning)
        this.cameraX = 0;
        this.cameraY = 0;
        
        // Time and FPS
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // UI elements
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingProgress = document.getElementById('loadingProgress');
        this.loadingText = document.getElementById('loadingText');
        this.speedValue = document.getElementById('speedValue');
        this.directionValue = document.getElementById('directionValue');
        
        // Check if essential UI elements exist
        if (!this.loadingScreen) console.warn('⚠️ Loading screen element not found');
        if (!this.speedValue) console.warn('⚠️ Speed value element not found');
        if (!this.directionValue) console.warn('⚠️ Direction value element not found');
        
        this.init();
    }
    
    async init() {
        console.log('🏴‍☠️ Initializing pirate game...');
        
        try {
            // Setup canvas
            console.log('📱 Setting up canvas...');
            this.setupCanvas();
            
            // Setup event handlers
            console.log('🎮 Setting up event listeners...');
            this.setupEventListeners();
            
            // Load assets
            console.log('📦 Loading assets...');
            await this.loadAssets();
            
            // Initialize game objects
            console.log('🎯 Initializing game objects...');
            this.initGameObjects();
            
            // Hide loading screen
            console.log('🎭 Hiding loading screen...');
            this.hideLoadingScreen();
            
            // Start game loop
            console.log('🔄 Starting game loop...');
            this.gameState = 'playing';
            this.gameLoop();
            
            console.log('⚓ Game successfully launched!');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.updateLoadingText('Error: ' + error.message);
            
            // Try to show a basic fallback
            this.showErrorFallback();
        }
    }
    
    setupCanvas() {
        // Focus on canvas for key handling
        this.canvas.tabIndex = 0;
        this.canvas.focus();
        
        // Disable context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Test draw to ensure canvas is working
        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GORET Loading...', this.canvas.width / 2, this.canvas.height / 2);
        console.log('🎨 Test draw completed on canvas');
    }
    
    setupEventListeners() {
        // Keyboard handling
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Pause on ESC
            if (e.code === 'Escape') {
                this.togglePause();
            }
            
            // Zoom controls
            if (e.code === 'NumpadAdd' || e.code === 'Equal') {
                this.zoomIn();
            }
            if (e.code === 'NumpadSubtract' || e.code === 'Minus') {
                this.zoomOut();
            }
            if (e.code === 'Digit0') {
                this.resetZoom();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleWheelZoom(e);
        });
        
        // Focus loss handling
        window.addEventListener('blur', () => {
            this.keys = {}; // Reset all pressed keys
        });
        
        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    async loadAssets() {
        console.log('📦 Loading resources...');
        
        // List of resources to load
        const assetList = [
            { key: 'map', type: 'placeholder', width: 10240, height: 7680, color: '#1e3a5f' },
            { key: 'ship', type: 'image', src: 'assets/Ships/ship-4741839_960_720.webp' },
            { key: 'island', type: 'image', src: 'assets/Islands/saint_kits.png' },
            { key: 'wave', type: 'placeholder', width: 128, height: 128, color: '#2980b9' }
        ];
        
        this.totalAssets = assetList.length;
        
        for (let asset of assetList) {
            await this.loadAsset(asset);
        }
        
        console.log('✅ All resources loaded!');
    }
    
    async loadAsset(assetInfo) {
        return new Promise((resolve, reject) => {
            this.updateLoadingText(`Loading ${assetInfo.key}...`);
            console.log(`📥 Loading asset: ${assetInfo.key} (${assetInfo.type})`);
            
            if (assetInfo.type === 'image') {
                // Load actual image
                const img = new Image();
                
                // Set crossOrigin to allow canvas analysis
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    console.log(`✅ Successfully loaded image: ${assetInfo.key}`);
                    this.assets[assetInfo.key] = img;
                    this.loadedAssets++;
                    this.updateLoadingProgress();
                    setTimeout(() => resolve(), 200);
                };
                img.onerror = (error) => {
                    console.warn(`⚠️ Failed to load image: ${assetInfo.src}, creating placeholder`);
                    // Fallback to placeholder
                    this.createPlaceholder(assetInfo).then(resolve).catch(reject);
                };
                img.src = assetInfo.src;
            } else {
                // Create placeholder
                console.log(`🎨 Creating placeholder for: ${assetInfo.key}`);
                this.createPlaceholder(assetInfo).then(resolve).catch(reject);
            }
        });
    }
    
    async createPlaceholder(assetInfo) {
        return new Promise((resolve, reject) => {
            try {
                // Create placeholder for image
                const canvas = document.createElement('canvas');
                canvas.width = assetInfo.width;
                canvas.height = assetInfo.height;
                const ctx = canvas.getContext('2d');
            
            if (assetInfo.key === 'map') {
                // Create single shade map background - 10x bigger
                ctx.fillStyle = '#2980b9'; // Same single shade as map.js
                ctx.fillRect(0, 0, 10240, 7680);
            } else if (assetInfo.key === 'ship') {
                // Simple ship sprite
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(20, 10, 24, 40);
                
                // Sails
                ctx.fillStyle = '#f5f5dc';
                ctx.fillRect(15, 15, 34, 25);
                
                // Ship bow
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.moveTo(32, 10);
                ctx.lineTo(25, 0);
                ctx.lineTo(39, 0);
                ctx.closePath();
                ctx.fill();
            } else if (assetInfo.key === 'wave') {
                // Wave texture
                const gradient = ctx.createLinearGradient(0, 0, 128, 128);
                gradient.addColorStop(0, '#2980b9');
                gradient.addColorStop(0.3, '#3498db');
                gradient.addColorStop(0.6, '#5dade2');
                gradient.addColorStop(1, '#2980b9');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 128, 128);
                
                // Add wave patterns
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 128; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.quadraticCurveTo(64, i + 10, 128, i);
                    ctx.stroke();
                }
            }
            
                this.assets[assetInfo.key] = canvas;
                this.loadedAssets++;
                this.updateLoadingProgress();
                
                // Small delay for realism
                setTimeout(() => resolve(), 200);
            } catch (error) {
                console.error('❌ Error creating placeholder:', error);
                reject(error);
            }
        });
    }
    
    drawIsland(ctx, x, y, radius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add beach
        ctx.fillStyle = '#f4e4bc';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    initGameObjects() {
        // Initialize map
        this.map = new GameMap(this.canvas, this.assets);
        
        // Initialize ship at a safe starting position in the massive ocean
        this.ship = new Ship(1000, 1000, this.assets.ship);
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        // Calculate deltaTime
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Calculate FPS
        this.calculateFPS(currentTime);
        
        // Update
        this.update();
        
        // Render
        this.render();
        
        // Next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update zoom
        this.updateZoom();
        
        // Update map
        if (this.map) {
            this.map.update(this.deltaTime);
        }
        
        // Update ship
        if (this.ship) {
            this.ship.update(this.deltaTime, this.keys, this.map);
        }
        
        // Update HUD
        this.updateHUD();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and center on ship
        this.ctx.save();
        
        // Center the view on the ship, but keep camera within map bounds
        if (this.ship) {
            // Calculate camera position to center on ship
            this.cameraX = this.ship.x;
            this.cameraY = this.ship.y;
            
            // Keep camera within map bounds to prevent showing empty space
            const mapWidth = 10240; // Updated for 10x bigger map
            const mapHeight = 7680;
            const canvasWidth = this.canvas.width / this.zoom;
            const canvasHeight = this.canvas.height / this.zoom;
            
            // Constrain camera to keep map visible
            this.cameraX = Math.max(canvasWidth / 2, Math.min(mapWidth - canvasWidth / 2, this.cameraX));
            this.cameraY = Math.max(canvasHeight / 2, Math.min(mapHeight - canvasHeight / 2, this.cameraY));
        }
        
        // Apply transformations: center, zoom, then offset to ship position
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.cameraX, -this.cameraY);
        
        // Render map
        if (this.map) {
            this.map.draw(this.ctx);
        }
        
        // Render ship
        if (this.ship) {
            this.ship.draw(this.ctx);
        }
        
        // Debug rendering
        if (window.DEBUG_MODE) {
            this.drawDebugInfo();
        }
        
        this.ctx.restore();
    }
    
    updateHUD() {
        if (this.ship) {
            const info = this.ship.getInfo();
            this.speedValue.textContent = Math.abs(info.speed);
            this.directionValue.textContent = info.direction;
        }
        
        // Update zoom indicator if it exists
        const zoomIndicator = document.getElementById('zoomValue');
        if (zoomIndicator) {
            zoomIndicator.textContent = `${(this.zoom * 100).toFixed(0)}%`;
        }
    }
    
    getDirectionString(angle) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(angle / 45) % 8;
        return directions[index < 0 ? index + 8 : index];
    }
    
    calculateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
    }
    
    drawDebugInfo() {
        // Draw FPS
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 30);
        
        // Draw ship debug info
        if (this.ship) {
            this.ship.drawDebugInfo(this.ctx);
        }
        
        // Draw map debug info
        if (this.map) {
            this.map.drawDebugInfo(this.ctx);
        }
        
        // Draw camera and zoom info
        this.ctx.fillText(`Camera: (${this.cameraX.toFixed(1)}, ${this.cameraY.toFixed(1)})`, 10, 60);
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(1)}%`, 10, 75);
        this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 10, 90);
        
        // Draw key states
        let keyInfo = 'Keys: ';
        if (this.keys['ArrowUp'] || this.keys['KeyW']) keyInfo += 'W ';
        if (this.keys['ArrowDown'] || this.keys['KeyS']) keyInfo += 'S ';
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) keyInfo += 'A ';
        if (this.keys['ArrowRight'] || this.keys['KeyD']) keyInfo += 'D ';
        this.ctx.fillText(keyInfo, 10, 105);
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            console.log('⏸️ Game paused');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            console.log('▶️ Game resumed');
        }
    }
    
    updateLoadingProgress() {
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.loadingProgress.style.width = progress + '%';
    }
    
    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            console.log('🎭 Loading screen hidden');
        } else {
            console.warn('⚠️ No loading screen to hide');
        }
        
        // Force show canvas and game area
        if (this.canvas) {
            this.canvas.style.display = 'block';
            this.canvas.style.visibility = 'visible';
            console.log('👁️ Canvas visibility ensured');
        }
    }
    
    showErrorFallback() {
        console.log('🔧 Showing error fallback...');
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Draw a simple error message on canvas
        if (this.ctx) {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Loading Error', this.canvas.width / 2, this.canvas.height / 2 - 40);
            
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Check the browser console for details', this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText('Try refreshing the page', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    
    handleResize() {
        // Handle window resize - maintain aspect ratio and minimum size
        const minWidth = 1024;
        const minHeight = 768;
        
        this.canvas.width = Math.max(window.innerWidth, minWidth);
        this.canvas.height = Math.max(window.innerHeight, minHeight);
    }
    
    // Zoom methods
    zoomIn() {
        this.targetZoom = Math.min(this.maxZoom, this.targetZoom + this.zoomSpeed);
    }
    
    zoomOut() {
        this.targetZoom = Math.max(this.minZoom, this.targetZoom - this.zoomSpeed);
    }
    
    resetZoom() {
        this.targetZoom = 1.0;
    }
    
    handleWheelZoom(e) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * zoomFactor));
    }
    
    updateZoom() {
        // Smooth zoom interpolation
        this.zoom += (this.targetZoom - this.zoom) * this.zoomSmoothness;
    }
}

// Global variable for game access (for development)
let game;

// Start game after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    
    // Set development mode
    window.DEBUG_MODE = true; // Set to true to display debug info
    
    console.log('🌊 Pirate adventure begins!');
}); 