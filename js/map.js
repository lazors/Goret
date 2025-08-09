/**
 * Pirate Game - Map Module
 * Loading and rendering map with realistic animated waves
 * Using Multi-Circle collision system
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
        
        // Islands with Multi-Circle collision system
        this.islands = [];
        
        // Initialize islands with positions
        this.initializeIslands();
        
        console.log('🗺️ Map initialized with Multi-Circle collision system');
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
        // Load islands from map editor data if available, otherwise use defaults
        if (typeof ISLANDS_DATA !== 'undefined' && Array.isArray(ISLANDS_DATA)) {
            console.log('🏝️ Loading islands from map editor data...');
            this.islands = this.convertMapEditorData(ISLANDS_DATA);
        } else {
            console.log('🏝️ Using default island data...');
            // Fallback to default islands with Multi-Circle collision system
            this.islands = [
                {
                    x: 2000,
                    y: 1500,
                    radius: 600,
                    name: 'Saint Kitts Island',
                    image: this.assets.island,
                    collisionCircles: [
                        { x: 0, y: 0, radius: 280 },
                        { x: -160, y: -155, radius: 120 },
                        { x: 140, y: 145, radius: 100 },
                        { x: -50, y: 100, radius: 80 }
                    ]
                },
                {
                    x: 4500,
                    y: 3000,
                    radius: 400,
                    name: 'Nevis Island',
                    image: this.assets.island2 || this.assets.island,
                    collisionCircles: [
                        { x: 0, y: 0, radius: 180 },
                        { x: -80, y: -60, radius: 80 },
                        { x: 70, y: 50, radius: 60 }
                    ]
                }
            ];
        }
        
        console.log('🏝️ Islands initialized with Multi-Circle collision system');
        this.islands.forEach(island => {
            console.log(`  - ${island.name}: ${island.collisionCircles ? island.collisionCircles.length : 0} collision circles`);
        });
    }
    
    convertMapEditorData(mapEditorIslands) {
        // Convert map editor island format to game format
        return mapEditorIslands.map(island => {
            const gameIsland = {
                x: island.x,
                y: island.y,
                radius: island.radius || 400,
                name: island.name,
                image: this.assets.island, // Default image for now
                collisionCircles: []
            };
            
            // Convert collision data to Multi-Circle format
            if (island.collisionCircles && island.collisionCircles.length > 0) {
                // Already in Multi-Circle format
                gameIsland.collisionCircles = island.collisionCircles;
            } else if (island.collision && island.collision.length > 0) {
                // Convert old polygon format to Multi-Circle
                console.log(`Converting polygon collision to Multi-Circle for ${island.name}...`);
                gameIsland.collisionCircles = this.convertPolygonToCircles(island.collision, island);
            } else {
                // Create default single circle
                gameIsland.collisionCircles = [{ x: 0, y: 0, radius: gameIsland.radius * 0.7 }];
            }
            
            console.log(`🔄 Converted ${island.name}: ${gameIsland.collisionCircles.length} collision circles`);
            return gameIsland;
        });
    }
    
    convertPolygonToCircles(polygon, island) {
        // Convert polygon points to Multi-Circle collision
        // This is a simplified conversion - place circles to cover key areas
        
        if (!polygon || polygon.length === 0) {
            return [{ x: 0, y: 0, radius: island.radius * 0.7 }];
        }
        
        // Find polygon bounds relative to island center
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        polygon.forEach(point => {
            const relX = point.x - island.x;
            const relY = point.y - island.y;
            minX = Math.min(minX, relX);
            maxX = Math.max(maxX, relX);
            minY = Math.min(minY, relY);
            maxY = Math.max(maxY, relY);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Generate 3-5 circles based on island shape
        const circles = [];
        
        // Main central circle
        const mainRadius = Math.min(width, height) * 0.3;
        circles.push({ x: centerX, y: centerY, radius: mainRadius });
        
        // Add additional circles for wider areas
        if (width > height * 1.5) {
            // Wide island - add horizontal circles
            circles.push({ x: minX + width * 0.25, y: centerY, radius: mainRadius * 0.8 });
            circles.push({ x: maxX - width * 0.25, y: centerY, radius: mainRadius * 0.8 });
        } else if (height > width * 1.5) {
            // Tall island - add vertical circles
            circles.push({ x: centerX, y: minY + height * 0.25, radius: mainRadius * 0.8 });
            circles.push({ x: centerX, y: maxY - height * 0.25, radius: mainRadius * 0.8 });
        } else {
            // Roughly square - add corner circles
            circles.push({ x: minX + width * 0.3, y: minY + height * 0.3, radius: mainRadius * 0.7 });
            circles.push({ x: maxX - width * 0.3, y: maxY - height * 0.3, radius: mainRadius * 0.7 });
        }
        
        return circles;
    }
    
    update(deltaTime) {
        // Update wave animation time
        this.waveTime += deltaTime * this.waveSpeed;
    }
    
    render(ctx, deltaTime, cameraX, cameraY, zoom, ship) {
        // Set ocean background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a4f7a');
        gradient.addColorStop(0.5, '#0d5e8f');
        gradient.addColorStop(1, '#0f6ba5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render animated wave layers
        this.renderWaveLayers(ctx);
        
        // Render islands
        this.renderIslands(ctx);
    }
    
    renderWaveLayers(ctx) {
        // Calculate visible area for optimization
        const visibleBounds = {
            left: -100,
            top: -100,
            right: this.canvas.width / ctx.getTransform().a + 100,
            bottom: this.canvas.height / ctx.getTransform().d + 100
        };
        
        // Render each wave layer with realistic animation
        this.waveLayers.forEach((layer, layerIndex) => {
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Calculate wave spacing based on frequency
            const spacing = 1 / layer.frequency;
            
            // Render wave lines based on type
            if (layer.type === 'swell') {
                // Large ocean swells
                this.renderSwells(ctx, layer, spacing, visibleBounds);
            } else if (layer.type === 'wave') {
                // Medium waves
                this.renderWaves(ctx, layer, spacing, visibleBounds);
            } else if (layer.type === 'ripple') {
                // Small surface ripples
                this.renderRipples(ctx, layer, spacing, visibleBounds);
            }
        });
    }
    
    renderSwells(ctx, layer, spacing, bounds) {
        // Render large rolling ocean swells
        const startX = Math.floor(bounds.left / spacing) * spacing;
        const endX = Math.ceil(bounds.right / spacing) * spacing;
        
        for (let x = startX; x <= endX; x += spacing * 50) {
            ctx.beginPath();
            
            let firstPoint = true;
            for (let y = bounds.top; y <= bounds.bottom; y += 20) {
                // Calculate wave displacement
                const waveX = x + Math.sin(y * layer.frequency + this.waveTime * layer.speed) * layer.amplitude;
                const waveY = y + Math.cos(x * layer.frequency * 0.5 + this.waveTime * layer.speed * 0.7) * layer.amplitude * 0.5;
                
                if (firstPoint) {
                    ctx.moveTo(waveX, waveY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(waveX, waveY);
                }
            }
            
            ctx.stroke();
        }
    }
    
    renderWaves(ctx, layer, spacing, bounds) {
        // Render medium wave patterns
        const startY = Math.floor(bounds.top / spacing) * spacing;
        const endY = Math.ceil(bounds.bottom / spacing) * spacing;
        
        for (let y = startY; y <= endY; y += spacing * 30) {
            ctx.beginPath();
            
            let firstPoint = true;
            for (let x = bounds.left; x <= bounds.right; x += 15) {
                // Calculate wave displacement with directional movement
                const waveX = x + Math.sin((x + y) * layer.frequency + this.waveTime * layer.speed * layer.direction.x) * layer.amplitude;
                const waveY = y + Math.cos((x - y) * layer.frequency + this.waveTime * layer.speed * layer.direction.y) * layer.amplitude;
                
                if (firstPoint) {
                    ctx.moveTo(waveX, waveY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(waveX, waveY);
                }
            }
            
            ctx.stroke();
        }
    }
    
    renderRipples(ctx, layer, spacing, bounds) {
        // Render small surface ripples
        const rippleSpacing = spacing * 20;
        const startX = Math.floor(bounds.left / rippleSpacing) * rippleSpacing;
        const endX = Math.ceil(bounds.right / rippleSpacing) * rippleSpacing;
        const startY = Math.floor(bounds.top / rippleSpacing) * rippleSpacing;
        const endY = Math.ceil(bounds.bottom / rippleSpacing) * rippleSpacing;
        
        ctx.globalAlpha = 0.3;
        
        for (let x = startX; x <= endX; x += rippleSpacing) {
            for (let y = startY; y <= endY; y += rippleSpacing) {
                // Calculate ripple center with wave-based movement
                const rippleX = x + Math.sin(this.waveTime * layer.speed + x * 0.01) * layer.amplitude;
                const rippleY = y + Math.cos(this.waveTime * layer.speed * 0.8 + y * 0.01) * layer.amplitude;
                
                // Draw small circular ripple
                const rippleRadius = layer.amplitude + Math.sin(this.waveTime * layer.speed * 2) * 2;
                
                ctx.beginPath();
                ctx.arc(rippleX, rippleY, rippleRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1;
    }
    
    renderIslands(ctx) {
        // Render islands with their images
        this.islands.forEach(island => {
            if (island.image) {
                ctx.save();
                ctx.translate(island.x, island.y);
                
                // Draw island image centered
                const size = island.radius * 2;
                ctx.drawImage(island.image, -size/2, -size/2, size, size);
                
                ctx.restore();
            } else {
                // Fallback: Draw placeholder circle
                ctx.fillStyle = 'rgba(139, 90, 43, 0.8)';
                ctx.beginPath();
                ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(101, 67, 33, 0.9)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Draw island name
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(island.name, island.x, island.y - island.radius - 30);
            ctx.fillText(island.name, island.x, island.y - island.radius - 30);
        });
    }
    
    // Methods for collisions and boundary checking
    checkBounds(x, y, radius = 32) {
        return {
            hitLeft: x - radius <= this.bounds.left,
            hitRight: x + radius >= this.bounds.right,
            hitTop: y - radius <= this.bounds.top,
            hitBottom: y + radius >= this.bounds.bottom,
            
            // Push-back values to keep ship in bounds
            pushX: x - radius < this.bounds.left ? this.bounds.left + radius - x : 
                   x + radius > this.bounds.right ? this.bounds.right - radius - x : 0,
            pushY: y - radius < this.bounds.top ? this.bounds.top + radius - y :
                   y + radius > this.bounds.bottom ? this.bounds.bottom - radius - y : 0
        };
    }
    
    getConstrainedPosition(x, y, radius = 32) {
        // Constrain position to map boundaries
        let constrainedX = x;
        let constrainedY = y;
        
        // Check and constrain X coordinate
        if (x - radius < this.bounds.left) {
            constrainedX = this.bounds.left + radius;
        } else if (x + radius > this.bounds.right) {
            constrainedX = this.bounds.right - radius;
        }
        
        // Check and constrain Y coordinate
        if (y - radius < this.bounds.top) {
            constrainedY = this.bounds.top + radius;
        } else if (y + radius > this.bounds.bottom) {
            constrainedY = this.bounds.bottom - radius;
        }
        
        return {
            x: constrainedX,
            y: constrainedY
        };
    }
    
    // Multi-Circle collision check (simplified)
    checkIslandCollision(x, y, radius = 32) {
        // This is now handled by CollisionManager with Multi-Circle system
        // Keeping this method for compatibility
        return { collision: false };
    }
    
    // Debug method to display collision circles
    renderDebugInfo(ctx) {
        // Set up debug rendering
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Draw world bounds
        ctx.strokeRect(this.bounds.left, this.bounds.top, 
                       this.bounds.right - this.bounds.left,
                       this.bounds.bottom - this.bounds.top);
        
        // Display Multi-Circle collision boundaries
        this.islands.forEach(island => {
            if (island.collisionCircles && island.collisionCircles.length > 0) {
                // Draw each collision circle
                island.collisionCircles.forEach((circle, index) => {
                    const worldX = island.x + circle.x;
                    const worldY = island.y + circle.y;
                    
                    // Draw circle outline (different colors for each)
                    const colors = ['rgba(255, 0, 0, 0.6)', 'rgba(0, 255, 0, 0.6)', 
                                    'rgba(0, 0, 255, 0.6)', 'rgba(255, 255, 0, 0.6)',
                                    'rgba(255, 0, 255, 0.6)'];
                    ctx.strokeStyle = colors[index % colors.length];
                    ctx.lineWidth = 2;
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(worldX, worldY, circle.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Draw circle center
                    ctx.fillStyle = colors[index % colors.length];
                    ctx.beginPath();
                    ctx.arc(worldX, worldY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw circle label
                    ctx.fillStyle = 'white';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`C${index} (r:${circle.radius})`, worldX, worldY - circle.radius - 5);
                });
            } else {
                // Fallback: Draw single circle
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Draw island info
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Circles: ${island.collisionCircles ? island.collisionCircles.length : 1}`, 
                        island.x, island.y + island.radius + 20);
        });
        
        // Reset line dash
        ctx.setLineDash([]);
        
        // Display map info
        ctx.fillStyle = 'yellow';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`World: ${this.width} x ${this.height}`, 10, 20);
        ctx.fillText(`Wave Layers: ${this.waveLayers.length}`, 10, 35);
        
        // Display collision system info
        ctx.fillText(`Collision System: Multi-Circle`, 10, 50);
        ctx.fillText(`Total Islands: ${this.islands.length}`, 10, 65);
        ctx.fillText(`Collision Circles: ${this.islands.reduce((sum, i) => sum + (i.collisionCircles?.length || 1), 0)}`, 10, 80);
    }
}