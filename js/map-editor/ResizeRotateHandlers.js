/**
 * Resize and Rotation Handle System for Advanced Map Editor
 * Provides interactive resize corners and rotation handle for selected islands
 */

// Add methods to AdvancedMapEditor prototype
if (typeof AdvancedMapEditor !== 'undefined') {
    
    /**
     * Check if mouse is over a resize handle
     */
    AdvancedMapEditor.prototype.getResizeHandle = function(island, mouseX, mouseY, zoom, offsetX, offsetY) {
        if (!island || !this.state.selectedIslands.has(island.name)) return null;
        
        const screenX = island.x * zoom + offsetX;
        const screenY = island.y * zoom + offsetY;
        const width = (island.width || 400) * zoom;
        const height = (island.height || 300) * zoom;
        
        const handleSize = 10;
        const handles = {
            'nw': { x: screenX - width/2, y: screenY - height/2 },
            'ne': { x: screenX + width/2, y: screenY - height/2 },
            'sw': { x: screenX - width/2, y: screenY + height/2 },
            'se': { x: screenX + width/2, y: screenY + height/2 }
        };
        
        for (let [handle, pos] of Object.entries(handles)) {
            if (Math.abs(mouseX - pos.x) < handleSize && Math.abs(mouseY - pos.y) < handleSize) {
                return handle;
            }
        }
        
        return null;
    };
    
    /**
     * Check if mouse is over rotation handle
     */
    AdvancedMapEditor.prototype.getRotationHandle = function(island, mouseX, mouseY, zoom, offsetX, offsetY) {
        if (!island || !this.state.selectedIslands.has(island.name)) return false;
        
        const screenX = island.x * zoom + offsetX;
        const screenY = island.y * zoom + offsetY;
        const height = (island.height || 300) * zoom;
        
        // Rotation handle is above the island
        const rotationHandleX = screenX;
        const rotationHandleY = screenY - height/2 - 30;
        
        const handleSize = 12;
        return Math.abs(mouseX - rotationHandleX) < handleSize && Math.abs(mouseY - rotationHandleY) < handleSize;
    };
    
    /**
     * Draw resize handles for selected island
     */
    AdvancedMapEditor.prototype.drawResizeHandles = function(ctx, island, zoom, offsetX, offsetY) {
        if (!island || !this.state.selectedIslands.has(island.name)) return;
        
        const screenX = island.x * zoom + offsetX;
        const screenY = island.y * zoom + offsetY;
        const width = (island.width || 400) * zoom;
        const height = (island.height || 300) * zoom;
        
        const handleSize = 8;
        const handles = [
            { x: screenX - width/2, y: screenY - height/2, cursor: 'nw-resize' }, // NW
            { x: screenX + width/2, y: screenY - height/2, cursor: 'ne-resize' }, // NE
            { x: screenX - width/2, y: screenY + height/2, cursor: 'sw-resize' }, // SW
            { x: screenX + width/2, y: screenY + height/2, cursor: 'se-resize' }  // SE
        ];
        
        ctx.save();
        
        handles.forEach(handle => {
            // Draw handle background
            ctx.fillStyle = '#3498db';
            ctx.strokeStyle = '#2980b9';
            ctx.lineWidth = 2;
            
            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
            ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
            
            // Add white center dot
            ctx.fillStyle = 'white';
            ctx.fillRect(handle.x - 1, handle.y - 1, 2, 2);
        });
        
        ctx.restore();
    };
    
    /**
     * Draw rotation handle for selected island
     */
    AdvancedMapEditor.prototype.drawRotationHandle = function(ctx, island, zoom, offsetX, offsetY) {
        if (!island || !this.state.selectedIslands.has(island.name)) return;
        
        const screenX = island.x * zoom + offsetX;
        const screenY = island.y * zoom + offsetY;
        const height = (island.height || 300) * zoom;
        
        // Rotation handle position (above the island)
        const rotationHandleX = screenX;
        const rotationHandleY = screenY - height/2 - 30;
        
        ctx.save();
        
        // Draw connection line
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - height/2);
        ctx.lineTo(rotationHandleX, rotationHandleY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw rotation handle circle
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(rotationHandleX, rotationHandleY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw rotation arrows
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Left arrow
        ctx.beginPath();
        ctx.arc(rotationHandleX, rotationHandleY, 4, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        
        // Right arrow  
        ctx.beginPath();
        ctx.arc(rotationHandleX, rotationHandleY, 4, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        
        ctx.restore();
    };
    
    /**
     * Handle resize operation
     */
    AdvancedMapEditor.prototype.handleResize = function(island, handle, startMouseX, startMouseY, currentMouseX, currentMouseY, zoom) {
        if (!island || !handle) return;
        
        // Calculate mouse movement in world coordinates
        const deltaX = (currentMouseX - startMouseX) / zoom;
        const deltaY = (currentMouseY - startMouseY) / zoom;
        
        // Store original dimensions for undo
        if (!this.state.navigation.resizeStartBounds) {
            this.state.navigation.resizeStartBounds = {
                width: island.width,
                height: island.height,
                x: island.x,
                y: island.y
            };
        }
        
        const startBounds = this.state.navigation.resizeStartBounds;
        
        switch (handle) {
            case 'nw': // Northwest - resize from top-left
                island.width = Math.max(50, startBounds.width - deltaX);
                island.height = Math.max(50, startBounds.height - deltaY);
                island.x = startBounds.x + deltaX / 2;
                island.y = startBounds.y + deltaY / 2;
                break;
                
            case 'ne': // Northeast - resize from top-right
                island.width = Math.max(50, startBounds.width + deltaX);
                island.height = Math.max(50, startBounds.height - deltaY);
                island.x = startBounds.x + deltaX / 2;
                island.y = startBounds.y + deltaY / 2;
                break;
                
            case 'sw': // Southwest - resize from bottom-left
                island.width = Math.max(50, startBounds.width - deltaX);
                island.height = Math.max(50, startBounds.height + deltaY);
                island.x = startBounds.x + deltaX / 2;
                island.y = startBounds.y + deltaY / 2;
                break;
                
            case 'se': // Southeast - resize from bottom-right
                island.width = Math.max(50, startBounds.width + deltaX);
                island.height = Math.max(50, startBounds.height + deltaY);
                island.x = startBounds.x + deltaX / 2;
                island.y = startBounds.y + deltaY / 2;
                break;
        }
        
        // Update radius based on new dimensions
        island.radius = Math.max(island.width, island.height) * 0.5;
        
        this.markDirty('all');
    };
    
    /**
     * Handle rotation operation
     */
    AdvancedMapEditor.prototype.handleRotation = function(island, centerX, centerY, currentMouseX, currentMouseY) {
        if (!island) return;
        
        // Calculate angle from island center to mouse
        const deltaX = currentMouseX - centerX;
        const deltaY = currentMouseY - centerY;
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Store starting angle if not set
        if (this.state.navigation.rotationStartAngle === 0) {
            this.state.navigation.rotationStartAngle = angle - (island.rotation || 0);
        }
        
        // Calculate new rotation
        let newRotation = angle - this.state.navigation.rotationStartAngle;
        
        // Normalize to 0-360 range
        while (newRotation < 0) newRotation += 360;
        while (newRotation >= 360) newRotation -= 360;
        
        island.rotation = Math.round(newRotation);
        
        this.markDirty('all');
    };
    
    console.log('🎮 Resize and Rotation Handlers loaded successfully');
}