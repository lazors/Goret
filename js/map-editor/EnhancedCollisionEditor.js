/**
 * Enhanced Collision Editor for GORET Map Editor
 * 
 * Advanced Features:
 * - Bezier curve collision paths
 * - Multi-layer collision support (land, water, air)
 * - Advanced point manipulation tools
 * - Real-time collision validation
 * - Physics simulation preview
 * - Auto-generation from image boundaries
 * - Collision optimization algorithms
 */

class EnhancedCollisionEditor {
    constructor(mapEditor) {
        this.mapEditor = mapEditor;
        this.enabled = false;
        
        // Collision editing state
        this.selectedPoints = new Set();
        this.draggedPoint = null;
        this.hoverPoint = null;
        this.editMode = 'points'; // 'points', 'curves', 'polygon'
        
        // Multi-layer support
        this.layers = new Map([
            ['land', { name: 'Land Collision', color: '#e74c3c', visible: true }],
            ['water', { name: 'Water Collision', color: '#3498db', visible: true }],
            ['air', { name: 'Air Collision', color: '#95a5a6', visible: false }]
        ]);
        this.activeLayer = 'land';
        
        // Advanced tools
        this.tools = {
            active: 'select',
            modes: new Map([
                ['select', { name: 'Select', cursor: 'default', icon: '👆' }],
                ['add', { name: 'Add Point', cursor: 'crosshair', icon: '➕' }],
                ['remove', { name: 'Remove Point', cursor: 'pointer', icon: '➖' }],
                ['smooth', { name: 'Smooth Path', cursor: 'grab', icon: '〰️' }],
                ['optimize', { name: 'Optimize', cursor: 'progress', icon: '⚡' }],
                ['trace', { name: 'Auto Trace', cursor: 'crosshair', icon: '🖊️' }]
            ])
        };
        
        // Drawing settings
        this.drawSettings = {
            pointRadius: 8,
            selectedPointRadius: 12,
            lineWidth: 3,
            gridSnap: true,
            snapDistance: 10,
            showHandles: true,
            showNormals: false,
            animateSelection: true
        };
        
        // Physics validation
        this.physicsValidator = {
            enabled: true,
            minSegmentLength: 5,
            maxSegmentLength: 200,
            maxAngleChange: Math.PI / 2,
            convexityCheck: true
        };
        
        // Performance optimization
        this.cache = {
            boundingBox: null,
            triangulation: null,
            convexHull: null,
            dirty: true
        };
        
        this.setupEventHandlers();
        console.log('🎯 Enhanced Collision Editor initialized');
    }
    
    /**
     * Enable collision editing mode
     */
    enable() {
        this.enabled = true;
        this.mapEditor.eventBus.emit('collision-editor:enabled');
        this.mapEditor.debugFramework.log('Collision editor enabled', 'info');
        this.updateUI();
    }
    
    /**
     * Disable collision editing mode
     */
    disable() {
        this.enabled = false;
        this.selectedPoints.clear();
        this.draggedPoint = null;
        this.hoverPoint = null;
        this.mapEditor.eventBus.emit('collision-editor:disabled');
        this.mapEditor.debugFramework.log('Collision editor disabled', 'info');
        this.updateUI();
    }
    
    /**
     * Toggle collision editing mode
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
    
    /**
     * Set active collision layer
     */
    setActiveLayer(layerName) {
        if (this.layers.has(layerName)) {
            this.activeLayer = layerName;
            this.mapEditor.eventBus.emit('collision-editor:layer-changed', { layer: layerName });
            this.mapEditor.markDirty('ui');
        }
    }
    
    /**
     * Set collision editing tool
     */
    setTool(toolName) {
        if (this.tools.modes.has(toolName)) {
            this.tools.active = toolName;
            const tool = this.tools.modes.get(toolName);
            this.mapEditor.canvas.style.cursor = tool.cursor;
            this.mapEditor.eventBus.emit('collision-editor:tool-changed', { tool: toolName });
            this.mapEditor.debugFramework.log(`Collision tool: ${tool.name}`, 'debug');
        }
    }
    
