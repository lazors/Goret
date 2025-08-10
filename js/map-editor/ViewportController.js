/**
 * Viewport Controller Module
 * 
 * Manages camera viewport, zoom, panning, and view controls
 * for navigating the map editor world.
 * 
 * @module ViewportController
 */

export class ViewportController {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        this.editor.showGrid = !this.editor.showGrid;
        document.getElementById('gridToggleText').textContent = 
            this.editor.showGrid ? 'Hide Grid' : 'Show Grid';
        this.editor.render();
    }
    
    /**
     * Set grid size
     * @param {number} size - New grid size in pixels
     */
    setGridSize(size) {
        this.editor.gridSize = parseInt(size);
        document.getElementById('gridSizeValue').textContent = size + 'px';
        this.editor.render();
    }
    
    /**
     * Fit entire world in viewport
     */
    fitWorld() {
        const padding = 100;
        const canvas = this.editor.canvas;
        
        const scaleX = (canvas.width - padding * 2) / this.editor.worldWidth;
        const scaleY = (canvas.height - padding * 2) / this.editor.worldHeight;
        
        this.editor.zoom = Math.min(scaleX, scaleY);
        this.editor.offsetX = (this.editor.worldWidth - canvas.width / this.editor.zoom) / 2;
        this.editor.offsetY = (this.editor.worldHeight - canvas.height / this.editor.zoom) / 2;
        
        this.editor.render();
    }
    
    /**
     * Reset view to default zoom and position
     */
    resetView() {
        this.editor.zoom = 0.08;
        this.editor.offsetX = 0;
        this.editor.offsetY = 0;
        this.editor.render();
    }
    
    /**
     * Zoom in by a factor
     * @param {number} factor - Zoom factor (>1 to zoom in, <1 to zoom out)
     */
    zoomBy(factor) {
        const newZoom = Math.max(
            this.editor.minZoom, 
            Math.min(this.editor.maxZoom, this.editor.zoom * factor)
        );
        
        this.editor.zoom = newZoom;
        this.editor.render();
    }
    
    /**
     * Pan viewport by specified amount
     * @param {number} deltaX - Horizontal pan amount in world units
     * @param {number} deltaY - Vertical pan amount in world units
     */
    panBy(deltaX, deltaY) {
        this.editor.offsetX += deltaX;
        this.editor.offsetY += deltaY;
        this.editor.render();
    }
    
    /**
     * Center viewport on specific world coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     */
    centerOn(worldX, worldY) {
        const canvas = this.editor.canvas;
        
        this.editor.offsetX = worldX - (canvas.width / this.editor.zoom) / 2;
        this.editor.offsetY = worldY - (canvas.height / this.editor.zoom) / 2;
        
        this.editor.render();
    }
    
    /**
     * Center viewport on selected island
     */
    centerOnSelectedIsland() {
        if (this.editor.selectedIsland) {
            this.centerOn(
                this.editor.selectedIsland.x, 
                this.editor.selectedIsland.y
            );
        }
    }
    
    /**
     * Handle mouse wheel zoom
     * @param {WheelEvent} event - Mouse wheel event
     */
    handleWheel(event) {
        event.preventDefault();
        
        const rect = this.editor.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Calculate world coordinates at mouse position
        const worldMouseX = (mouseX / this.editor.zoom) + this.editor.offsetX;
        const worldMouseY = (mouseY / this.editor.zoom) + this.editor.offsetY;
        
        // Apply zoom
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(
            this.editor.minZoom, 
            Math.min(this.editor.maxZoom, this.editor.zoom * zoomFactor)
        );
        
        // Adjust offset to zoom towards mouse position
        this.editor.offsetX = worldMouseX - (mouseX / newZoom);
        this.editor.offsetY = worldMouseY - (mouseY / newZoom);
        this.editor.zoom = newZoom;
        
        this.editor.render();
        this.editor.uiManager.updateStatusBar();
    }
    
    /**
     * Handle viewport panning with mouse drag
     * @param {number} deltaX - Mouse movement in screen pixels
     * @param {number} deltaY - Mouse movement in screen pixels
     */
    handlePan(deltaX, deltaY) {
        this.editor.offsetX -= deltaX / this.editor.zoom;
        this.editor.offsetY -= deltaY / this.editor.zoom;
        this.editor.render();
    }
    
    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.editor.zoom) + this.editor.offsetX,
            y: (screenY / this.editor.zoom) + this.editor.offsetY
        };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Screen coordinates {x, y}
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.editor.offsetX) * this.editor.zoom,
            y: (worldY - this.editor.offsetY) * this.editor.zoom
        };
    }
    
    /**
     * Check if world coordinates are visible in viewport
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @param {number} margin - Optional margin in world units
     * @returns {boolean} True if visible
     */
    isInViewport(worldX, worldY, margin = 0) {
        const canvas = this.editor.canvas;
        const viewWidth = canvas.width / this.editor.zoom;
        const viewHeight = canvas.height / this.editor.zoom;
        
        return worldX >= this.editor.offsetX - margin &&
               worldX <= this.editor.offsetX + viewWidth + margin &&
               worldY >= this.editor.offsetY - margin &&
               worldY <= this.editor.offsetY + viewHeight + margin;
    }
    
    /**
     * Get current viewport bounds in world coordinates
     * @returns {Object} Viewport bounds {left, top, right, bottom, width, height}
     */
    getViewportBounds() {
        const canvas = this.editor.canvas;
        const width = canvas.width / this.editor.zoom;
        const height = canvas.height / this.editor.zoom;
        
        return {
            left: this.editor.offsetX,
            top: this.editor.offsetY,
            right: this.editor.offsetX + width,
            bottom: this.editor.offsetY + height,
            width: width,
            height: height
        };
    }
}