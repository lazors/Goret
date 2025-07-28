/**
 * Pirate Game - Enhanced Collision Manager
 * Handles island collision detection and town entry system
 */

class CollisionManager {
    constructor(game, map) {
        this.game = game;
        this.map = map;
        this.islandCollisionData = new Map();
        this.townAreas = new Map();
        this.lastValidPosition = { x: 1000, y: 1000 }; // Safe starting position
        
        // Collision settings (configurable for testing)
        this.collisionBuffer = 15; // Distance buffer for collision detection
        this.shipRadiusMultiplier = 1.0; // Multiplier for ship collision radius
        
        // Debug info
        this.lastCollisionInfo = null;
        
        // Town area definitions within island boundaries
        this.initializeTownAreas();
        
        console.log('🎯 Enhanced Collision Manager initialized');
    }
    
    initializeTownAreas() {
        // Define town areas within Saint Kits Island
        const saintKitsIsland = this.map.islands.find(island => island.name === 'Saint Kits Island');
        if (saintKitsIsland) {
            // Town area positioned within the island boundaries
            this.townAreas.set('saint_kits_port', {
                id: 'saint_kits_port',
                name: 'Saint Kits Port',
                islandId: 'saint_kits',
                // Position town area within island (offset from island center)
                x: saintKitsIsland.x + 150, // Slightly east of island center
                y: saintKitsIsland.y - 100, // Slightly north of island center
                radius: 80, // Town interaction radius
                entryRadius: 120, // Larger radius for entry detection
                type: 'port',
                services: ['market', 'shipyard', 'tavern', 'quest_giver'],
                discovered: false
            });
            
            console.log('🏘️ Town area initialized:', this.townAreas.get('saint_kits_port'));
        }
    }
    
