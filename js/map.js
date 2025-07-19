/**
 * Pirate Game - Map Module
 * Loading and rendering map with animated waves
 */

class GameMap {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;
        
        // Map dimensions
        this.width = 1024;
        this.height = 768;
        
        // Wave animation
        this.waveOffset = 0;
        this.waveSpeed = 20; // pixels per second
        this.tileSize = 128; // wave tile size
        
        // Map boundaries for collisions
        this.bounds = {
            left: 0,
            top: 0,
            right: this.width,
            bottom: this.height
        };
        
        // Islands and obstacles
        this.islands = [
            { x: 200, y: 150, radius: 80 },
            { x: 700, y: 300, radius: 100 },
            { x: 400, y: 500, radius: 60 },
            { x: 800, y: 600, radius: 90 }
        ];
        
        console.log('🗺️ Map initialized');
    }
    
    update(deltaTime) {
        // Update wave animation
        this.waveOffset += this.waveSpeed * deltaTime;
        
        // Reset offset to avoid overflow
        if (this.waveOffset >= this.tileSize) {
            this.waveOffset -= this.tileSize;
        }
    }
    
    draw(ctx) {
        // Render base map
        this.drawBaseMap(ctx);
        
        // Render animated waves
        this.drawAnimatedWaves(ctx);
        
        // Render islands over waves
        this.drawIslandsOverlay(ctx);
    }
    
    drawBaseMap(ctx) {
        // Draw main map background
        if (this.assets.map) {
            ctx.drawImage(this.assets.map, 0, 0);
        } else {
            // Fallback - gradient
            const gradient = ctx.createRadialGradient(512, 384, 100, 512, 384, 400);
            gradient.addColorStop(0, '#2980b9');
            gradient.addColorStop(0.5, '#3498db');
            gradient.addColorStop(1, '#1e3a5f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    drawAnimatedWaves(ctx) {
        if (!this.assets.wave) return;
        
        // Set transparency for waves
        ctx.globalAlpha = 0.6;
        
        // Calculate number of tiles
        const tilesX = Math.ceil(this.width / this.tileSize) + 1;
        const tilesY = Math.ceil(this.height / this.tileSize) + 1;
        
        // Render wave tiles with animation
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const drawX = (x * this.tileSize) - this.waveOffset;
                const drawY = (y * this.tileSize) - (this.waveOffset * 0.5); // Different speed on Y
                
                ctx.drawImage(this.assets.wave, drawX, drawY);
            }
        }
        
        // Additional wave layer in opposite direction
        ctx.globalAlpha = 0.3;
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const drawX = (x * this.tileSize) + (this.waveOffset * 0.7); // Movement in opposite direction
                const drawY = (y * this.tileSize) - (this.waveOffset * 0.3);
                
                ctx.drawImage(this.assets.wave, drawX, drawY);
            }
        }
        
        // Restore normal transparency
        ctx.globalAlpha = 1.0;
    }
    
    drawIslandsOverlay(ctx) {
        // Additional island details over waves
        ctx.fillStyle = 'rgba(139, 188, 143, 0.3)'; // Semi-transparent green
        
        this.islands.forEach(island => {
            // Add semi-transparent effect around islands
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.radius + 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Add waves around islands
            this.drawIslandWakes(ctx, island);
        });
    }
    
    drawIslandWakes(ctx, island) {
        // Render wave trails around islands
        const time = Date.now() * 0.001; // Time for animation
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const radius = island.radius + 15 + (i * 8) + Math.sin(time + i) * 3;
            ctx.setLineDash([10, 10]);
            ctx.lineDashOffset = -time * 20 + (i * 10);
            
            ctx.beginPath();
            ctx.arc(island.x, island.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset dashes
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
            const distance = Math.sqrt(
                Math.pow(x - island.x, 2) + Math.pow(y - island.y, 2)
            );
            
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
        const time = Date.now() * 0.0005;
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
    }
} 