/**
 * Pirate Game - Multi-Circle Collision Manager
 * Simplified collision detection using multiple circles per island
 */

class CollisionManager {
    constructor(game, map) {
        this.game = game;
        this.map = map;
        this.lastValidPosition = { x: 1000, y: 1000 };
        this.townAreas = new Map();
        
        // Collision settings
        this.collisionBuffer = 10; // Small buffer for smoother collision
        this.shipRadiusMultiplier = 1.0;
        
        // Debug info
        this.lastCollisionInfo = null;
        
        // Initialize town areas
        this.initializeTownAreas();
        
        console.log('🎯 Multi-Circle Collision Manager initialized');
    }
    
    initializeTownAreas() {
        // Define town areas within Saint Kitts Island
        const saintKittsIsland = this.map.islands.find(island => island.name === 'Saint Kitts Island');
        if (saintKittsIsland) {
            this.townAreas.set('saint_kitts_port', {
                id: 'saint_kitts_port',
                name: 'Saint Kitts Port',
                islandId: 'saint_kits',
                x: saintKittsIsland.x + 150,
                y: saintKittsIsland.y - 100,
                radius: 80,
                entryRadius: 120,
                type: 'port',
                services: ['governor', 'market', 'tavern', 'dockmaster', 'bank', 'church'],
                discovered: false
            });
            
            console.log('🏘️ Town area initialized:', this.townAreas.get('saint_kitts_port'));
        }
    }
    
    checkIslandCollision(ship) {
        // Multi-Circle collision detection - simple and efficient
        for (let island of this.map.islands) {
            // Check if island has collision circles
            if (!island.collisionCircles || island.collisionCircles.length === 0) {
                // Fallback to single circle using island radius
                const distance = Math.sqrt(
                    Math.pow(ship.x - island.x, 2) + 
                    Math.pow(ship.y - island.y, 2)
                );
                
                const collisionDistance = island.radius + ship.radius + this.collisionBuffer;
                
                if (distance < collisionDistance) {
                    return {
                        collision: true,
                        island: island,
                        distance: distance,
                        pushX: (ship.x - island.x) / distance,
                        pushY: (ship.y - island.y) / distance
                    };
                }
            } else {
                // Multi-Circle collision check
                for (let circle of island.collisionCircles) {
                    // Calculate world position of this circle
                    const circleWorldX = island.x + circle.x;
                    const circleWorldY = island.y + circle.y;
                    
                    // Distance from ship to this circle
                    const dx = ship.x - circleWorldX;
                    const dy = ship.y - circleWorldY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check collision with buffer
                    const collisionDistance = circle.radius + ship.radius + this.collisionBuffer;
                    
                    if (distance < collisionDistance) {
                        // Calculate push direction
                        const pushX = distance > 0 ? dx / distance : 1;
                        const pushY = distance > 0 ? dy / distance : 0;
                        
                        if (window.DEBUG_MODE) {
                            this.lastCollisionInfo = {
                                shipPos: { x: ship.x, y: ship.y },
                                circlePos: { x: circleWorldX, y: circleWorldY },
                                distance: distance,
                                shipRadius: ship.radius,
                                circleRadius: circle.radius,
                                collisionBuffer: this.collisionBuffer,
                                timestamp: Date.now()
                            };
                            
                            console.log('🚢 Circle collision detected:', this.lastCollisionInfo);
                        }
                        
                        return {
                            collision: true,
                            island: island,
                            circle: circle,
                            distance: distance,
                            pushX: pushX,
                            pushY: pushY,
                            closestPoint: {
                                x: circleWorldX + pushX * circle.radius,
                                y: circleWorldY + pushY * circle.radius
                            }
                        };
                    }
                }
            }
        }
        
        // Clear collision info when not colliding
        if (window.DEBUG_MODE && this.lastCollisionInfo) {
            this.lastCollisionInfo = null;
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
                Math.pow(ship.x - townArea.x, 2) + 
                Math.pow(ship.y - townArea.y, 2)
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
        
        // Use the new PortManager instead of old interface
        if (this.game.gameState === 'playing' && this.game.portManager) {
            this.game.portManager.enterPort(townArea);
            
            // Hide town entry prompt
            this.hideTownEntryPrompt();
        }
    }
    
    exitTown() {
        console.log('🚢 Exiting town');
        
        // Use port manager if available
        if (this.game.portManager) {
            this.game.portManager.exitPort();
            return;
        }
        
        // Legacy fallback
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
    
    // Debug rendering for Multi-Circle collision boundaries and town areas
    drawDebugInfo(ctx) {
        if (!window.DEBUG_MODE) return;
        
        // Draw island collision circles
        this.map.islands.forEach(island => {
            if (island.collisionCircles && island.collisionCircles.length > 0) {
                // Draw each collision circle
                island.collisionCircles.forEach((circle, index) => {
                    const worldX = island.x + circle.x;
                    const worldY = island.y + circle.y;
                    
                    // Draw circle outline
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(worldX, worldY, circle.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Draw circle center
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.beginPath();
                    ctx.arc(worldX, worldY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw circle label
                    ctx.fillStyle = 'white';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`C${index}`, worldX, worldY - circle.radius - 5);
                });
                
                // Draw island name
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(island.name, island.x, island.y - 30);
            } else {
                // Fallback: Draw single circle using island radius
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
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
            ctx.setLineDash([]);
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
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Last Valid', this.lastValidPosition.x, this.lastValidPosition.y - 15);
        
        // Draw collision information
        if (this.lastCollisionInfo) {
            // Draw line from ship to collision circle center
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.lastCollisionInfo.shipPos.x, this.lastCollisionInfo.shipPos.y);
            ctx.lineTo(this.lastCollisionInfo.circlePos.x, this.lastCollisionInfo.circlePos.y);
            ctx.stroke();
            
            // Draw collision info text
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Distance: ${this.lastCollisionInfo.distance.toFixed(1)}`, 10, 30);
            ctx.fillText(`Buffer: ${this.lastCollisionInfo.collisionBuffer}`, 10, 45);
            ctx.fillText(`Ship Radius: ${this.lastCollisionInfo.shipRadius.toFixed(1)}`, 10, 60);
            ctx.fillText(`Circle Radius: ${this.lastCollisionInfo.circleRadius.toFixed(1)}`, 10, 75);
        }
    }
}