    checkIslandCollision(ship) {
        // Enhanced island collision with PNG-based detection
        for (let island of this.map.islands) {
            // Quick bounding box check first
            if (island.outline && island.outline.bounds) {
                const bounds = island.outline.bounds;
                const shipLeft = ship.x - ship.radius;
                const shipRight = ship.x + ship.radius;
                const shipTop = ship.y - ship.radius;
                const shipBottom = ship.y + ship.radius;
                
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
            
            // Use outline-based collision detection for PNG accuracy
            if (island.outline && island.outline.points) {
                const collision = this.checkOutlineCollision(ship.x, ship.y, ship.radius, island);
                if (collision.collision) {
                    return collision;
                }
            } else {
                // Fallback to circular collision
                const distance = Math.sqrt(
                    Math.pow(ship.x - island.x, 2) + Math.pow(ship.y - island.y, 2)
                );
                
                const collisionDistance = island.radius + ship.radius;
                
                if (distance < collisionDistance) {
                    return {
                        collision: true,
                        island: island,
                        distance: distance,
                        pushX: (ship.x - island.x) / distance,
                        pushY: (ship.y - island.y) / distance
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
        
        // Check if we have valid outline points
        if (!island.outline || !island.outline.points || island.outline.points.length === 0) {
            console.warn('⚠️ No valid outline points for collision detection');
            return { collision: false };
        }
        
        const points = island.outline.points;
        let minDistance = Infinity;
        let closestPoint = null;
        let closestSegmentIndex = -1;
        
        // Check distance to each line segment of the polygon
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length]; // Next point (wrapping to first)
            
            // Find closest point on this line segment to the ship
            const segmentResult = this.pointToLineSegmentDistance(localX, localY, p1.x, p1.y, p2.x, p2.y);
            
            if (segmentResult.distance < minDistance) {
                minDistance = segmentResult.distance;
                closestPoint = segmentResult.closestPoint;
                closestSegmentIndex = i;
            }
        }
        
        // Collision buffer for responsive detection
        const collisionBuffer = this.collisionBuffer;
        const effectiveShipRadius = shipRadius * this.shipRadiusMultiplier;
        
        // Check if ship is colliding with the outline
        if (minDistance < (effectiveShipRadius + collisionBuffer)) {
            // Calculate push direction from closest point on outline to ship
            const pushLength = Math.sqrt(
                Math.pow(localX - closestPoint.x, 2) + Math.pow(localY - closestPoint.y, 2)
            );
            
            let pushX = 0;
            let pushY = 0;
            
            if (pushLength > 0) {
                pushX = (localX - closestPoint.x) / pushLength;
                pushY = (localY - closestPoint.y) / pushLength;
            } else {
                // If ship is exactly on the line, push perpendicular to the segment
                const p1 = points[closestSegmentIndex];
                const p2 = points[(closestSegmentIndex + 1) % points.length];
                const segmentDx = p2.x - p1.x;
                const segmentDy = p2.y - p1.y;
                const segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
                
                if (segmentLength > 0) {
                    // Calculate perpendicular vector (pointing outward from island)
                    pushX = -segmentDy / segmentLength;
                    pushY = segmentDx / segmentLength;
                    
                    // Ensure push direction points away from island center
                    const centerDx = localX;
                    const centerDy = localY;
                    const dot = pushX * centerDx + pushY * centerDy;
                    if (dot < 0) {
                        pushX = -pushX;
                        pushY = -pushY;
                    }
                }
            }
            
            // Additional check: if ship center is inside polygon, force push outward
            if (this.isPointInPolygon(localX, localY, points)) {
                // Ship is inside the island polygon - force strong outward push
                const centerDx = localX;
                const centerDy = localY;
                const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
                
                if (centerDistance > 0) {
                    pushX = centerDx / centerDistance;
                    pushY = centerDy / centerDistance;
                } else {
                    // Ship is at exact center, push in any direction
                    pushX = 1;
                    pushY = 0;
                }
                
                if (window.DEBUG_MODE) {
                    console.warn('🚨 Ship inside island polygon! Forcing outward push.');
                }
            }
            
            // Debug logging in debug mode
            if (window.DEBUG_MODE) {
                this.lastCollisionInfo = {
                    shipPos: { x: shipX, y: shipY },
                    closestPoint: { x: island.x + closestPoint.x, y: island.y + closestPoint.y },
                    distance: minDistance,
                    shipRadius: effectiveShipRadius,
                    collisionBuffer: collisionBuffer,
                    segmentIndex: closestSegmentIndex,
                    pushDirection: { x: pushX, y: pushY },
                    timestamp: Date.now()
                };
                
                console.log('🚢 Island collision detected:', this.lastCollisionInfo);
            }
            
            return {
                collision: true,
                island: island,
                distance: minDistance,
                pushX: pushX,
                pushY: pushY,
                closestPoint: {
                    x: island.x + closestPoint.x,
                    y: island.y + closestPoint.y
                },
                segmentIndex: closestSegmentIndex
            };
        } else {
            // Clear collision info when not colliding
            if (window.DEBUG_MODE && this.lastCollisionInfo) {
                this.lastCollisionInfo = null;
            }
        }
        
        return { collision: false };
    }
    
    // Helper function to check if a point is inside a polygon using ray casting
    isPointInPolygon(x, y, polygon) {
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    // Helper function to calculate distance from point to line segment
    pointToLineSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            // Line segment is actually a point
            const distance = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
            return {
                distance: distance,
                closestPoint: { x: x1, y: y1 }
            };
        }
        
        // Calculate parameter t for the closest point on the line
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
        
        // Calculate the closest point on the line segment
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        // Calculate distance from point to closest point on segment
        const distance = Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
        
        return {
            distance: distance,
            closestPoint: { x: closestX, y: closestY },
            t: t
        };
    }
    
    revertShipPosition(ship) {
        // Revert ship to last valid position when collision occurs
        if (window.DEBUG_MODE) {
            console.log('🔄 Reverting ship position from', { x: ship.x, y: ship.y }, 'to', this.lastValidPosition);
        }
        
        ship.x = this.lastValidPosition.x;
        ship.y = this.lastValidPosition.y;
        
        // Reduce speed significantly on collision
        ship.currentSpeed *= 0.2;
        
        // Add visual feedback for collision
        this.showCollisionEffect(ship);
    }
    
    updateLastValidPosition(ship) {
        // Only update if ship is not colliding with anything
        const collision = this.checkIslandCollision(ship);
        if (!collision.collision) {
            this.lastValidPosition.x = ship.x;
            this.lastValidPosition.y = ship.y;
        }
    }
    
    checkTownAreaEntry(ship) {
        // Check if ship enters any town areas
        for (let [townId, townArea] of this.townAreas) {
            const distance = Math.sqrt(
                Math.pow(ship.x - townArea.x, 2) + Math.pow(ship.y - townArea.y, 2)
            );
            
            // Check if ship is within town entry radius
            if (distance <= townArea.entryRadius) {
                // Mark town as discovered
                if (!townArea.discovered) {
                    townArea.discovered = true;
                    this.showTownDiscoveryMessage(townArea);
                }
                
                // Check if ship is close enough to enter town
                if (distance <= townArea.radius) {
                    return {
                        canEnter: true,
                        townArea: townArea,
                        distance: distance
                    };
                } else {
                    return {
                        canEnter: false,
                        townArea: townArea,
                        distance: distance,
                        approaching: true
                    };
                }
            }
        }
        
        return { canEnter: false };
    }
    
    showCollisionEffect(ship) {
        // Visual feedback for collision (simple screen shake effect)
        if (this.game.canvas) {
            const originalTransform = this.game.ctx.getTransform();
            
            // Small shake effect
            setTimeout(() => {
                if (this.game.ctx) {
                    this.game.ctx.setTransform(originalTransform);
                }
            }, 100);
        }
    }
    
    showTownDiscoveryMessage(townArea) {
        console.log('🏘️ Town discovered:', townArea.name);
        
        // Show discovery message in UI (if available)
        if (window.DEBUG_MODE) {
            console.log('🎉 You discovered:', townArea.name);
        }
    }
    
    showTownEntryPrompt(townArea) {
        // Show town entry prompt in UI
        console.log('🚪 Press ENTER to enter', townArea.name);
        
        // Create or update town entry UI element
        this.updateTownEntryUI(townArea, true);
    }
    
    hideTownEntryPrompt() {
        // Hide town entry prompt
        this.updateTownEntryUI(null, false);
    }
    
    updateTownEntryUI(townArea, show) {
        // Update town entry UI element
        let entryPrompt = document.getElementById('townEntryPrompt');
        
        if (show && townArea) {
            if (!entryPrompt) {
                entryPrompt = document.createElement('div');
                entryPrompt.id = 'townEntryPrompt';
                entryPrompt.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    font-family: Arial, sans-serif;
                    font-size: 18px;
                    z-index: 1000;
                    border: 2px solid #ffd700;
                `;
                document.body.appendChild(entryPrompt);
            }
            
            entryPrompt.innerHTML = `
                <h3>🏘️ ${townArea.name}</h3>
                <p>Press <strong>ENTER</strong> to enter town</p>
                <p><small>Services: ${townArea.services.join(', ')}</small></p>
            `;
            entryPrompt.style.display = 'block';
        } else if (entryPrompt) {
            entryPrompt.style.display = 'none';
        }
    }
    
    enterTown(townArea) {
        console.log('🏘️ Entering town:', townArea.name);
        
        // Trigger town mode transition
        if (this.game.gameState === 'playing') {
            this.game.gameState = 'town';
            this.game.currentTown = townArea;
            
            // Show town interface
            this.showTownInterface(townArea);
            
            // Hide town entry prompt
            this.hideTownEntryPrompt();
        }
    }
    
    showTownInterface(townArea) {
        // Create town interface overlay
        let townInterface = document.getElementById('townInterface');
        
        if (!townInterface) {
            townInterface = document.createElement('div');
            townInterface.id = 'townInterface';
            townInterface.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                z-index: 2000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(townInterface);
        }
        
        townInterface.innerHTML = `
            <div style="text-align: center; max-width: 600px;">
                <h1>🏘️ Welcome to ${townArea.name}</h1>
                <p>A bustling port town with various services for weary sailors.</p>
                
                <div style="margin: 30px 0;">
                    <h3>Available Services:</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
                        ${townArea.services.map(service => `
                            <button style="
                                padding: 15px;
                                background: #2c3e50;
                                color: white;
                                border: 2px solid #3498db;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 16px;
                            " onclick="alert('${service} - Coming soon!')">
                                ${this.getServiceIcon(service)} ${this.getServiceName(service)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <button onclick="game.collisionManager.exitTown()" style="
                    padding: 15px 30px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 18px;
                    margin-top: 20px;
                ">
                    🚢 Return to Ship
                </button>
            </div>
        `;
        
        townInterface.style.display = 'flex';
    }
    
    getServiceIcon(service) {
        const icons = {
            'market': '🏪',
            'shipyard': '⚓',
            'tavern': '🍺',
            'quest_giver': '📜'
        };
        return icons[service] || '🏢';
    }
    
    getServiceName(service) {
        const names = {
            'market': 'Market',
            'shipyard': 'Shipyard',
            'tavern': 'Tavern',
            'quest_giver': 'Quest Giver'
        };
        return names[service] || service;
    }
    
    exitTown() {
        console.log('🚢 Exiting town, returning to sailing');
        
        // Return to sailing mode
        this.game.gameState = 'playing';
        this.game.currentTown = null;
        
        // Hide town interface
        const townInterface = document.getElementById('townInterface');
        if (townInterface) {
            townInterface.style.display = 'none';
        }
        
        // Hide any remaining prompts
        this.hideTownEntryPrompt();
    }
    
    // Debug rendering for collision boundaries and town areas
    drawDebugInfo(ctx) {
        if (!window.DEBUG_MODE) return;
        
        // Draw island collision outlines with line segments
        this.map.islands.forEach((island, index) => {
            if (island.outline && island.outline.points) {
                const points = island.outline.points;
                
                // Draw collision outline (red line)
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.beginPath();
                
                points.forEach((point, i) => {
                    const worldX = island.x + point.x;
                    const worldY = island.y + point.y;
                    
                    if (i === 0) {
                        ctx.moveTo(worldX, worldY);
                    } else {
                        ctx.lineTo(worldX, worldY);
                    }
                });
                
                // Close the polygon
                if (points.length > 0) {
                    const firstPoint = points[0];
                    ctx.lineTo(island.x + firstPoint.x, island.y + firstPoint.y);
                }
                
                ctx.stroke();
                
                // Draw collision points (small red circles)
                points.forEach((point, i) => {
                    const worldX = island.x + point.x;
                    const worldY = island.y + point.y;
                    
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                    ctx.beginPath();
                    ctx.arc(worldX, worldY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw point index
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(i.toString(), worldX, worldY + 3);
                });
                
                // Draw collision buffer zone (lighter red)
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                
                // Draw buffer around each line segment
                points.forEach((point, i) => {
                    const nextPoint = points[(i + 1) % points.length];
                    const worldX1 = island.x + point.x;
                    const worldY1 = island.y + point.y;
                    const worldX2 = island.x + nextPoint.x;
                    const worldY2 = island.y + nextPoint.y;
                    
                    // Calculate perpendicular offset for buffer visualization
                    const dx = worldX2 - worldX1;
                    const dy = worldY2 - worldY1;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    if (length > 0) {
                        const bufferSize = 50; // Ship radius + collision buffer
                        const perpX = -dy / length * bufferSize;
                        const perpY = dx / length * bufferSize;
                        
                        // Draw buffer lines
                        ctx.moveTo(worldX1 + perpX, worldY1 + perpY);
                        ctx.lineTo(worldX2 + perpX, worldY2 + perpY);
                    }
                });
                
                ctx.stroke();
            }
        });
        
        // Draw ship collision radius
        if (this.game.ship) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.game.ship.x, this.game.ship.y, this.game.ship.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw town areas
        for (let [townId, townArea] of this.townAreas) {
            // Draw town entry radius (yellow circle)
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(townArea.x, townArea.y, townArea.entryRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw town interaction radius (green circle)
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(townArea.x, townArea.y, townArea.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw town center point
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(townArea.x, townArea.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw town label
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(townArea.name, townArea.x, townArea.y - townArea.entryRadius - 10);
            ctx.fillText(`Services: ${townArea.services.length}`, townArea.x, townArea.y - townArea.entryRadius + 5);
        }
        
        // Draw last valid position
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.lastValidPosition.x, this.lastValidPosition.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw collision information
        if (this.lastCollisionInfo) {
            // Draw line from ship to closest collision point
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(this.lastCollisionInfo.shipPos.x, this.lastCollisionInfo.shipPos.y);
            ctx.lineTo(this.lastCollisionInfo.closestPoint.x, this.lastCollisionInfo.closestPoint.y);
            ctx.stroke();
            
            // Draw collision point
            ctx.fillStyle = 'rgba(255, 100, 100, 1.0)';
            ctx.beginPath();
            ctx.arc(this.lastCollisionInfo.closestPoint.x, this.lastCollisionInfo.closestPoint.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw collision info text
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Distance: ${this.lastCollisionInfo.distance.toFixed(1)}`, 10, 30);
            ctx.fillText(`Buffer: ${this.lastCollisionInfo.collisionBuffer}`, 10, 45);
            ctx.fillText(`Ship Radius: ${this.lastCollisionInfo.shipRadius.toFixed(1)}`, 10, 60);
            ctx.fillText(`Segment: ${this.lastCollisionInfo.segmentIndex}`, 10, 75);
        }
        
        // Reset line dash
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Last Valid', this.lastValidPosition.x, this.lastValidPosition.y - 15);
    }
}