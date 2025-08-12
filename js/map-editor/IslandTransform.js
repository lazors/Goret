export class IslandTransform {
    constructor(mapEditor) {
        this.mapEditor = mapEditor;
        this.isDragging = false;
        this.isRotating = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartIslandX = 0;
        this.dragStartIslandY = 0;
        this.rotationStartAngle = 0;
        this.rotationStartIslandAngle = 0;
        this.activeHotCorner = null;
        this.hotCornerSize = 15;
        this.rotationHandleDistance = 60;
        this.hotCorners = ['nw', 'ne', 'se', 'sw'];
        this.resizeStartScale = 1;
        this.resizeStartMouseDist = 0;
        this.isResizing = false;
    }

    getIslandBounds(island) {
        if (!island || !island.image) return null;

        // Use radius-based sizing like the game does
        const baseSize = island.radius ? island.radius * 2 : Math.max(island.image.width, island.image.height);
        const size = baseSize * (island.scale || 1.0);
        const width = size;
        const height = size;
        const angle = island.rotation || 0;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const corners = [
            { x: -width / 2, y: -height / 2 },
            { x: width / 2, y: -height / 2 },
            { x: width / 2, y: height / 2 },
            { x: -width / 2, y: height / 2 }
        ];

        const rotatedCorners = corners.map(corner => ({
            x: island.x + corner.x * cos - corner.y * sin,
            y: island.y + corner.x * sin + corner.y * cos
        }));

        return rotatedCorners;
    }

    getHotCornerPositions(island) {
        const bounds = this.getIslandBounds(island);
        if (!bounds) return [];

        return bounds.map((corner, index) => ({
            id: this.hotCorners[index],
            x: corner.x,
            y: corner.y
        }));
    }

    getRotationHandlePosition(island) {
        if (!island || !island.image) return null;

        const angle = island.rotation || 0;
        const handleX = island.x + Math.cos(angle - Math.PI / 2) * this.rotationHandleDistance;
        const handleY = island.y + Math.sin(angle - Math.PI / 2) * this.rotationHandleDistance;

        return { x: handleX, y: handleY };
    }

    isPointInHotCorner(worldX, worldY, cornerX, cornerY) {
        const dist = Math.sqrt(
            Math.pow(worldX - cornerX, 2) +
            Math.pow(worldY - cornerY, 2)
        );
        return dist <= this.hotCornerSize;
    }

    isPointInRotationHandle(worldX, worldY, island) {
        const handle = this.getRotationHandlePosition(island);
        if (!handle) return false;

        const dist = Math.sqrt(
            Math.pow(worldX - handle.x, 2) +
            Math.pow(worldY - handle.y, 2)
        );
        return dist <= this.hotCornerSize;
    }

    checkHotCorner(worldX, worldY, island) {
        if (!island) return null;

        const corners = this.getHotCornerPositions(island);
        for (const corner of corners) {
            if (this.isPointInHotCorner(worldX, worldY, corner.x, corner.y)) {
                return corner.id;
            }
        }

        if (this.isPointInRotationHandle(worldX, worldY, island)) {
            return 'rotate';
        }

        return null;
    }

    startDrag(worldX, worldY, island) {
        if (!island) return false;

        const hotCorner = this.checkHotCorner(worldX, worldY, island);
        
        if (hotCorner === 'rotate') {
            this.isRotating = true;
            const dx = worldX - island.x;
            const dy = worldY - island.y;
            this.rotationStartAngle = Math.atan2(dy, dx);
            this.rotationStartIslandAngle = island.rotation || 0;
            return true;
        } else if (hotCorner) {
            this.isResizing = true;
            this.activeHotCorner = hotCorner;
            this.resizeStartScale = island.scale || 1;
            const centerDist = Math.sqrt(
                Math.pow(worldX - island.x, 2) +
                Math.pow(worldY - island.y, 2)
            );
            this.resizeStartMouseDist = centerDist;
            return true;
        } else {
            const bounds = this.getIslandBounds(island);
            if (bounds && this.isPointInIsland(worldX, worldY, bounds)) {
                this.isDragging = true;
                this.dragStartX = worldX;
                this.dragStartY = worldY;
                this.dragStartIslandX = island.x;
                this.dragStartIslandY = island.y;
                return true;
            }
        }

        return false;
    }

    isPointInIsland(x, y, bounds) {
        if (!bounds || bounds.length !== 4) return false;

        let inside = false;
        for (let i = 0, j = bounds.length - 1; i < bounds.length; j = i++) {
            const xi = bounds[i].x, yi = bounds[i].y;
            const xj = bounds[j].x, yj = bounds[j].y;

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    updateDrag(worldX, worldY, island) {
        if (!island) return false;

        if (this.isDragging) {
            const dx = worldX - this.dragStartX;
            const dy = worldY - this.dragStartY;
            
            island.x = this.dragStartIslandX + dx;
            island.y = this.dragStartIslandY + dy;

            island.x = Math.max(0, Math.min(10240, island.x));
            island.y = Math.max(0, Math.min(7680, island.y));

            if (island.collisionCircles) {
                island.collisionCircles.forEach(circle => {
                    circle.worldX = island.x + circle.x;
                    circle.worldY = island.y + circle.y;
                });
            }

            return true;
        } else if (this.isRotating) {
            const dx = worldX - island.x;
            const dy = worldY - island.y;
            const currentAngle = Math.atan2(dy, dx);
            const angleDiff = currentAngle - this.rotationStartAngle;
            
            island.rotation = this.rotationStartIslandAngle + angleDiff;
            
            while (island.rotation > Math.PI * 2) {
                island.rotation -= Math.PI * 2;
            }
            while (island.rotation < 0) {
                island.rotation += Math.PI * 2;
            }

            return true;
        } else if (this.isResizing) {
            const currentDist = Math.sqrt(
                Math.pow(worldX - island.x, 2) +
                Math.pow(worldY - island.y, 2)
            );
            
            const scaleFactor = currentDist / this.resizeStartMouseDist;
            island.scale = Math.max(0.1, Math.min(5, this.resizeStartScale * scaleFactor));

            return true;
        }

        return false;
    }

    endDrag() {
        const wasTransforming = this.isDragging || this.isRotating || this.isResizing;
        
        // If we were resizing, bake the scale into the radius
        if (this.isResizing && this.mapEditor.selectedIsland) {
            const island = this.mapEditor.selectedIsland;
            if (island.scale && island.scale !== 1.0) {
                // Update the radius with the scaled value
                const baseRadius = island.radius || (island.image ? Math.max(island.image.width, island.image.height) / 2 : 200);
                island.radius = baseRadius * island.scale;
                island.scale = 1.0;  // Reset scale to 1.0
            }
        }
        
        this.isDragging = false;
        this.isRotating = false;
        this.isResizing = false;
        this.activeHotCorner = null;

        return wasTransforming;
    }

    renderTransformHandles(ctx, island, viewport) {
        if (!island || !island.image) return;

        ctx.save();

        const corners = this.getHotCornerPositions(island);
        corners.forEach(corner => {
            const screenX = (corner.x - viewport.x) * viewport.zoom;
            const screenY = (corner.y - viewport.y) * viewport.zoom;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.hotCornerSize * viewport.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (corner.id === 'nw') {
                ctx.fillStyle = '#3498db';
                ctx.font = `${10 * viewport.zoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↖', screenX, screenY);
            } else if (corner.id === 'ne') {
                ctx.fillStyle = '#3498db';
                ctx.font = `${10 * viewport.zoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↗', screenX, screenY);
            } else if (corner.id === 'se') {
                ctx.fillStyle = '#3498db';
                ctx.font = `${10 * viewport.zoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↘', screenX, screenY);
            } else if (corner.id === 'sw') {
                ctx.fillStyle = '#3498db';
                ctx.font = `${10 * viewport.zoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('↙', screenX, screenY);
            }
        });

        const rotHandle = this.getRotationHandlePosition(island);
        if (rotHandle) {
            const screenX = (rotHandle.x - viewport.x) * viewport.zoom;
            const screenY = (rotHandle.y - viewport.y) * viewport.zoom;
            const centerScreenX = (island.x - viewport.x) * viewport.zoom;
            const centerScreenY = (island.y - viewport.y) * viewport.zoom;

            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerScreenX, centerScreenY);
            ctx.lineTo(screenX, screenY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#e74c3c';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.hotCornerSize * viewport.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = `${12 * viewport.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⟲', screenX, screenY);
        }

        const bounds = this.getIslandBounds(island);
        if (bounds) {
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            
            ctx.beginPath();
            bounds.forEach((corner, index) => {
                const screenX = (corner.x - viewport.x) * viewport.zoom;
                const screenY = (corner.y - viewport.y) * viewport.zoom;
                
                if (index === 0) {
                    ctx.moveTo(screenX, screenY);
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            });
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    getCursor(worldX, worldY, island) {
        if (!island) return 'default';

        const hotCorner = this.checkHotCorner(worldX, worldY, island);
        
        if (hotCorner === 'rotate') {
            return 'grab';
        } else if (hotCorner === 'nw' || hotCorner === 'se') {
            return 'nwse-resize';
        } else if (hotCorner === 'ne' || hotCorner === 'sw') {
            return 'nesw-resize';
        } else {
            const bounds = this.getIslandBounds(island);
            if (bounds && this.isPointInIsland(worldX, worldY, bounds)) {
                return 'move';
            }
        }

        return 'default';
    }

    isTransforming() {
        return this.isDragging || this.isRotating || this.isResizing;
    }
}