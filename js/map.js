/**
 * Pirate Game - Map Module
 * Loading and rendering map with realistic animated waves
 */

class GameMap {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;
        
        // Map dimensions - 10x bigger for massive ocean
        this.width = 10240; // 10x 1024
        this.height = 7680; // 10x 768
        
        // Enhanced wave system
        this.waveLayers = [];
        this.waveTime = 0;
        this.waveSpeed = 0.5; // Time-based animation speed
        
        // Initialize multiple wave layers for realistic ocean
        this.initializeWaveLayers();
        
        // Map boundaries for collisions
        this.bounds = {
            left: 0,
            top: 0,
            right: this.width,
            bottom: this.height
        };
        
        // Islands and obstacles - realistic irregular shapes
        this.islands = [];
        
        // Initialize islands with positions
        this.initializeIslands();
        
        console.log('🗺️ Map initialized with enhanced wave system');
    }
    
    initializeWaveLayers() {
        // Create realistic ocean wave layers with actual wave patterns
        this.waveLayers = [
            {
                // Primary ocean swells - large rolling waves
                amplitude: 15,
                frequency: 0.008,
                speed: 0.15,
                direction: { x: 1, y: 0.1 },
                color: 'rgba(255, 255, 255, 0.08)',
                thickness: 2,
                type: 'swell'
            },
            {
                // Secondary waves - medium wave patterns
                amplitude: 10,
                frequency: 0.012,
                speed: 0.25,
                direction: { x: -0.8, y: 0.4 },
                color: 'rgba(255, 255, 255, 0.06)',
                thickness: 1.5,
                type: 'wave'
            },
            {
                // Surface ripples - small wave details
                amplitude: 6,
                frequency: 0.02,
                speed: 0.4,
                direction: { x: 0.6, y: -0.5 },
                color: 'rgba(255, 255, 255, 0.04)',
                thickness: 1,
                type: 'ripple'
            }
        ];
    }
    
    initializeIslands() {
        // Single Saint Kits island in the center of the massive ocean
        this.islands = [
            {
                x: 2000, // Moved closer to middle from left corner
                y: 1500,
                radius: 600, // 5x bigger island (120 * 5 = 600)
                name: 'Saint Kits Island',
                image: this.assets.island,
                outline: null // Will be populated with actual island outline
            }
        ];
        
        // Generate outline data for collision detection
        this.generateIslandOutlines();
        
        console.log('🏝️ Saint Kits Island initialized with outline collision');
    }
    
    generateIslandOutlines() {
        this.islands.forEach(island => {
            console.log('🏝️ Starting outline generation for', island.name);
            console.log('📷 Island image available:', !!island.image);
            console.log('🖼️ Image type:', island.image ? island.image.constructor.name : 'None');
            
            // Use image-based outline generation for accurate coastline collision
            if (island.image) {
                try {
                    island.outline = this.generateOutlineFromImage(island.image, island.radius);
                    console.log('✅ Generated image-based outline for', island.name, 'with', island.outline.points.length, 'points');
                } catch (error) {
                    console.error('❌ Error generating image outline:', error);
                    island.outline = this.generateManualOutline(island.radius);
                    console.log('🔄 Fallback to manual outline for', island.name, 'with', island.outline.points.length, 'points');
                }
            } else {
                // Fallback to manual outline if no image available
                island.outline = this.generateManualOutline(island.radius);
                console.log('🔄 Generated manual outline for', island.name, 'with', island.outline.points.length, 'points');
            }
        });
    }
    
    generateManualOutline(radius) {
        // Create a manual outline that approximates an island shape
        // This is more reliable than image analysis and works consistently
        const points = [];
        const segments = 64; // More points for smoother outline
        
        // Create an irregular island-like shape
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Add some variation to make it look more like an island
            const variation = 0.8 + 0.2 * Math.sin(angle * 3) + 0.1 * Math.sin(angle * 7);
            const r = radius * variation;
            
            points.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        
        return {
            points: points,
            bounds: { minX: -radius, minY: -radius, maxX: radius, maxY: radius }
        };
    }
    
    generateOutlineFromImage(image, radius) {
        try {
            // Create a temporary canvas to analyze the image
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Use higher resolution for better coastline detection
            const resolution = radius * 2;
            tempCanvas.width = resolution;
            tempCanvas.height = resolution;
            
            // Draw the image
            tempCtx.drawImage(image, 0, 0, resolution, resolution);
            
            // Try to get image data (may fail due to CORS)
            let imageData;
            try {
                imageData = tempCtx.getImageData(0, 0, resolution, resolution);
                console.log('✅ Successfully got image data for coastline analysis');
            } catch (error) {
                console.warn('⚠️ CORS blocked image analysis:', error.message);
                console.log('🔄 Falling back to manual outline generation');
                return this.generateManualOutline(radius);
            }
            
            const data = imageData.data;
            
            // Find coastline by edge detection - scan from outside to inside
            const outlinePoints = [];
            const step = 1; // Use 1 pixel accuracy for better coastline detection
            const center = resolution / 2;
            
            // Scan in radial directions from center to find island edges
            const angleSteps = 128; // More angles for smoother coastline
            for (let i = 0; i < angleSteps; i++) {
                const angle = (i / angleSteps) * Math.PI * 2;
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);
                
                // Scan from center outwards to find the edge
                for (let distance = 0; distance < radius; distance += step) {
                    const x = Math.round(center + dx * distance);
                    const y = Math.round(center + dy * distance);
                    
                    if (x >= 0 && x < resolution && y >= 0 && y < resolution) {
                        const index = (y * resolution + x) * 4;
                        const alpha = data[index + 3];
                        
                        // If we hit a transparent pixel, the previous one was the edge
                        if (alpha <= 128) {
                            const prevDistance = Math.max(0, distance - step);
                            const edgeX = center + dx * prevDistance;
                            const edgeY = center + dy * prevDistance;
                            
                            // Convert to relative coordinates (center at 0,0)
                            outlinePoints.push({
                                x: edgeX - center,
                                y: edgeY - center
                            });
                            break;
                        }
                    } else {
                        // Hit canvas boundary, use current position
                        const edgeX = center + dx * distance;
                        const edgeY = center + dy * distance;
                        
                        outlinePoints.push({
                            x: edgeX - center,
                            y: edgeY - center
                        });
                        break;
                    }
                }
            }
            
            // If no outline points found, use fallback
            if (outlinePoints.length === 0) {
                console.warn('⚠️ No coastline points found, using fallback');
                return this.generateManualOutline(radius);
            }
            
            console.log('🏖️ Successfully extracted', outlinePoints.length, 'coastline points from island image');
            
            // Smooth the coastline by reducing noise
            const smoothedPoints = this.smoothCoastline(outlinePoints);
            
            console.log('🌊 Coastline smoothed to', smoothedPoints.length, 'points');
            
            return {
                points: smoothedPoints,
                bounds: this.calculateOutlineBounds(smoothedPoints)
            };
            
        } catch (error) {
            console.warn('⚠️ Error generating coastline outline:', error);
            return this.generateManualOutline(radius);
        }
    }
    
    generateCircularOutline(radius) {
        // Generate a circular outline as fallback
        const points = [];
        const segments = 32; // Number of points around the circle
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        return {
            points: points,
            bounds: { minX: -radius, minY: -radius, maxX: radius, maxY: radius }
        };
    }
    
    simplifyOutline(points, tolerance) {
        if (points.length <= 2) return points;
        
        const simplified = [];
        let lastPoint = points[0];
        simplified.push(lastPoint);
        
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            const distance = Math.sqrt(
                Math.pow(point.x - lastPoint.x, 2) + 
                Math.pow(point.y - lastPoint.y, 2)
            );
            
            if (distance > tolerance) {
                simplified.push(point);
                lastPoint = point;
            }
        }
        
        return simplified;
    }
    
    smoothCoastline(points) {
        if (points.length < 3) return points;
        
        const smoothed = [];
        const smoothingFactor = 0.3; // How much smoothing to apply (0 = no smoothing, 1 = max smoothing)
        
        // Apply simple moving average smoothing
        for (let i = 0; i < points.length; i++) {
            const prevIndex = (i - 1 + points.length) % points.length;
            const nextIndex = (i + 1) % points.length;
            
            const current = points[i];
            const prev = points[prevIndex];
            const next = points[nextIndex];
            
            // Calculate smoothed position
            const smoothedX = current.x * (1 - smoothingFactor) + 
                            (prev.x + next.x) * smoothingFactor * 0.5;
            const smoothedY = current.y * (1 - smoothingFactor) + 
                            (prev.y + next.y) * smoothingFactor * 0.5;
            
            smoothed.push({
                x: smoothedX,
                y: smoothedY
            });
        }
        
        return smoothed;
    }
    
    calculateOutlineBounds(points) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        return { minX, minY, maxX, maxY };
    }
    
    update(deltaTime) {
        // Update wave animation time (continuous, never resets)
        this.waveTime += this.waveSpeed * deltaTime;
        
        // Update each wave layer
        this.waveLayers.forEach(layer => {
            layer.currentTime = this.waveTime * layer.speed;
        });
    }
    
    draw(ctx) {
        // Render base map
        this.drawBaseMap(ctx);
        
        // Render realistic animated waves
        this.drawRealisticWaves(ctx);
        
        // Render islands over waves
        this.drawIslandsOverlay(ctx);
    }
    
    drawBaseMap(ctx) {
        // Draw main map background with single shade of blue
        if (this.assets.map) {
            ctx.drawImage(this.assets.map, 0, 0);
        } else {
            // Single shade ocean background
            ctx.fillStyle = '#2980b9'; // Medium blue - single shade
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    drawRealisticWaves(ctx) {
        // Draw each wave layer from largest to smallest
        for (let i = this.waveLayers.length - 1; i >= 0; i--) {
            this.drawWaveLayer(ctx, this.waveLayers[i]);
        }
    }
    
    drawWaveLayer(ctx, layer) {
        const { amplitude, frequency, direction, color, thickness, currentTime, type } = layer;
        
        // Skip drawing for cleaner ocean surface
        // Only keep subtle wave effects without visible lines
        return;
    }
    
    drawWaveCrests(ctx, amplitude, frequency, direction, time, type) {
        // Draw multiple wave crests across the ocean
        const crestSpacing = 80; // Distance between wave crests
        const numCrests = Math.ceil(this.width / crestSpacing) + 4;
        
        for (let i = 0; i < numCrests; i++) {
            const crestOffset = i * crestSpacing;
            this.drawSingleWaveCrest(ctx, crestOffset, amplitude, frequency, direction, time, type);
        }
    }
    
    drawSingleWaveCrest(ctx, offset, amplitude, frequency, direction, time, type) {
        ctx.beginPath();
        
        // Start and end points for the wave crest
        const startX = -100;
        const endX = this.width + 100;
        const stepSize = 3;
        
        let firstPoint = true;
        
        for (let x = startX; x <= endX; x += stepSize) {
            // Calculate wave position with realistic ocean physics
            const wavePhase = frequency * (x * direction.x + offset * direction.y) + time;
            
            let y;
            if (type === 'swell') {
                // Large rolling ocean swells
                y = Math.sin(wavePhase) * amplitude + 
                    Math.sin(wavePhase * 0.7) * amplitude * 0.3;
            } else if (type === 'wave') {
                // Medium waves with more detail
                y = Math.sin(wavePhase) * amplitude + 
                    Math.sin(wavePhase * 1.3) * amplitude * 0.2 +
                    Math.sin(wavePhase * 0.5) * amplitude * 0.1;
            } else {
                // Small ripples
                y = Math.sin(wavePhase) * amplitude + 
                    Math.sin(wavePhase * 2.1) * amplitude * 0.4;
            }
            
            // Apply depth-based lighting (lighter near islands)
            const depthLighting = this.getDepthLighting(x, y);
            const adjustedY = y * depthLighting;
            
            // Add some vertical offset for wave positioning
            const finalY = adjustedY + (offset * 0.3);
            
            if (firstPoint) {
                ctx.moveTo(x, finalY);
                firstPoint = false;
            } else {
                ctx.lineTo(x, finalY);
            }
        }
        
        ctx.stroke();
    }
    
    getDepthLighting(x, y) {
        // Return constant lighting - no depth effects
        return 1.0;
    }
    
    drawIslandsOverlay(ctx) {
        // Simple island rendering with island images - no lighting effects
        this.islands.forEach(island => {
            // Draw island image
            if (island.image) {
                ctx.drawImage(
                    island.image,
                    island.x - island.radius,
                    island.y - island.radius,
                    island.radius * 2,
                    island.radius * 2
                );
            } else {
                // Fallback to shape drawing
                ctx.fillStyle = '#8fbc8f';
                this.drawIslandShape(ctx, island);
                
                ctx.fillStyle = '#a8d5a8';
                this.drawIslandShape(ctx, island, -5, -5, 0.8);
            }
        });
    }
    
    drawIslandShape(ctx, island, offsetX = 0, offsetY = 0, scale = 1.0) {
        if (island.points) {
            // Draw irregular shape using points
            ctx.beginPath();
            const firstPoint = island.points[0];
            ctx.moveTo(
                island.x + offsetX + (firstPoint.x * scale), 
                island.y + offsetY + (firstPoint.y * scale)
            );
            
            for (let i = 1; i < island.points.length; i++) {
                const point = island.points[i];
                ctx.lineTo(
                    island.x + offsetX + (point.x * scale), 
                    island.y + offsetY + (point.y * scale)
                );
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Fallback to circle for backward compatibility
            ctx.beginPath();
            ctx.arc(island.x + offsetX, island.y + offsetY, island.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    

    
    drawRealisticIslandWakes(ctx, island) {
        // Removed dashed wake rings - keeping only the depth transitions
        // No more cursor-like lines around islands
        return;
    }
    
    // Methods for collisions and boundary checking
    checkBounds(x, y, radius = 32) {
        return {
            left: x - radius >= this.bounds.left,
            right: x + radius <= this.bounds.right,
            top: y - radius >= this.bounds.top,
            bottom: y + radius <= this.bounds.bottom
        };
    }
    
    isInBounds(x, y, radius = 32) {
        return x - radius >= this.bounds.left && 
               x + radius <= this.bounds.right && 
               y - radius >= this.bounds.top && 
               y + radius <= this.bounds.bottom;
    }
    
    checkIslandCollision(x, y, radius = 32) {
        for (let island of this.islands) {
            // Quick bounding box check first
            if (island.outline && island.outline.bounds) {
                const bounds = island.outline.bounds;
                const shipLeft = x - radius;
                const shipRight = x + radius;
                const shipTop = y - radius;
                const shipBottom = y + radius;
                
                const islandLeft = island.x + bounds.minX;
                const islandRight = island.x + bounds.maxX;
                const islandTop = island.y + bounds.minY;
                const islandBottom = island.y + bounds.maxY;
                
                // If no overlap in bounding boxes, no collision
                if (shipRight < islandLeft || shipLeft > islandRight || 
                    shipBottom < islandTop || shipTop > islandBottom) {
                    continue;
                }
            }
            
            // Use outline-based collision detection
            if (island.outline && island.outline.points) {
                const collision = this.checkOutlineCollision(x, y, radius, island);
                if (collision.collision) {
                    return collision;
                }
            } else {
                // Fallback to circular collision
                const distance = Math.sqrt(
                    Math.pow(x - island.x, 2) + Math.pow(y - island.y, 2)
                );
                
                const collisionDistance = island.radius + radius;
                
                if (distance < collisionDistance) {
                    return {
                        collision: true,
                        island: island,
                        distance: distance,
                        pushX: (x - island.x) / distance,
                        pushY: (y - island.y) / distance
                    };
                }
            }
        }
        
        return { collision: false };
    }
    
    checkOutlineCollision(shipX, shipY, shipRadius, island) {
        // Convert ship position to island's local coordinate system
        const localX = shipX - island.x;
        const localY = shipY - island.y;
        
        // Find the closest point on the island outline to the ship
        let closestDistance = Infinity;
        let closestPoint = null;
        
        // Check if we have valid outline points
        if (!island.outline || !island.outline.points || island.outline.points.length === 0) {
            console.warn('⚠️ No valid outline points for collision detection');
            return { collision: false };
        }
        
        // Find closest point on outline
        for (let i = 0; i < island.outline.points.length; i++) {
            const point = island.outline.points[i];
            const distance = Math.sqrt(
                Math.pow(localX - point.x, 2) + Math.pow(localY - point.y, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        }
        
        // Add a small buffer to make collision detection more responsive
        const collisionBuffer = 10;
        
        // Check if ship is colliding with the outline
        if (closestDistance < (shipRadius + collisionBuffer)) {
            // Calculate push direction from closest point to ship
            const pushX = (localX - closestPoint.x) / closestDistance;
            const pushY = (localY - closestPoint.y) / closestDistance;
            
            // Debug logging in debug mode
            if (window.DEBUG_MODE) {
                console.log('🚢 Outline collision detected:', {
                    shipPos: { x: shipX, y: shipY },
                    closestPoint: { x: island.x + closestPoint.x, y: island.y + closestPoint.y },
                    distance: closestDistance,
                    shipRadius: shipRadius,
                    collisionBuffer: collisionBuffer,
                    pushDirection: { x: pushX, y: pushY }
                });
            }
            
            return {
                collision: true,
                island: island,
                distance: closestDistance,
                pushX: pushX,
                pushY: pushY,
                closestPoint: {
                    x: island.x + closestPoint.x,
                    y: island.y + closestPoint.y
                }
            };
        }
        
        return { collision: false };
    }
    

    
    getDistanceToPolygon(x, y, island) {
        // Calculate distance from point to irregular polygon
        let minDistance = Infinity;
        
        for (let i = 0; i < island.points.length; i++) {
            const currentPoint = island.points[i];
            const nextPoint = island.points[(i + 1) % island.points.length];
            
            const px = island.x + currentPoint.x;
            const py = island.y + currentPoint.y;
            const nx = island.x + nextPoint.x;
            const ny = island.y + nextPoint.y;
            
            // Distance to line segment
            const distance = this.distanceToLineSegment(x, y, px, py, nx, ny);
            minDistance = Math.min(minDistance, distance);
        }
        
        return minDistance;
    }
    
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getConstrainedPosition(x, y, radius = 32) {
        // Constrain position within map bounds
        const constrainedX = Math.max(radius, Math.min(this.width - radius, x));
        const constrainedY = Math.max(radius, Math.min(this.height - radius, y));
        
        return { x: constrainedX, y: constrainedY };
    }
    
    // Method for getting water depth (for future mechanics)
    getWaterDepth(x, y) {
        // Simple depth calculation based on distance from islands
        let minDistance = Infinity;
        
        this.islands.forEach(island => {
            const distance = Math.sqrt(
                Math.pow(x - island.x, 2) + Math.pow(y - island.y, 2)
            );
            minDistance = Math.min(minDistance, distance - island.radius);
        });
        
        // Normalized depth from 0 to 1 - increased range for bigger map
        return Math.max(0, Math.min(1, minDistance / 500));
    }
    
    // Get current wind (for future mechanics)
    getWindAt(x, y) {
        const time = this.waveTime * 0.5;
        const windX = Math.sin(time + x * 0.01) * 0.5;
        const windY = Math.cos(time + y * 0.01) * 0.3;
        
        return { x: windX, y: windY };
    }
    
    // Debug rendering
    drawDebugInfo(ctx) {
        // Display map boundaries
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.bounds.left, this.bounds.top, 
                       this.bounds.right - this.bounds.left, 
                       this.bounds.bottom - this.bounds.top);
        
        // Display islands with actual outline collision boundaries
        this.islands.forEach(island => {
            if (island.outline && island.outline.points) {
                // Draw actual island outline (red line)
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                const firstPoint = island.outline.points[0];
                ctx.moveTo(island.x + firstPoint.x, island.y + firstPoint.y);
                
                for (let i = 1; i < island.outline.points.length; i++) {
                    const point = island.outline.points[i];
                    ctx.lineTo(island.x + point.x, island.y + point.y);
                }
                
                // Close the outline
                ctx.lineTo(island.x + firstPoint.x, island.y + firstPoint.y);
                ctx.stroke();
                
                // Draw outline points (small dots)
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                island.outline.points.forEach(point => {
                    ctx.beginPath();
                    ctx.arc(island.x + point.x, island.y + point.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                // Draw collision buffer zone (yellow dashed line)
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                
                island.outline.points.forEach((point, index) => {
                    const x = island.x + point.x;
                    const y = island.y + point.y;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                // Close the buffer zone
                const firstPointBuffer = island.outline.points[0];
                ctx.lineTo(island.x + firstPointBuffer.x, island.y + firstPointBuffer.y);
                ctx.stroke();
                ctx.setLineDash([]); // Reset line dash
                
            } else {
                // Fallback to circular boundary
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Island labels
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.fillText(`Outline Points: ${island.outline ? island.outline.points.length : 'N/A'}`, 
                        island.x - 40, island.y - island.radius - 10);
            
            // Show collision type
            if (island.outline && island.outline.points && island.outline.points.length > 0) {
                ctx.fillText(`Collision: Outline`, island.x - 30, island.y - island.radius - 25);
            } else {
                ctx.fillText(`Collision: Circular`, island.x - 30, island.y - island.radius - 25);
            }
        });
        
        // Display wave info
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`Wave Time: ${this.waveTime.toFixed(2)}`, 10, 20);
        ctx.fillText(`Wave Layers: ${this.waveLayers.length}`, 10, 35);
        
        // Display collision system info
        ctx.fillText(`Collision System: ${this.islands[0].outline && this.islands[0].outline.points ? 'Outline' : 'Circular'}`, 10, 50);
        ctx.fillText(`Outline Points: ${this.islands[0].outline ? this.islands[0].outline.points.length : 'N/A'}`, 10, 65);
        ctx.fillText(`Collision Buffer: 10px`, 10, 80);
    }
} 