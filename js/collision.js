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
        
        // Collision buffer for responsive detection
        const collisionBuffer = 15;
        
        // Check if ship is colliding with the outline
        if (closestDistance < (shipRadius + collisionBuffer)) {
            // Calculate push direction from closest point to ship
            const pushX = (localX - closestPoint.x) / closestDistance;
            const pushY = (localY - closestPoint.y) / closestDistance;
            
            // Debug logging in debug mode
            if (window.DEBUG_MODE) {
                console.log('🚢 Island collision detected:', {
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
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Last Valid', this.lastValidPosition.x, this.lastValidPosition.y - 15);
    }
}