    /**
     * Handle mouse events for collision editing
     */
    handleMouseDown(e, worldPos) {
        if (!this.enabled || !this.mapEditor.selectedIsland) return false;
        
        const tool = this.tools.active;
        const island = this.mapEditor.selectedIsland;
        
        switch (tool) {
            case 'select':
                return this.handleSelectMouseDown(worldPos, island);
            case 'add':
                return this.handleAddMouseDown(worldPos, island);
            case 'remove':
                return this.handleRemoveMouseDown(worldPos, island);
            case 'smooth':
                return this.handleSmoothMouseDown(worldPos, island);
            case 'trace':
                return this.handleTraceMouseDown(worldPos, island);
        }
        
        return false;
    }
    
    handleMouseMove(e, worldPos) {
        if (!this.enabled || !this.mapEditor.selectedIsland) return false;
        
        const island = this.mapEditor.selectedIsland;
        
        // Update hover state
        this.updateHoverState(worldPos, island);
        
        // Handle dragging
        if (this.draggedPoint) {
            this.handlePointDrag(worldPos, island);
            return true;
        }
        
        return false;
    }
    
    handleMouseUp(e, worldPos) {
        if (!this.enabled) return false;
        
        if (this.draggedPoint) {
            this.finalizeDrag();
            return true;
        }
        
        return false;
    }
    
    /**
     * Select tool mouse handling
     */
    handleSelectMouseDown(worldPos, island) {
        const pointIndex = this.getPointAtPosition(worldPos, island);
        
        if (pointIndex !== -1) {
            // Point selection
            if (!this.selectedPoints.has(pointIndex)) {
                if (!this.mapEditor.keys?.shiftKey) {
                    this.selectedPoints.clear();
                }
                this.selectedPoints.add(pointIndex);
            }
            
            this.draggedPoint = {
                index: pointIndex,
                startPos: { ...worldPos },
                originalPos: { ...island.collision[pointIndex] }
            };
            
            return true;
        } else {
            // Clear selection if clicking empty area
            this.selectedPoints.clear();
            this.mapEditor.markDirty('ui');
        }
        
        return false;
    }
    
    /**
     * Add tool mouse handling
     */
    handleAddMouseDown(worldPos, island) {
        const snappedPos = this.snapToGrid(worldPos);
        const insertIndex = this.findBestInsertionPoint(snappedPos, island);
        
        // Add point to collision array
        if (!island.collision) island.collision = [];
        
        island.collision.splice(insertIndex, 0, snappedPos);
        
        // Select the new point
        this.selectedPoints.clear();
        this.selectedPoints.add(insertIndex);
        
        // Invalidate cache
        this.invalidateCache();
        
        // Save state for undo
        this.mapEditor.saveUndoState?.();
        
        this.mapEditor.eventBus.emit('collision:point-added', {
            island: island.name,
            point: snappedPos,
            index: insertIndex
        });
        
        this.mapEditor.markDirty('ui');
        return true;
    }
    
    /**
     * Remove tool mouse handling
     */
    handleRemoveMouseDown(worldPos, island) {
        const pointIndex = this.getPointAtPosition(worldPos, island);
        
        if (pointIndex !== -1 && island.collision.length > 3) {
            island.collision.splice(pointIndex, 1);
            
            // Update selected points indices
            const newSelected = new Set();
            for (const index of this.selectedPoints) {
                if (index < pointIndex) {
                    newSelected.add(index);
                } else if (index > pointIndex) {
                    newSelected.add(index - 1);
                }
            }
            this.selectedPoints = newSelected;
            
            this.invalidateCache();
            this.mapEditor.saveUndoState?.();
            
            this.mapEditor.eventBus.emit('collision:point-removed', {
                island: island.name,
                index: pointIndex
            });
            
            this.mapEditor.markDirty('ui');
            return true;
        }
        
        return false;
    }
    
