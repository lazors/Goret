/**
 * Render Engine Module
 * 
 * Handles all rendering operations including ocean, grid, world bounds,
 * islands, collision circles, and debug visualization.
 * 
 * @module RenderEngine
 */

export class RenderEngine {
    constructor(editor) {
        this.editor = editor;
        this.animationFrameId = null;
    }
    
    /**
     * Start the render loop
     */
    startRenderLoop() {
        const renderFrame = () => {
            this.render();
            this.updatePerformanceData();
            this.animationFrameId = requestAnimationFrame(renderFrame);
        };
        
        renderFrame();
    }
    
    /**
     * Stop the render loop
     */
    stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Main render method
     */
    render() {
        const ctx = this.editor.ctx;
        const canvas = this.editor.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render ocean background
        this.renderOcean();
        
        // Apply world transformations
        ctx.save();
        ctx.scale(this.editor.zoom, this.editor.zoom);
        ctx.translate(-this.editor.offsetX, -this.editor.offsetY);
        
        // Draw world elements
        if (this.editor.showGrid) {
            this.drawGrid();
        }
        
        this.drawWorldBounds();
        this.drawIslands();
        
        // Draw collision circles in debug mode
        if (this.editor.debugMode) {
            this.drawCollisionCircles();
        }
        
        ctx.restore();
        
        // Draw transform handles for selected island (on top of everything)
        if (this.editor.selectedIsland && this.editor.currentTool === 'select') {
            const viewport = {
                x: this.editor.offsetX,
                y: this.editor.offsetY,
                zoom: this.editor.zoom
            };
            this.editor.islandTransform.renderTransformHandles(ctx, this.editor.selectedIsland, viewport);
        }
    }
    
    /**
     * Render ocean background with waves (if game map available)
     * @private
     */
    renderOcean() {
        const ctx = this.editor.ctx;
        const canvas = this.editor.canvas;
        
        if (this.editor.gameMap) {
            try {
                // Update wave animation
                this.editor.gameMap.update(0.016); // ~60fps delta time
                
                // Render ocean to off-screen canvas
                this.editor.gameMap.renderOcean(
                    this.editor.oceanCtx, 
                    -this.editor.offsetX, 
                    -this.editor.offsetY,
                    canvas.width / this.editor.zoom, 
                    canvas.height / this.editor.zoom
                );
                
                // Draw ocean canvas scaled to viewport
                ctx.save();
                ctx.scale(this.editor.zoom, this.editor.zoom);
                ctx.translate(-this.editor.offsetX, -this.editor.offsetY);
                ctx.drawImage(this.editor.oceanCanvas, 0, 0);
                ctx.restore();
            } catch (error) {
                // Fallback to simple ocean
                this.drawSimpleOcean();
            }
        } else {
            // Fallback ocean background
            this.drawSimpleOcean();
        }
    }
    
