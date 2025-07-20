/**
 * Pirate Game - Map Module
 * Loading and rendering map with realistic animated waves
 */

class GameMap {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;
        
        // Map dimensions
        this.width = 1024;
        this.height = 768;
        
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
        // Draw main map background
        if (this.assets.map) {
            ctx.drawImage(this.assets.map, 0, 0);
        } else {
            // Enhanced gradient background for foam patterns
            const gradient = ctx.createRadialGradient(512, 384, 100, 512, 384, 600);
            gradient.addColorStop(0, '#0c2d6b'); // Deep blue
            gradient.addColorStop(0.2, '#1e3a5f'); // Dark blue
            gradient.addColorStop(0.4, '#2980b9'); // Medium blue
            gradient.addColorStop(0.7, '#3498db'); // Light blue
            gradient.addColorStop(0.9, '#5dade2'); // Very light blue
            gradient.addColorStop(1, '#85c1e9'); // Near surface blue
            ctx.fillStyle = gradient;
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
        // Calculate lighting based on distance from islands (lighter near islands)
        let minDistance = Infinity;
        
        this.islands.forEach(island => {
            const distance = Math.sqrt(
                Math.pow(x - island.x, 2) + Math.pow(y - island.y, 2)
            );
            minDistance = Math.min(minDistance, distance);
        });
        
        // Create lighting effect: brighter near islands, darker in deep water
        const maxLightDistance = 150; // Distance where lighting effect fades
        const lightingFactor = Math.max(0.3, Math.min(1.5, 1.5 - (minDistance / maxLightDistance)));
        
        return lightingFactor;
    }
    
    drawIslandsOverlay(ctx) {
        // Enhanced island rendering with realistic irregular shapes
        this.islands.forEach(island => {
            // Draw depth transitions (lighter water near islands)
            this.drawIslandDepthTransition(ctx, island);
            
            // Draw sandy seashore
            this.drawIslandSeashore(ctx, island);
            
            // Island shadow in water
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.drawIslandShape(ctx, island, 3, 3);
            
            // Island base
            ctx.fillStyle = '#8fbc8f';
            this.drawIslandShape(ctx, island);
            
            // Island highlight
            ctx.fillStyle = '#a8d5a8';
            this.drawIslandShape(ctx, island, -5, -5, 0.8);
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
    
    drawIslandDepthTransition(ctx, island) {
        // Create smooth depth transition using continuous gradient
        const maxDepthDistance = 180; // Distance where depth effect fades
        
        // Create a single smooth gradient for depth transition
        const depthGradient = ctx.createRadialGradient(
            island.x, island.y, island.radius,
            island.x, island.y, island.radius + maxDepthDistance
        );
        
        // Smooth color transition from turquoise to deep blue
        depthGradient.addColorStop(0, 'rgba(64, 200, 220, 0.12)'); // Light turquoise
        depthGradient.addColorStop(0.3, 'rgba(74, 190, 210, 0.08)'); // Medium turquoise
        depthGradient.addColorStop(0.6, 'rgba(84, 180, 200, 0.05)'); // Dark turquoise
        depthGradient.addColorStop(0.8, 'rgba(89, 170, 190, 0.03)'); // Very dark turquoise
        depthGradient.addColorStop(1, 'rgba(94, 160, 160, 0.01)'); // Deep blue (almost transparent)
        
        ctx.fillStyle = depthGradient;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.radius + maxDepthDistance, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawIslandSeashore(ctx, island) {
        // Draw static sandy seashore around islands (no movable texture)
        const shoreWidth = 18; // Width of sandy shore
        
        // Sandy shore gradient (static, no texture lines)
        const shoreGradient = ctx.createRadialGradient(
            island.x, island.y, island.radius,
            island.x, island.y, island.radius + shoreWidth
        );
        shoreGradient.addColorStop(0, 'rgba(238, 203, 173, 0.7)'); // Sand color
        shoreGradient.addColorStop(0.6, 'rgba(238, 203, 173, 0.3)'); // Fading sand
        shoreGradient.addColorStop(1, 'rgba(238, 203, 173, 0.0)'); // Transparent
        
        ctx.fillStyle = shoreGradient;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.radius + shoreWidth, 0, Math.PI * 2);
        ctx.fill();
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
            let distance;
            
            if (island.points) {
                // Check collision with irregular shape using point-to-polygon distance
                distance = this.getDistanceToPolygon(x, y, island);
            } else {
                // Fallback to circle collision for backward compatibility
                distance = Math.sqrt(
                    Math.pow(x - island.x, 2) + Math.pow(y - island.y, 2)
                );
            }
            
            if (distance < island.radius + radius) {
                return {
                    collision: true,
                    island: island,
                    distance: distance,
                    pushX: (x - island.x) / distance,
                    pushY: (y - island.y) / distance
                };
            }
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
        
        // Normalized depth from 0 to 1
        return Math.max(0, Math.min(1, minDistance / 200));
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
        
        // Display islands
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.islands.forEach(island => {
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Island labels
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.fillText(`R:${island.radius}`, island.x - 20, island.y - island.radius - 10);
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        });
        
        // Display wave info
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`Wave Time: ${this.waveTime.toFixed(2)}`, 10, 20);
        ctx.fillText(`Wave Layers: ${this.waveLayers.length}`, 10, 35);
    }
} 