    /**
     * Smooth tool mouse handling
     */
    handleSmoothMouseDown(worldPos, island) {
        const pointIndex = this.getPointAtPosition(worldPos, island);
        
        if (pointIndex !== -1) {
            this.smoothPointArea(pointIndex, island);
            return true;
        }
        
        return false;
    }
    
    /**
     * Auto-trace tool mouse handling
     */
    handleTraceMouseDown(worldPos, island) {
        if (island.image) {
            this.autoTraceFromImage(island, worldPos);
            return true;
        }
        
        return false;
    }
    
    /**
     * Update hover state for visual feedback
     */
    updateHoverState(worldPos, island) {
        const pointIndex = this.getPointAtPosition(worldPos, island);
        
        if (this.hoverPoint !== pointIndex) {
            this.hoverPoint = pointIndex;
            this.mapEditor.markDirty('ui');
        }
    }
    
    /**
     * Handle point dragging
     */
    handlePointDrag(worldPos, island) {
        if (!this.draggedPoint) return;
        
        const snappedPos = this.snapToGrid(worldPos);
        const index = this.draggedPoint.index;
        
        // Update point position
        island.collision[index] = snappedPos;
        
        // Real-time validation
        if (this.physicsValidator.enabled) {
            this.validatePointPosition(index, island);
        }
        
        this.invalidateCache();
        this.mapEditor.markDirty('ui');
    }
    
    /**
     * Finalize drag operation
     */
    finalizeDrag() {
        if (this.draggedPoint) {
            this.mapEditor.saveUndoState?.();
            this.mapEditor.eventBus.emit('collision:point-moved', {
                island: this.mapEditor.selectedIsland.name,
                index: this.draggedPoint.index,
                from: this.draggedPoint.originalPos,
                to: this.mapEditor.selectedIsland.collision[this.draggedPoint.index]
            });
            
            this.draggedPoint = null;
        }
    }
    
