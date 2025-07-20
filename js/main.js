/**
 * Pirate Game - Main Module
 * Initialization, resource loading and game loop
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
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
        
        this.init();
    }
    
    async init() {
        console.log('🏴‍☠️ Initializing pirate game...');
        
        // Setup canvas
        this.setupCanvas();
        
        // Setup event handlers
        this.setupEventListeners();
        
        // Load assets
        await this.loadAssets();
        
        // Initialize game objects
        this.initGameObjects();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Start game loop
        this.gameState = 'playing';
        this.gameLoop();
        
        console.log('⚓ Game successfully launched!');
    }
    
    setupCanvas() {
        // Focus on canvas for key handling
        this.canvas.tabIndex = 0;
        this.canvas.focus();
        
        // Disable context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
            { key: 'map', type: 'placeholder', width: 1024, height: 768, color: '#1e3a5f' },
            { key: 'ship', type: 'image', src: 'ship-4741839_960_720.webp' },
            { key: 'wave', type: 'placeholder', width: 128, height: 128, color: '#2980b9' }
        ];
        
        this.totalAssets = assetList.length;
        
        for (let asset of assetList) {
            await this.loadAsset(asset);
        }
        
        console.log('✅ All resources loaded!');
    }
    
    async loadAsset(assetInfo) {
        return new Promise((resolve) => {
            this.updateLoadingText(`Loading ${assetInfo.key}...`);
            
            if (assetInfo.type === 'image') {
                // Load actual image
                const img = new Image();
                img.onload = () => {
                    this.assets[assetInfo.key] = img;
                    this.loadedAssets++;
                    this.updateLoadingProgress();
                    setTimeout(() => resolve(), 200);
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${assetInfo.src}`);
                    // Fallback to placeholder
                    this.createPlaceholder(assetInfo).then(resolve);
                };
                img.src = assetInfo.src;
            } else {
                // Create placeholder
                this.createPlaceholder(assetInfo).then(resolve);
            }
        });
    }
    
    async createPlaceholder(assetInfo) {
        return new Promise((resolve) => {
            // Create placeholder for image
            const canvas = document.createElement('canvas');
            canvas.width = assetInfo.width;
            canvas.height = assetInfo.height;
            const ctx = canvas.getContext('2d');
            
            if (assetInfo.key === 'map') {
                // Create gradient map with islands
                const gradient = ctx.createRadialGradient(512, 384, 100, 512, 384, 400);
                gradient.addColorStop(0, '#2980b9');
                gradient.addColorStop(0.5, '#3498db');
                gradient.addColorStop(1, '#1e3a5f');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1024, 768);
                
                // Add several islands
                this.drawIsland(ctx, 200, 150, 80, '#8fbc8f');
                this.drawIsland(ctx, 700, 300, 100, '#90ee90');
                this.drawIsland(ctx, 400, 500, 60, '#98fb98');
                this.drawIsland(ctx, 800, 600, 90, '#9acd32');
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
        
        // Initialize ship at map center
        this.ship = new Ship(512, 384, this.assets.ship);
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
        
        // Center the view on the ship
        if (this.ship) {
            this.cameraX = this.ship.x;
            this.cameraY = this.ship.y;
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
        }
    }
    
    handleResize() {
        // Handle window resize
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
    window.DEBUG_MODE = false; // Set to true to display debug info
    
    console.log('🌊 Pirate adventure begins!');
}); 