    /**
     * Draw simple ocean background
     * @private
     */
    drawSimpleOcean() {
        const ctx = this.editor.ctx;
        const canvas = this.editor.canvas;
        
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    /**
     * Draw grid overlay
     * @private
     */
    drawGrid() {
        const ctx = this.editor.ctx;
        const canvas = this.editor.canvas;
        const gridSize = this.editor.gridSize;
        const zoom = this.editor.zoom;
        
        const startX = Math.floor(this.editor.offsetX / gridSize) * gridSize;
        const endX = startX + (canvas.width / zoom) + gridSize;
        const startY = Math.floor(this.editor.offsetY / gridSize) * gridSize;
        const endY = startY + (canvas.height / zoom) + gridSize;
        
        // Minor grid lines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        
        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            if (x >= 0 && x <= this.editor.worldWidth) {
                ctx.moveTo(x, Math.max(0, this.editor.offsetY));
                ctx.lineTo(x, Math.min(this.editor.worldHeight, this.editor.offsetY + canvas.height / zoom));
            }
        }
        
        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            if (y >= 0 && y <= this.editor.worldHeight) {
                ctx.moveTo(Math.max(0, this.editor.offsetX), y);
                ctx.lineTo(Math.min(this.editor.worldWidth, this.editor.offsetX + canvas.width / zoom), y);
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * Draw world boundaries
     * @private
     */
    drawWorldBounds() {
        const ctx = this.editor.ctx;
        const zoom = this.editor.zoom;
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(0, 0, this.editor.worldWidth, this.editor.worldHeight);
        
        // Draw world size label
        ctx.fillStyle = '#ff6b6b';
        ctx.font = `${20 / zoom}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(
            `${this.editor.worldWidth} × ${this.editor.worldHeight}`, 
            20, 
            40 / zoom
        );
    }
    
    /**
     * Draw all islands
     * @private
     */
    drawIslands() {
        for (let island of this.editor.islands) {
            this.drawIsland(island);
        }
    }
    
    /**
     * Draw a single island
     * @private
     * @param {Object} island - Island to draw
     */
    drawIsland(island) {
        const ctx = this.editor.ctx;
        const zoom = this.editor.zoom;
        const isSelected = island === this.editor.selectedIsland;
        
        if (island.image) {
            // Draw PNG image using square scaling based on radius (matches game rendering)
            ctx.save();
            ctx.translate(island.x, island.y);
            
            // Apply rotation if present
            if (island.rotation) {
                ctx.rotate(island.rotation);
            }
            
            // Apply scale if present (default to 1.0)
            const scale = island.scale || 1.0;
            
            // Use radius-based sizing like the game does
            // If island has a radius, use it; otherwise calculate from image
            const baseSize = island.radius ? island.radius * 2 : Math.max(island.image.width, island.image.height);
            const size = baseSize * scale;
            
            // Draw island PNG centered and scaled to square size (matching game)
            ctx.drawImage(island.image, -size/2, -size/2, size, size);
            
            // Draw selection indicator (don't draw here if transform handles are active)
            if (isSelected && this.editor.currentTool !== 'select') {
                ctx.strokeStyle = '#ff4757';
                ctx.lineWidth = 4 / zoom;
                ctx.strokeRect(
                    -size/2 - 5/zoom, 
                    -size/2 - 5/zoom,
                    size + 10/zoom, 
                    size + 10/zoom
                );
            }
            
            ctx.restore();
        } else {
            // Draw placeholder circle for islands without PNG
            ctx.strokeStyle = isSelected ? '#ff4757' : '#2ed573';
            ctx.fillStyle = isSelected ? 'rgba(255, 71, 87, 0.1)' : 'rgba(46, 213, 115, 0.1)';
            ctx.lineWidth = 3 / zoom;
            
            ctx.beginPath();
            ctx.arc(island.x, island.y, 200, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // Draw island label
        this.drawIslandLabel(island);
        
        // Draw center point
        ctx.fillStyle = isSelected ? '#ff4757' : '#2ed573';
        ctx.beginPath();
        ctx.arc(island.x, island.y, 6 / zoom, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw island name label
     * @private
     * @param {Object} island - Island to label
     */
    drawIslandLabel(island) {
        const ctx = this.editor.ctx;
        const zoom = this.editor.zoom;
        
        // Setup text style
        ctx.font = `bold ${16 / zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text position using radius-based sizing
        const baseSize = island.radius ? island.radius * 2 : 
            (island.image ? Math.max(island.image.width, island.image.height) : 400);
        const size = baseSize * (island.scale || 1.0);
        const textY = island.y - size / 2 - 10 / zoom;
        
        // Measure text
        const textMetrics = ctx.measureText(island.name);
        const textWidth = textMetrics.width;
        const textHeight = 16 / zoom;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            island.x - textWidth / 2 - 5 / zoom,
            textY - textHeight - 5 / zoom,
            textWidth + 10 / zoom,
            textHeight + 8 / zoom
        );
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(island.name, island.x, textY);
    }
    
    /**
     * Draw collision circles for all islands
     * @private
     */
    drawCollisionCircles() {
        this.editor.islands.forEach(island => {
            if (island.collisionCircles && island.collisionCircles.length > 0) {
                this.drawIslandCollisionCircles(island);
            }
        });
    }
    
    /**
     * Draw collision circles for a single island
     * @private
     * @param {Object} island - Island with collision circles
     */
    drawIslandCollisionCircles(island) {
        const ctx = this.editor.ctx;
        const zoom = this.editor.zoom;
        
        // Color palette for circles
        const colors = [
            'rgba(255, 0, 0, 0.4)', 
            'rgba(0, 255, 0, 0.4)',
            'rgba(0, 0, 255, 0.4)', 
            'rgba(255, 255, 0, 0.4)',
            'rgba(255, 0, 255, 0.4)'
        ];
        
        island.collisionCircles.forEach((circle, index) => {
            const worldX = island.x + circle.x;
            const worldY = island.y + circle.y;
            const isSelected = circle === this.editor.selectedCircle;
            
            // Set circle style
            if (isSelected) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 4 / zoom;
            } else {
                ctx.strokeStyle = colors[index % colors.length];
                ctx.lineWidth = 2 / zoom;
            }
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(worldX, worldY, circle.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw center point
            ctx.fillStyle = isSelected ? 'white' : colors[index % colors.length];
            ctx.beginPath();
            ctx.arc(worldX, worldY, 4 / zoom, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = 'white';
            ctx.font = `${12 / zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
                `C${index} (r:${circle.radius})`, 
                worldX, 
                worldY - circle.radius - 5 / zoom
            );
        });
    }
    
    /**
     * Update performance monitoring data
     * @private
     */
    updatePerformanceData() {
        const now = performance.now();
        
        if (this.editor.lastTime === 0) {
            this.editor.lastTime = now;
            return;
        }
        
        const deltaTime = now - this.editor.lastTime;
        this.editor.frameCount++;
        
        // Update FPS every second
        if (deltaTime >= 1000) {
            this.editor.fps = Math.round(this.editor.frameCount * 1000 / deltaTime);
            this.editor.frameCount = 0;
            this.editor.lastTime = now;
            this.editor.uiManager.updateStatusBar();
        }
    }
}