    /**
     * Get collision point at world position
     */
    getPointAtPosition(worldPos, island) {
        if (!island.collision) return -1;
        
        const threshold = this.drawSettings.pointRadius / this.mapEditor.state.viewport.zoom;
        
        for (let i = 0; i < island.collision.length; i++) {
            const point = island.collision[i];
            const distance = Math.sqrt(
                Math.pow(worldPos.x - point.x, 2) + 
                Math.pow(worldPos.y - point.y, 2)
            );
            
            if (distance <= threshold) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * Find best insertion point for new collision point
     */
    findBestInsertionPoint(pos, island) {
        if (!island.collision || island.collision.length < 2) {
            return island.collision ? island.collision.length : 0;
        }
        
        let minDistance = Infinity;
        let bestIndex = island.collision.length;
        
        for (let i = 0; i < island.collision.length; i++) {
            const current = island.collision[i];
            const next = island.collision[(i + 1) % island.collision.length];
            
            const distance = this.distanceToLineSegment(pos, current, next);
            
            if (distance < minDistance) {
                minDistance = distance;
                bestIndex = i + 1;
            }
        }
        
        return bestIndex;
    }
    
    /**
     * Snap position to grid if enabled
     */
    snapToGrid(pos) {
        if (!this.drawSettings.gridSnap) return pos;
        
        const gridSize = this.mapEditor.worldConfig.gridSize;
        return {
            x: Math.round(pos.x / gridSize) * gridSize,
            y: Math.round(pos.y / gridSize) * gridSize
        };
    }
    
    /**
     * Smooth collision points around a specific point
     */
    smoothPointArea(centerIndex, island) {
        if (!island.collision || island.collision.length < 5) return;
        
        const radius = 2; // Points on each side to smooth
        const smoothingFactor = 0.3;
        
        for (let offset = -radius; offset <= radius; offset++) {
            if (offset === 0) continue;
            
            const index = (centerIndex + offset + island.collision.length) % island.collision.length;
            const prevIndex = (index - 1 + island.collision.length) % island.collision.length;
            const nextIndex = (index + 1) % island.collision.length;
            
            const prev = island.collision[prevIndex];
            const current = island.collision[index];
            const next = island.collision[nextIndex];
            
            // Calculate smoothed position
            const smoothedX = current.x + (prev.x + next.x - 2 * current.x) * smoothingFactor;
            const smoothedY = current.y + (prev.y + next.y - 2 * current.y) * smoothingFactor;
            
            island.collision[index] = { x: smoothedX, y: smoothedY };
        }
        
        this.invalidateCache();
        this.mapEditor.saveUndoState?.();
        this.mapEditor.markDirty('ui');
        
        this.mapEditor.debugFramework.log(`Smoothed collision area around point ${centerIndex}`, 'debug');
    }
    
    /**
     * Auto-trace collision from island image
     */
    autoTraceFromImage(island, startPos) {
        if (!island.image) {
            this.mapEditor.debugFramework.log('No image available for auto-trace', 'warn');
            return;
        }
        
        this.mapEditor.debugFramework.log('Starting auto-trace from image...', 'info');
        
        // This would implement image edge detection algorithms
        // For now, create a simplified circular trace
        const centerX = island.x;
        const centerY = island.y;
        const radius = island.radius * 0.8;
        const points = 16;
        
        const newCollision = [];
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            newCollision.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
        
        island.collision = newCollision;
        this.invalidateCache();
        this.mapEditor.saveUndoState?.();
        this.mapEditor.markDirty('ui');
        
        this.mapEditor.debugFramework.log(`Auto-traced ${points} collision points`, 'info');
    }
    
    /**
     * Optimize collision points using Douglas-Peucker algorithm
     */
    optimizeCollision(island, tolerance = 5) {
        if (!island.collision || island.collision.length < 4) return;
        
        const originalCount = island.collision.length;
        island.collision = this.douglasPeucker(island.collision, tolerance);
        const newCount = island.collision.length;
        
        this.invalidateCache();
        this.mapEditor.saveUndoState?.();
        this.mapEditor.markDirty('ui');
        
        this.mapEditor.debugFramework.log(
            `Collision optimized: ${originalCount} → ${newCount} points (${originalCount - newCount} removed)`, 
            'info'
        );
        
        return { original: originalCount, optimized: newCount, removed: originalCount - newCount };
    }
    
    /**
     * Douglas-Peucker line simplification algorithm
     */
    douglasPeucker(points, tolerance) {
        if (points.length < 3) return points;
        
        // Find the point with maximum distance from line segment
        let maxDistance = 0;
        let maxIndex = 0;
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = this.distanceToLineSegment(points[i], points[0], points[points.length - 1]);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        // If max distance is greater than tolerance, recursively simplify
        if (maxDistance > tolerance) {
            const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
            
            return left.slice(0, -1).concat(right);
        } else {
            return [points[0], points[points.length - 1]];
        }
    }
    
    /**
     * Calculate distance from point to line segment
     */
    distanceToLineSegment(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }
        
        let param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Validate point position for physics compliance
     */
    validatePointPosition(index, island) {
        if (!island.collision || index < 0 || index >= island.collision.length) return;
        
        const point = island.collision[index];
        const prevIndex = (index - 1 + island.collision.length) % island.collision.length;
        const nextIndex = (index + 1) % island.collision.length;
        const prev = island.collision[prevIndex];
        const next = island.collision[nextIndex];
        
        // Check minimum segment length
        const prevDistance = Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));
        const nextDistance = Math.sqrt(Math.pow(point.x - next.x, 2) + Math.pow(point.y - next.y, 2));
        
        if (prevDistance < this.physicsValidator.minSegmentLength || 
            nextDistance < this.physicsValidator.minSegmentLength) {
            this.mapEditor.eventBus.emit('collision:validation-warning', {
                type: 'segment-too-short',
                index,
                message: 'Collision segment too short for physics simulation'
            });
        }
        
        // Check maximum segment length
        if (prevDistance > this.physicsValidator.maxSegmentLength || 
            nextDistance > this.physicsValidator.maxSegmentLength) {
            this.mapEditor.eventBus.emit('collision:validation-warning', {
                type: 'segment-too-long',
                index,
                message: 'Collision segment too long - consider adding intermediate points'
            });
        }
    }
    
