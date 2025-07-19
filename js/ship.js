/**
 * Pirate Game - Ship Class
 * Movement control, inertia, turns and collisions
 */

class Ship {
    constructor(x, y, sprite) {
        // Position
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        
        // Movement physics
        this.angle = 0; // angle in radians
        this.currentSpeed = 0;
        this.maxSpeed = 200; // pixels per second
        this.acceleration = 150; // acceleration
        this.deceleration = 100; // deceleration
        this.turnSpeed = 3; // turn speed (radians per second)
        
        // Visualization
        this.sprite = sprite;
        this.width = 60;
        this.height = 40;
        this.radius = 35; // for collisions
        
        // Effects
        this.wakeTrail = []; // ship wake
        this.maxTrailLength = 10;
        this.bowWaveTrail = []; // V-shaped bow wave trail
        this.maxBowTrailLength = 15;
        
        // V-SHAPE TRAIL SETTINGS - EASILY ADJUSTABLE
        this.vTrailBaseLength = 10; // Base length of V-trails in pixels
        this.vTrailLengthGrowth = 5; // How much longer each segment gets
        this.vTrailSpread = 0.2; // V-shape spread (0.2 = narrow, 0.4 = wide)
        this.vTrailOpacity = 0.4; // V-trail opacity (0.0 = invisible, 1.0 = opaque)
        this.vTrailThickness = 2; // V-trail line thickness
        
        // SMOOTH TURNING SETTINGS
        this.trailSmoothingFactor = 0.15; // How quickly trails adapt to new angles (0.1 = slow, 0.3 = fast)
        this.maxTrailAngleChange = Math.PI / 4; // Maximum angle change per frame (prevents snapping)
        this.previousShipAngle = this.angle - Math.PI/2; // Track previous angle for smoothing
        
        // Ship state
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        
        console.log('🚢 Ship created at position:', x, y);
    }
    
    update(deltaTime, keys, map) {
        // Save previous position
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Input processing
        this.handleInput(keys);
        
        // Update rotation angle
        this.updateRotation(deltaTime);
        
        // Update speed
        this.updateSpeed(deltaTime);
        
        // Update position
        this.updatePosition(deltaTime);
        
        // Check map collisions
        this.handleMapConstraints(map);
        
        // Update wake trail
        this.updateWakeTrail();
    }
    
    handleInput(keys) {
        // Reset state
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        
        // Process forward/backward movement
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.isMovingForward = true;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.isMovingBackward = true;
        }
        