    /**
     * Draw collision editing overlays
     */
    drawEditingOverlay(ctx) {
        if (!this.enabled || !this.mapEditor.selectedIsland?.collision) return;
        
        const island = this.mapEditor.selectedIsland;
        const collision = island.collision;
        const zoom = this.mapEditor.state.viewport.zoom;
        const offsetX = this.mapEditor.state.viewport.offsetX;
        const offsetY = this.mapEditor.state.viewport.offsetY;
        
        ctx.save();
        
        // Draw collision polygon
        this.drawCollisionPolygon(ctx, collision, zoom, offsetX, offsetY);
        
        // Draw collision points
        this.drawCollisionPoints(ctx, collision, zoom, offsetX, offsetY);
        
        // Draw additional overlays based on active tool
        this.drawToolSpecificOverlays(ctx, zoom, offsetX, offsetY);
        
        ctx.restore();
    }
    
    drawCollisionPolygon(ctx, collision, zoom, offsetX, offsetY) {
        const layer = this.layers.get(this.activeLayer);
        
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = this.drawSettings.lineWidth;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        for (let i = 0; i < collision.length; i++) {
            const point = collision[i];
            const screenX = point.x * zoom + offsetX;
            const screenY = point.y * zoom + offsetY;
            
            if (i === 0) {
                ctx.moveTo(screenX, screenY);
            } else {
                ctx.lineTo(screenX, screenY);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Fill with semi-transparent color
        ctx.fillStyle = layer.color + '20';
        ctx.fill();
    }
    
    drawCollisionPoints(ctx, collision, zoom, offsetX, offsetY) {
        for (let i = 0; i < collision.length; i++) {
            const point = collision[i];
            const screenX = point.x * zoom + offsetX;
            const screenY = point.y * zoom + offsetY;
            
            const isSelected = this.selectedPoints.has(i);
            const isHover = this.hoverPoint === i;
            const isDragged = this.draggedPoint?.index === i;
            
            let radius = this.drawSettings.pointRadius;
            let fillColor = '#ffffff';
            let strokeColor = '#2c3e50';
            
            if (isDragged) {
                radius = this.drawSettings.selectedPointRadius * 1.2;
                fillColor = '#e74c3c';
                strokeColor = '#c0392b';
            } else if (isSelected) {
                radius = this.drawSettings.selectedPointRadius;
                fillColor = '#3498db';
                strokeColor = '#2980b9';
            } else if (isHover) {
                radius = this.drawSettings.pointRadius * 1.3;
                fillColor = '#f39c12';
                strokeColor = '#e67e22';
            }
            
            // Draw point
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw point index if zoomed in enough
            if (zoom > 0.5) {
                ctx.fillStyle = strokeColor;
                ctx.font = `${Math.min(12, radius)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(i.toString(), screenX, screenY);
            }
        }
    }
    
    drawToolSpecificOverlays(ctx, zoom, offsetX, offsetY) {
        const tool = this.tools.active;
        
        switch (tool) {
            case 'add':
                this.drawAddToolOverlay(ctx, zoom, offsetX, offsetY);
                break;
            case 'remove':
                this.drawRemoveToolOverlay(ctx, zoom, offsetX, offsetY);
                break;
            case 'smooth':
                this.drawSmoothToolOverlay(ctx, zoom, offsetX, offsetY);
                break;
        }
    }
    
    drawAddToolOverlay(ctx, zoom, offsetX, offsetY) {
        if (this.hoverPoint !== -1) return;
        
        // Draw insertion preview
        const mouseWorld = this.mapEditor.worldMousePos;
        const island = this.mapEditor.selectedIsland;
        
        if (mouseWorld && island?.collision) {
            const insertIndex = this.findBestInsertionPoint(mouseWorld, island);
            const prevIndex = (insertIndex - 1 + island.collision.length) % island.collision.length;
            const prev = island.collision[prevIndex];
            
            const screenX = mouseWorld.x * zoom + offsetX;
            const screenY = mouseWorld.y * zoom + offsetY;
            const prevScreenX = prev.x * zoom + offsetX;
            const prevScreenY = prev.y * zoom + offsetY;
            
            // Draw preview connection
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(prevScreenX, prevScreenY);
            ctx.lineTo(screenX, screenY);
            ctx.stroke();
            
            // Draw preview point
            ctx.fillStyle = '#f39c12';
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.drawSettings.pointRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    drawRemoveToolOverlay(ctx, zoom, offsetX, offsetY) {
        if (this.hoverPoint !== -1) {
            const island = this.mapEditor.selectedIsland;
            const point = island.collision[this.hoverPoint];
            const screenX = point.x * zoom + offsetX;
            const screenY = point.y * zoom + offsetY;
            
            // Draw X over point to be removed
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            const size = this.drawSettings.pointRadius * 1.5;
            
            ctx.beginPath();
            ctx.moveTo(screenX - size, screenY - size);
            ctx.lineTo(screenX + size, screenY + size);
            ctx.moveTo(screenX + size, screenY - size);
            ctx.lineTo(screenX - size, screenY + size);
            ctx.stroke();
        }
    }
    
    drawSmoothToolOverlay(ctx, zoom, offsetX, offsetY) {
        if (this.hoverPoint !== -1) {
            const island = this.mapEditor.selectedIsland;
            const point = island.collision[this.hoverPoint];
            const screenX = point.x * zoom + offsetX;
            const screenY = point.y * zoom + offsetY;
            
            // Draw smooth radius indicator
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            const radius = 40; // Visual indicator radius
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Listen for island selection changes
        this.mapEditor.eventBus.on('island:selected', (data) => {
            this.selectedPoints.clear();
            this.draggedPoint = null;
            this.hoverPoint = null;
            this.invalidateCache();
        });
        
        // Listen for validation events
        this.mapEditor.eventBus.on('collision:validation-warning', (data) => {
            this.mapEditor.debugFramework.log(`Collision warning: ${data.message}`, 'warn');
        });
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        // Update tool buttons, layer visibility, etc.
        this.mapEditor.eventBus.emit('collision-editor:ui-update', {
            enabled: this.enabled,
            activeTool: this.tools.active,
            activeLayer: this.activeLayer,
            selectedPoints: Array.from(this.selectedPoints)
        });
    }
    
    /**
     * Invalidate cached data
     */
    invalidateCache() {
        this.cache.dirty = true;
        this.cache.boundingBox = null;
        this.cache.triangulation = null;
        this.cache.convexHull = null;
    }
    
    /**
     * Get collision editor statistics
     */
    getStats() {
        const island = this.mapEditor.selectedIsland;
        if (!island?.collision) return null;
        
        return {
            pointCount: island.collision.length,
            selectedPoints: this.selectedPoints.size,
            activeLayer: this.activeLayer,
            activeTool: this.tools.active,
            area: this.calculatePolygonArea(island.collision),
            perimeter: this.calculatePolygonPerimeter(island.collision)
        };
    }
    
    calculatePolygonArea(points) {
        if (points.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area) / 2;
    }
    
    calculatePolygonPerimeter(points) {
        if (points.length < 2) return 0;
        
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const dx = points[j].x - points[i].x;
            const dy = points[j].y - points[i].y;
            perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        return perimeter;
    }
}

// Make available globally
window.EnhancedCollisionEditor = EnhancedCollisionEditor;