        // Process turns
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.isTurningLeft = true;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.isTurningRight = true;
        }
    }
    
    updateRotation(deltaTime) {
        if (this.isTurningLeft) {
            this.angle -= this.turnSpeed * deltaTime;
        }
        if (this.isTurningRight) {
            this.angle += this.turnSpeed * deltaTime;
        }
        
        // Normalize angle
        if (this.angle < 0) this.angle += Math.PI * 2;
        if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
    }
    
    updateSpeed(deltaTime) {
        let targetSpeed = 0;
        
        if (this.isMovingForward) {
            targetSpeed = this.maxSpeed;
        } else if (this.isMovingBackward) {
            targetSpeed = -this.maxSpeed * 0.5; // slower backward
        }
        
        // Smooth speed change (inertia)
        if (targetSpeed > this.currentSpeed) {
            this.currentSpeed += this.acceleration * deltaTime;
            if (this.currentSpeed > targetSpeed) {
                this.currentSpeed = targetSpeed;
            }
        } else if (targetSpeed < this.currentSpeed) {
            this.currentSpeed -= this.deceleration * deltaTime;
            if (this.currentSpeed < targetSpeed) {
                this.currentSpeed = targetSpeed;
            }
        } else {
            // Natural deceleration
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.deceleration * deltaTime;
                if (this.currentSpeed < 0) this.currentSpeed = 0;
            } else if (this.currentSpeed < 0) {
                this.currentSpeed += this.deceleration * deltaTime;
                if (this.currentSpeed > 0) this.currentSpeed = 0;
            }
        }
    }
    
    updatePosition(deltaTime) {
        // Calculate new position based on angle and speed
        // Adjust for ship image orientation (bow points right in image, but we want it to point up)
        const deltaX = Math.cos(this.angle - Math.PI/2) * this.currentSpeed * deltaTime;
        const deltaY = Math.sin(this.angle - Math.PI/2) * this.currentSpeed * deltaTime;
        
        this.x += deltaX;
        this.y += deltaY;
    }
    
    handleMapConstraints(map) {
        if (!map) return;
        
        // Check map boundaries
        const constrainedPos = map.getConstrainedPosition(this.x, this.y, this.radius);
        
        if (constrainedPos.x !== this.x || constrainedPos.y !== this.y) {
            // Ship reached map edge
            this.x = constrainedPos.x;
            this.y = constrainedPos.y;
            this.currentSpeed *= 0.5; // reduce speed on edge collision
        }
        
        // Check island collisions
        const islandCollision = map.checkIslandCollision(this.x, this.y, this.radius);
        if (islandCollision.collision) {
            // Push away from island
            const pushForce = 50;
            this.x += islandCollision.pushX * pushForce * 0.016; // 0.016 ≈ deltaTime
            this.y += islandCollision.pushY * pushForce * 0.016;
            
            // Reduce speed on collision
            this.currentSpeed *= 0.3;
            
            // Constrain position within map after push
            const newConstrainedPos = map.getConstrainedPosition(this.x, this.y, this.radius);
            this.x = newConstrainedPos.x;
            this.y = newConstrainedPos.y;
        }
    }
    
    updateWakeTrail() {
        // Add new wake point if ship is moving
        if (Math.abs(this.currentSpeed) > 10) {
            // Calculate ship stern position (back of ship)
            const sternX = this.x - Math.cos(this.angle - Math.PI/2) * 25;
            const sternY = this.y - Math.sin(this.angle - Math.PI/2) * 25;
            
            this.wakeTrail.push({
                x: sternX,
                y: sternY,
                age: 0,
                opacity: 1.0
            });
            
            // ===== SMOOTH V-SHAPED TRAIL POSITIONING CODE =====
            // This section controls WHERE the V-trails originate from on the ship
            
            // SMOOTH ANGLE INTERPOLATION FOR TURNS
            const currentShipAngle = this.angle - Math.PI/2;
            
            // Calculate angle difference for smooth interpolation
            let angleDiff = currentShipAngle - this.previousShipAngle;
            
            // Handle angle wrapping (when crossing 0/2π boundary)
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Limit maximum angle change per frame to prevent snapping
            if (Math.abs(angleDiff) > this.maxTrailAngleChange) {
                angleDiff = Math.sign(angleDiff) * this.maxTrailAngleChange;
            }
            
            // Smoothly interpolate the angle
            const smoothedAngle = this.previousShipAngle + (angleDiff * this.trailSmoothingFactor);
            this.previousShipAngle = smoothedAngle;
            
            // Add bow wave trail points from ship MID-SECTION sides
            const shipAngle = smoothedAngle; // Use smoothed angle for trail positioning
            const edgeOffset = this.width / 3; // Distance from ship center to edge
            
            // Position trails from ship MID-SECTION (widest point) - SHIFTED UPWARD
            const sideOffset = -this.height / 2; // Negative value = above the ship
            // To adjust V-trail position: 
            // - Use 0 for center of ship
            // - Use positive values to move trails forward
            // - Use negative values to move trails backward
            
            // Port side (left edge) - positioned at ship's mid-section, shifted up
            const portX = this.x + Math.cos(shipAngle + Math.PI/2) * edgeOffset + Math.cos(shipAngle) * sideOffset;
            const portY = this.y + Math.sin(shipAngle + Math.PI/2) * edgeOffset + Math.sin(shipAngle) * sideOffset;
            
            // Starboard side (right edge) - positioned at ship's mid-section, shifted up
            const starboardX = this.x + Math.cos(shipAngle - Math.PI/2) * edgeOffset + Math.cos(shipAngle) * sideOffset;
            const starboardY = this.y + Math.sin(shipAngle - Math.PI/2) * edgeOffset + Math.sin(shipAngle) * sideOffset;
            
            // Add bow wave trail points with smoothed angle
            this.bowWaveTrail.push({
                portX: portX,
                portY: portY,
                starboardX: starboardX,
                starboardY: starboardY,
                age: 0,
                opacity: 1.0,
                shipAngle: smoothedAngle // Store the smoothed angle for drawing
            });
        }
        
        // Update and remove old wake points
        this.wakeTrail = this.wakeTrail.filter(point => {
            point.age += 0.016; // approximate deltaTime
            point.opacity = Math.max(0, 1.0 - (point.age / 3)); // fade over 3 seconds
            return point.age < 3;
        });
        
        // Update and remove old bow wave trail points
        this.bowWaveTrail = this.bowWaveTrail.filter(point => {
            point.age += 0.016; // approximate deltaTime
            point.opacity = Math.max(0, 1.0 - (point.age / 2)); // fade over 2 seconds
            return point.age < 2;
        });
        
        // Limit wake length
        if (this.wakeTrail.length > this.maxTrailLength) {
            this.wakeTrail = this.wakeTrail.slice(-this.maxTrailLength);
        }
        
        // Limit bow wave trail length
        if (this.bowWaveTrail.length > this.maxBowTrailLength) {
            this.bowWaveTrail = this.bowWaveTrail.slice(-this.maxBowTrailLength);
        }
    }
    
    draw(ctx) {
        // Draw wake trail
        this.drawWakeTrail(ctx);
        
        // Save context state
        ctx.save();
        
        // Move to ship center
        ctx.translate(this.x, this.y);
        
        // Rotate to current angle
        // Adjust rotation to account for ship image orientation (bow points right in image)
        ctx.rotate(this.angle - Math.PI/2);
        
        // Draw ship relative to center
        if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback - simple triangle
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.moveTo(0, -25); // bow
            ctx.lineTo(-15, 20); // port side
            ctx.lineTo(15, 20); // starboard side
            ctx.closePath();
            ctx.fill();
            
            // Sails
            ctx.fillStyle = '#f5f5dc';
            ctx.fillRect(-12, -10, 24, 20);
        }
        
        // Restore context state
        ctx.restore();
        
        // Draw additional effects
        this.drawSpeedEffects(ctx);
    }
    
    drawWakeTrail(ctx) {
        ctx.save();
        
        // ===== SMOOTH V-SHAPED TRAIL DRAWING CODE =====
        // This section controls HOW the V-trails are drawn and their appearance
        
        // Draw V-shaped bow wave trail
        if (this.bowWaveTrail.length > 0) {
            const spreadAngle = Math.PI / 6; // 30 degrees spread for more visible V
            // To adjust V-shape angle: change this value
            // - Math.PI / 8 = 22.5 degrees (narrower V)
            // - Math.PI / 6 = 30 degrees (current)
            // - Math.PI / 4 = 45 degrees (wider V)
            
            // Draw each segment of the bow wave trail
            for (let i = 0; i < this.bowWaveTrail.length - 1; i++) {
                const currentPoint = this.bowWaveTrail[i];
                const nextPoint = this.bowWaveTrail[i + 1];
                
                // Use the stored smoothed angle for this trail segment
                const shipAngle = currentPoint.shipAngle || (this.angle - Math.PI/2);
                
                // Calculate trail length based on distance from ship
                const trailLength = this.vTrailBaseLength + (i * this.vTrailLengthGrowth);
                // V-TRAIL LENGTH IS NOW CONTROLLED BY:
                // - this.vTrailBaseLength (base length in pixels)
                // - this.vTrailLengthGrowth (length increase per segment)
                
                // ===== V-TRAIL DIRECTION CALCULATION =====
                // This controls which direction the V-trails point
                
                // Port side wave trail - SIMPLIFIED BACKWARD CALCULATION
                const portEndX = currentPoint.portX - Math.cos(shipAngle) * trailLength + Math.cos(shipAngle + Math.PI/2) * (trailLength * this.vTrailSpread);
                const portEndY = currentPoint.portY - Math.sin(shipAngle) * trailLength + Math.sin(shipAngle + Math.PI/2) * (trailLength * this.vTrailSpread);
                // V-TRAIL SPREAD IS NOW CONTROLLED BY: this.vTrailSpread
                
                // Starboard side wave trail - SIMPLIFIED BACKWARD CALCULATION
                const starboardEndX = currentPoint.starboardX - Math.cos(shipAngle) * trailLength - Math.cos(shipAngle + Math.PI/2) * (trailLength * this.vTrailSpread);
                const starboardEndY = currentPoint.starboardY - Math.sin(shipAngle) * trailLength - Math.sin(shipAngle + Math.PI/2) * (trailLength * this.vTrailSpread);
                // Note the minus sign before Math.cos(shipAngle + Math.PI/2) - this creates the V-shape
                
                // ===== V-TRAIL VISUAL PROPERTIES =====
                // This controls the appearance of the V-trails
                
                // Draw the wave trails with fading opacity
                ctx.strokeStyle = `rgba(255, 255, 255, ${currentPoint.opacity * this.vTrailOpacity})`;
                ctx.lineWidth = this.vTrailThickness * currentPoint.opacity;
                // V-TRAIL APPEARANCE IS NOW CONTROLLED BY:
                // - this.vTrailOpacity (0.0 = invisible, 1.0 = fully opaque)
                // - this.vTrailThickness (line thickness in pixels)
                
                // Port trail
                ctx.beginPath();
                ctx.moveTo(currentPoint.portX, currentPoint.portY);
                ctx.lineTo(portEndX, portEndY);
                ctx.stroke();
                
                // Starboard trail
                ctx.beginPath();
                ctx.moveTo(currentPoint.starboardX, currentPoint.starboardY);
                ctx.lineTo(starboardEndX, starboardEndY);
                ctx.stroke();
            }
        }
        
        // Draw the main wake trail behind the ship
        if (this.wakeTrail.length >= 2) {
            for (let i = 0; i < this.wakeTrail.length - 1; i++) {
                const point = this.wakeTrail[i];
                const nextPoint = this.wakeTrail[i + 1];
                
                // Calculate trail width based on distance from ship (wider at back)
                const distanceFromShip = i / this.wakeTrail.length;
                const trailWidth = 8 + (distanceFromShip * 12); // 8px at front, 20px at back
                
                // More transparent and wider wake trail
                ctx.strokeStyle = `rgba(255, 255, 255, ${point.opacity * 0.4})`;
                ctx.lineWidth = trailWidth * point.opacity;
                
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    drawSpeedEffects(ctx) {
        // Removed splash animation at ship bow for cleaner look
    }
    
    getInfo() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            angle: Math.round(this.angle * 180 / Math.PI),
            speed: Math.round(this.currentSpeed),
            direction: this.getDirectionString()
        };
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
    }
    
    setAngle(angle) {
        this.angle = angle;
    }
    
    drawDebugInfo(ctx) {
        // Draw collision radius
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw movement direction
        if (Math.abs(this.currentSpeed) > 5) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            const endX = this.x + Math.cos(this.angle - Math.PI/2) * 50;
            const endY = this.y + Math.sin(this.angle - Math.PI/2) * 50;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    getDirectionString() {
        const angle = this.angle * 180 / Math.PI;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(angle / 45) % 8;
        return directions[index < 0 ? index + 8 : index];
    }
} 